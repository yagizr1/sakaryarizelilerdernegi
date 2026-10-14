import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma";
import { requireAdmin } from "../middleware/auth";

const router = Router();
router.use(requireAdmin);

const schema = z.object({
  name: z.string().optional(),
  shortName: z.string().optional(),
  founded: z.string().optional(),
  taxNo: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  website: z.string().optional(),
  monthlyDueAmount: z.number().min(0).optional(),
  monthlyDueFixed: z.boolean().optional(),
});

router.get("/", async (_req, res) => {
  const setting = await prisma.setting.findUnique({ where: { id: "main" } });
  res.json(setting || {});
});

router.put("/", async (req, res) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return void res.status(400).json({ message: "Geçersiz veri" });
  if (parsed.data.monthlyDueFixed === true) {
    const amount = parsed.data.monthlyDueAmount;
    if (amount === undefined || amount <= 0) {
      res.status(400).json({ message: "Sabit aylık aidat açıkken tutar 0'dan büyük olmalıdır" });
      return;
    }
  }
  const setting = await prisma.setting.upsert({
    where: { id: "main" },
    create: { id: "main", ...parsed.data },
    update: parsed.data,
  });
  res.json(setting);
});

export default router;
