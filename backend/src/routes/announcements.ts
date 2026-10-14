import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma";
import { requireAdmin } from "../middleware/auth";

const router = Router();
router.use(requireAdmin);

const schema = z.object({
  title: z.string().min(1),
  description: z.string().optional().default(""),
  publishDate: z.string().optional().default(""),
});

router.get("/", async (_req, res) => {
  res.json(await prisma.announcement.findMany({ orderBy: { createdAt: "desc" } }));
});

router.post("/", async (req, res) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return void res.status(400).json({ message: "Geçersiz veri" });
  res.status(201).json(await prisma.announcement.create({ data: parsed.data }));
});

router.put("/:id", async (req, res) => {
  const parsed = schema.partial().safeParse(req.body);
  if (!parsed.success) return void res.status(400).json({ message: "Geçersiz veri" });
  try {
    res.json(await prisma.announcement.update({ where: { id: req.params.id }, data: parsed.data }));
  } catch {
    res.status(404).json({ message: "Kayıt bulunamadı" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await prisma.announcement.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch {
    res.status(404).json({ message: "Kayıt bulunamadı" });
  }
});

export default router;
