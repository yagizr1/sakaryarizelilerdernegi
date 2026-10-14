import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma";
import { requireAdmin } from "../middleware/auth";
import { getMailStatus } from "../mail/mail.service";
import { getSmsStatus } from "../services/sms.service";
import {
  defaultTemplates,
  fillTemplate,
  notifyMany,
  notifyMember,
} from "../services/notify.service";

const router = Router();
router.use(requireAdmin);

function money(n: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(n || 0);
}

function formatDate(raw: string) {
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[3]}.${iso[2]}.${iso[1]}`;
  return raw || "—";
}

function monthLabel(raw: string) {
  const months = [
    "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
    "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
  ];
  const iso = raw.match(/^(\d{4})-(\d{2})/);
  if (iso) return `${months[Number(iso[2]) - 1]} ${iso[1]}`;
  const tr = raw.match(/\.(\d{1,2})\.(\d{4})/);
  if (tr) return `${months[Number(tr[1]) - 1]} ${tr[2]}`;
  return raw || "Aidat";
}

router.get("/status", (_req, res) => {
  res.json({
    mail: getMailStatus(),
    sms: getSmsStatus(),
    templates: defaultTemplates,
  });
});

router.get("/logs", async (req, res) => {
  const take = Math.min(Number(req.query.limit) || 50, 200);
  const logs = await prisma.messageLog.findMany({
    orderBy: { createdAt: "desc" },
    take,
  });
  res.json(logs);
});

router.get("/recipients", async (req, res) => {
  const filter = String(req.query.filter || "all");
  const q = String(req.query.q || "").toLocaleLowerCase("tr-TR");

  let members = await prisma.member.findMany({
    where: { status: "aktif" },
    orderBy: { firstName: "asc" },
  });

  if (filter === "with_email") members = members.filter((m) => m.email.trim());
  if (filter === "with_phone") members = members.filter((m) => m.phone.trim());
  if (filter === "unpaid_dues") {
    const unpaid = await prisma.due.findMany({
      where: { status: { not: "odendi" } },
      select: { memberId: true },
    });
    const ids = new Set(unpaid.map((d) => d.memberId));
    members = members.filter((m) => ids.has(m.id));
  }

  if (q) {
    members = members.filter((m) =>
      `${m.firstName} ${m.lastName} ${m.phone} ${m.email}`.toLocaleLowerCase("tr-TR").includes(q)
    );
  }

  res.json(
    members.map((m) => ({
      id: m.id,
      name: `${m.firstName} ${m.lastName}`,
      phone: m.phone,
      email: m.email,
    }))
  );
});

const sendSchema = z.object({
  memberIds: z.array(z.string()).min(1),
  channel: z.enum(["email", "sms", "both"]),
  type: z.enum(["dues_reminder", "event_notice", "custom"]).default("custom"),
  subject: z.string().min(1),
  body: z.string().min(1),
});

router.post("/send", async (req, res) => {
  const parsed = sendSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Geçersiz veri" });
    return;
  }
  const result = await notifyMany(parsed.data.memberIds, parsed.data);
  res.json(result);
});

router.post("/dues-reminder", async (req, res) => {
  const schema = z.object({
    dueIds: z.array(z.string()).min(1).optional(),
    memberIds: z.array(z.string()).min(1).optional(),
    channel: z.enum(["email", "sms", "both"]).default("both"),
    body: z.string().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Geçersiz veri" });
    return;
  }

  let dues = await prisma.due.findMany({
    where: {
      status: { not: "odendi" },
      ...(parsed.data.dueIds?.length ? { id: { in: parsed.data.dueIds } } : {}),
      ...(parsed.data.memberIds?.length ? { memberId: { in: parsed.data.memberIds } } : {}),
    },
    include: { member: true },
  });

  if (!dues.length) {
    res.status(400).json({ message: "Hatırlatılacak aidat bulunamadı" });
    return;
  }

  let sent = 0;
  let failed = 0;

  for (const due of dues) {
    const m = due.member;
    const vars = {
      ad: m.firstName,
      soyad: m.lastName,
      ay: monthLabel(due.dueDate),
      tutar: money(due.amount),
      son_odeme: formatDate(due.dueDate),
      "son_ödeme": formatDate(due.dueDate),
      durum: due.status === "odendi" ? "Ödendi" : "Bekleniyor",
    };
    const body = fillTemplate(parsed.data.body || defaultTemplates.dues_reminder, vars);
    const subject = `${vars.ay} Aidat Hatırlatması`;
    const resNotify = await notifyMember({
      memberId: m.id,
      channel: parsed.data.channel,
      type: "dues_reminder",
      subject,
      body,
    });
    const ok = (!resNotify.email || resNotify.email.ok) && (!resNotify.sms || resNotify.sms.ok);
    if (ok) sent += 1;
    else failed += 1;
  }

  res.json({ total: dues.length, sent, failed });
});

router.post("/event-notice", async (req, res) => {
  const schema = z.object({
    eventId: z.string().min(1),
    memberIds: z.array(z.string()).optional(),
    channel: z.enum(["email", "sms", "both"]).default("both"),
    body: z.string().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Geçersiz veri" });
    return;
  }

  const event = await prisma.event.findUnique({ where: { id: parsed.data.eventId } });
  if (!event) {
    res.status(404).json({ message: "Etkinlik bulunamadı" });
    return;
  }

  const members = await prisma.member.findMany({
    where: parsed.data.memberIds?.length
      ? { id: { in: parsed.data.memberIds } }
      : { status: "aktif" },
  });

  let sent = 0;
  let failed = 0;

  for (const m of members) {
    const vars = {
      ad: m.firstName,
      soyad: m.lastName,
      baslik: event.title,
      "başlık": event.title,
      tarih: event.date || "—",
      saat: event.time || "",
      konum: event.location || "—",
    };
    const body = fillTemplate(parsed.data.body || defaultTemplates.event_notice, vars);
    const subject = `Etkinlik: ${event.title}`;
    const resNotify = await notifyMember({
      memberId: m.id,
      channel: parsed.data.channel,
      type: "event_notice",
      subject,
      body,
    });
    const ok = (!resNotify.email || resNotify.email.ok) && (!resNotify.sms || resNotify.sms.ok);
    if (ok) sent += 1;
    else failed += 1;
  }

  res.json({ total: members.length, sent, failed });
});

export default router;
