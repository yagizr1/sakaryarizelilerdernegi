import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma";
import { requireAdmin } from "../middleware/auth";

const router = Router();
router.use(requireAdmin);

export const DUTY_VALUES = [
  "uye",
  "baskan",
  "baskan_yardimcisi",
  "genel_sekreter",
  "sayman",
  "yonetim_kurulu_uyesi",
  "denetim_kurulu_baskani",
  "denetim_kurulu_uyesi",
  "kadin_kollari_baskani",
  "kadin_kollari_uyesi",
  "genclik_kollari_baskani",
  "genclik_kollari_uyesi",
] as const;

const memberSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional().default(""),
  email: z.string().optional().default(""),
  district: z.string().optional().default(""),
  address: z.string().optional().default(""),
  profession: z.string().optional().default(""),
  bloodType: z.string().optional().default(""),
  nationalId: z.string().optional().default(""),
  birthDate: z.string().optional().default(""),
  joinDate: z.string().optional().default(""),
  status: z.enum(["aktif", "pasif"]).optional().default("aktif"),
  duty: z.enum(DUTY_VALUES).optional().default("uye"),
  debt: z.number().optional().default(0),
  notes: z.string().optional().default(""),
});

router.get("/", async (req, res) => {
  const q = String(req.query.q || "").toLowerCase();
  const status = String(req.query.status || "");
  const duty = String(req.query.duty || "");
  const members = await prisma.member.findMany({ orderBy: { createdAt: "desc" } });
  const filtered = members.filter((m) => {
    const hay = `${m.firstName} ${m.lastName} ${m.email} ${m.phone} ${m.nationalId} ${m.profession} ${m.address} ${m.duty}`.toLowerCase();
    const matchQ = !q || hay.includes(q);
    const inMemberList = !["beklemede", "reddedildi"].includes(m.status);
    const matchS =
      !status || status === "all"
        ? inMemberList
        : m.status === status;
    const matchD = !duty || duty === "all" || m.duty === duty;
    return matchQ && matchS && matchD;
  });
  res.json(filtered);
});

router.post("/bulk-duty", async (req, res) => {
  const parsed = z
    .object({
      memberIds: z.array(z.string().min(1)).min(1),
      duty: z.enum(DUTY_VALUES),
    })
    .safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Geçersiz veri" });
    return;
  }
  const { memberIds, duty } = parsed.data;
  const result = await prisma.member.updateMany({
    where: { id: { in: memberIds } },
    data: { duty },
  });
  res.json({ ok: true, updated: result.count, duty });
});

router.get("/:id", async (req, res) => {
  const member = await prisma.member.findUnique({
    where: { id: req.params.id },
    include: { dues: { orderBy: { createdAt: "desc" } } },
  });
  if (!member) {
    res.status(404).json({ message: "Üye bulunamadı" });
    return;
  }
  res.json(member);
});

router.post("/", async (req, res) => {
  const parsed = memberSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Geçersiz veri", errors: parsed.error.flatten() });
    return;
  }
  const member = await prisma.member.create({ data: parsed.data });
  res.status(201).json(member);
});

router.put("/:id", async (req, res) => {
  const parsed = memberSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Geçersiz veri" });
    return;
  }
  try {
    const member = await prisma.member.update({ where: { id: req.params.id }, data: parsed.data });
    res.json(member);
  } catch {
    res.status(404).json({ message: "Üye bulunamadı" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    // İlişkili aidat, katılım, oy kayıtları cascade ile silinir
    await prisma.member.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch {
    res.status(404).json({ message: "Üye bulunamadı" });
  }
});

export default router;
