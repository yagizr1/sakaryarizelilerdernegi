import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma";
import { requireAdmin } from "../middleware/auth";
import { syncDueFinance } from "../services/duesFinance.service";

const router = Router();
router.use(requireAdmin);

const schema = z.object({
  memberId: z.string().min(1),
  amount: z.number().positive(),
  dueDate: z.string().optional().default(""),
  status: z.enum(["odendi", "bekliyor", "odenmedi", "gecikti"]).optional().default("bekliyor"),
  receipt: z.string().optional().default(""),
  note: z.string().optional().default(""),
});

router.get("/", async (_req, res) => {
  const dues = await prisma.due.findMany({
    orderBy: { createdAt: "desc" },
    include: { member: true },
  });
  res.json(
    dues.map((d) => ({
      ...d,
      memberName: `${d.member.firstName} ${d.member.lastName}`,
    }))
  );
});

/** Aktif üyelere seçilen ay için aidat kaydı oluşturur (yoksa) */
router.post("/generate-month", async (req, res) => {
  const parsed = z
    .object({
      year: z.number().int().min(2000).max(2100).optional(),
      month: z.number().int().min(1).max(12).optional(),
      amount: z.number().positive().optional(),
    })
    .safeParse(req.body || {});
  if (!parsed.success) {
    res.status(400).json({ message: "Geçersiz veri" });
    return;
  }

  const now = new Date();
  const year = parsed.data.year ?? now.getFullYear();
  const month = parsed.data.month ?? now.getMonth() + 1;
  const monthPrefix = `${year}-${String(month).padStart(2, "0")}`;
  // Son ödeme: ayın son günü
  const lastDay = new Date(year, month, 0).getDate();
  const dueDate = `${monthPrefix}-${String(lastDay).padStart(2, "0")}`;

  const setting = await prisma.setting.findUnique({ where: { id: "main" } });
  const fixed = Boolean(setting?.monthlyDueFixed);
  // Sabit açık: ayar tutarı; kapalı: 0 — tutar sonra (kim ne yatırdıysa) girilir
  let amount = 0;
  if (fixed) {
    amount = parsed.data.amount ?? setting?.monthlyDueAmount ?? 0;
    if (!amount || amount <= 0) {
      res.status(400).json({
        message: "Sabit aylık aidat tutarı belirlenmeli (0'dan büyük).",
      });
      return;
    }
  }

  const members = await prisma.member.findMany({ where: { status: "aktif" } });
  const existing = await prisma.due.findMany({
    where: { dueDate: { startsWith: monthPrefix } },
    select: { memberId: true },
  });
  const hasDue = new Set(existing.map((d) => d.memberId));

  let created = 0;
  let skipped = 0;
  for (const m of members) {
    if (hasDue.has(m.id)) {
      skipped += 1;
      continue;
    }
    await prisma.due.create({
      data: {
        memberId: m.id,
        amount,
        dueDate,
        status: "bekliyor",
      },
    });
    if (amount > 0) {
      await prisma.member.update({
        where: { id: m.id },
        data: { debt: { increment: amount } },
      });
    }
    created += 1;
  }

  res.json({
    ok: true,
    year,
    month,
    amount,
    fixed,
    created,
    skipped,
    message: fixed
      ? `${monthPrefix} için ${created} aidat oluşturuldu${skipped ? `, ${skipped} zaten vardı` : ""}.`
      : `${monthPrefix} için ${created} aidat oluşturuldu (tutar serbest)${skipped ? `, ${skipped} zaten vardı` : ""}.`,
  });
});

router.post("/", async (req, res) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Geçersiz veri" });
    return;
  }
  const data = {
    ...parsed.data,
    status: parsed.data.status === "odendi" ? "odendi" : "bekliyor",
  };
  const due = await prisma.due.create({ data, include: { member: true } });
  if (data.status !== "odendi") {
    await prisma.member.update({
      where: { id: data.memberId },
      data: { debt: { increment: data.amount } },
    });
  } else {
    await syncDueFinance(due.id);
  }
  res.status(201).json(due);
});

router.put("/:id", async (req, res) => {
  const parsed = schema.partial().safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Geçersiz veri" });
    return;
  }
  try {
    const existing = await prisma.due.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      res.status(404).json({ message: "Kayıt bulunamadı" });
      return;
    }

    const nextStatusRaw = parsed.data.status;
    const nextStatus =
      nextStatusRaw === undefined
        ? existing.status
        : nextStatusRaw === "odendi"
          ? "odendi"
          : "bekliyor";
    const nextAmount = parsed.data.amount ?? existing.amount;
    const nextMemberId = parsed.data.memberId ?? existing.memberId;
    const wasPaid = existing.status === "odendi";
    const willPay = nextStatus === "odendi";

    if (willPay && (!(nextAmount > 0))) {
      res.status(400).json({ message: "Ödendi işaretlemek için tutar girilmeli" });
      return;
    }

    // Eski borç etkisini geri al
    if (!wasPaid) {
      await prisma.member.update({
        where: { id: existing.memberId },
        data: { debt: { decrement: existing.amount } },
      });
    }

    const due = await prisma.due.update({
      where: { id: req.params.id },
      data: {
        ...parsed.data,
        amount: nextAmount,
        memberId: nextMemberId,
        status: nextStatus,
      },
      include: { member: true },
    });

    // Yeni borç etkisini uygula
    if (!willPay) {
      await prisma.member.update({
        where: { id: nextMemberId },
        data: { debt: { increment: nextAmount } },
      });
    }

    await syncDueFinance(due.id);

    res.json(due);
  } catch {
    res.status(404).json({ message: "Kayıt bulunamadı" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const existing = await prisma.due.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      res.status(404).json({ message: "Kayıt bulunamadı" });
      return;
    }
    // FinanceEntry dueId ON DELETE CASCADE ile silinir
    await prisma.due.delete({ where: { id: req.params.id } });
    if (existing.status !== "odendi") {
      await prisma.member.update({
        where: { id: existing.memberId },
        data: { debt: { decrement: existing.amount } },
      });
    }
    res.json({ ok: true });
  } catch {
    res.status(404).json({ message: "Kayıt bulunamadı" });
  }
});

export default router;
