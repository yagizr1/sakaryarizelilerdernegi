import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma";
import { requireMember } from "../middleware/auth";

const router = Router();
router.use(requireMember);

function memberId(req: import("express").Request) {
  return req.auth!.memberId!;
}

router.get("/dashboard", async (req, res) => {
  const id = memberId(req);
  const member = await prisma.member.findUnique({ where: { id } });
  if (!member) return void res.status(404).json({ message: "Üye bulunamadı" });

  const [dues, events, announcements, unpaid] = await Promise.all([
    prisma.due.findMany({ where: { memberId: id }, orderBy: { dueDate: "desc" }, take: 12 }),
    prisma.event.findMany({ where: { status: "yaklasan" }, orderBy: { date: "asc" }, take: 5 }),
    prisma.announcement.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.due.findMany({ where: { memberId: id, status: { not: "odendi" } } }),
  ]);

  const debt = unpaid.reduce((s, d) => s + d.amount, 0);
  const paidCount = dues.filter((d) => d.status === "odendi").length;

  res.json({
    member: {
      id: member.id,
      firstName: member.firstName,
      lastName: member.lastName,
      status: member.status,
      memberNo: member.memberNo,
      joinDate: member.joinDate,
    },
    duesSummary: {
      debt,
      unpaidCount: unpaid.length,
      paidCount,
      latestStatus: dues[0]?.status || "—",
    },
    upcomingEvents: events,
    announcements,
  });
});

router.get("/profile", async (req, res) => {
  const member = await prisma.member.findUnique({ where: { id: memberId(req) } });
  if (!member) return void res.status(404).json({ message: "Üye bulunamadı" });
  const { passwordHash: _, ...safe } = member;
  res.json(safe);
});

router.patch("/profile", async (req, res) => {
  const parsed = z
    .object({
      firstName: z.string().min(1).optional(),
      lastName: z.string().min(1).optional(),
      phone: z.string().optional(),
      email: z.string().optional(),
      address: z.string().optional(),
      birthDate: z.string().optional(),
      profession: z.string().optional(),
      photoUrl: z.string().optional(),
    })
    .safeParse(req.body);
  if (!parsed.success) return void res.status(400).json({ message: "Geçersiz veri" });
  const updated = await prisma.member.update({
    where: { id: memberId(req) },
    data: parsed.data,
  });
  const { passwordHash: _, ...safe } = updated;
  res.json(safe);
});

router.get("/dues", async (req, res) => {
  const dues = await prisma.due.findMany({
    where: { memberId: memberId(req) },
    orderBy: { dueDate: "desc" },
  });
  const unpaid = dues.filter((d) => d.status !== "odendi");
  res.json({
    debt: unpaid.reduce((s, d) => s + d.amount, 0),
    dues,
  });
});

router.get("/announcements", async (_req, res) => {
  res.json(await prisma.announcement.findMany({ orderBy: { createdAt: "desc" } }));
});

router.get("/events", async (req, res) => {
  const id = memberId(req);
  const events = await prisma.event.findMany({ orderBy: { date: "desc" } });
  const mine = await prisma.eventAttendance.findMany({ where: { memberId: id } });
  const attending = new Set(mine.map((a) => a.eventId));
  res.json(events.map((e) => ({ ...e, attending: attending.has(e.id) })));
});

router.post("/events/:id/attend", async (req, res) => {
  const eventId = req.params.id;
  const mid = memberId(req);
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) return void res.status(404).json({ message: "Etkinlik bulunamadı" });

  const existing = await prisma.eventAttendance.findUnique({
    where: { eventId_memberId: { eventId, memberId: mid } },
  });
  if (existing) {
    res.json({ ok: true, attending: true });
    return;
  }
  await prisma.eventAttendance.create({ data: { eventId, memberId: mid } });
  await prisma.event.update({
    where: { id: eventId },
    data: { attendees: { increment: 1 } },
  });
  res.json({ ok: true, attending: true });
});

router.get("/card", async (req, res) => {
  const member = await prisma.member.findUnique({ where: { id: memberId(req) } });
  if (!member) return void res.status(404).json({ message: "Üye bulunamadı" });
  const payload = JSON.stringify({
    no: member.memberNo || member.id.slice(-8),
    tc: member.nationalId,
    name: `${member.firstName} ${member.lastName}`.trim(),
  });
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(payload)}`;
  res.json({
    firstName: member.firstName,
    lastName: member.lastName,
    memberNo: member.memberNo || "—",
    status: member.status,
    joinDate: member.joinDate,
    qrUrl,
  });
});

router.get("/notifications", async (req, res) => {
  const id = memberId(req);
  const logs = await prisma.messageLog.findMany({
    where: { memberId: id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  res.json(logs);
});

router.patch("/settings", async (req, res) => {
  const parsed = z
    .object({
      notifyEmail: z.boolean().optional(),
      notifySms: z.boolean().optional(),
    })
    .safeParse(req.body);
  if (!parsed.success) return void res.status(400).json({ message: "Geçersiz veri" });
  const updated = await prisma.member.update({
    where: { id: memberId(req) },
    data: parsed.data,
  });
  res.json({ notifyEmail: updated.notifyEmail, notifySms: updated.notifySms });
});

export default router;
