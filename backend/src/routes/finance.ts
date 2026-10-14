import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma";
import { requireAdmin } from "../middleware/auth";

const router = Router();
router.use(requireAdmin);

const schema = z.object({
  date: z.string().optional().default(""),
  description: z.string().min(1),
  category: z.string().optional().default(""),
  type: z.enum(["gelir", "gider"]),
  amount: z.number().positive(),
});

router.get("/", async (_req, res) => {
  const entries = await prisma.financeEntry.findMany({ orderBy: { createdAt: "desc" } });
  const gelir = entries.filter((e) => e.type === "gelir").reduce((s, e) => s + e.amount, 0);
  const gider = entries.filter((e) => e.type === "gider").reduce((s, e) => s + e.amount, 0);
  res.json({ toplamGelir: gelir, toplamGider: gider, kasa: gelir - gider, entries });
});

router.post("/", async (req, res) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return void res.status(400).json({ message: "Geçersiz veri" });
  res.status(201).json(await prisma.financeEntry.create({ data: parsed.data }));
});

router.delete("/:id", async (req, res) => {
  try {
    const existing = await prisma.financeEntry.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      res.status(404).json({ message: "Kayıt bulunamadı" });
      return;
    }
    if (existing.dueId) {
      res.status(400).json({ message: "Aidattan oluşan kayıt silinemez. Aidatı silin veya durumunu değiştirin." });
      return;
    }
    await prisma.financeEntry.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch {
    res.status(404).json({ message: "Kayıt bulunamadı" });
  }
});

export default router;
