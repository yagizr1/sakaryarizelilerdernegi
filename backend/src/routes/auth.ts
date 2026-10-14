import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../prisma";
import { requireAuth, requireMember, signToken, type Role } from "../middleware/auth";

const router = Router();

async function adminLoginHandler(req: import("express").Request, res: import("express").Response) {
  const parsed = z
    .object({ email: z.string().min(3), password: z.string().min(1) })
    .safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Geçersiz bilgiler" });
    return;
  }
  const email = parsed.data.email.trim();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) {
    res.status(401).json({ message: "E-posta veya şifre hatalı" });
    return;
  }
  const role: Role = "ADMIN";
  const token = signToken({ userId: user.id, role, email: user.email });
  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role },
  });
}

router.post("/admin/login", adminLoginHandler);
router.post("/login", adminLoginHandler);

router.post("/member/login", async (req, res) => {
  const parsed = z
    .object({ nationalId: z.string().min(11).max(11), password: z.string().min(1) })
    .safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "T.C. Kimlik No ve şifre gerekli" });
    return;
  }
  const nationalId = parsed.data.nationalId.replace(/\D/g, "");

  // Önce onaylı üye kaydı var mı bak — eski reddedilmiş başvurular engellemesin
  const member = await prisma.member.findFirst({ where: { nationalId } });
  if (member?.passwordHash && (await bcrypt.compare(parsed.data.password, member.passwordHash))) {
    if (member.status !== "aktif") {
      res.status(403).json({ message: "Hesabınız giriş için uygun değil." });
      return;
    }
    // Temizlik: aynı TC'ye ait eski başvuru artıkları varsa sil
    await prisma.memberApplication.deleteMany({ where: { nationalId } });
    const role: Role = "MEMBER";
    const token = signToken({
      userId: member.id,
      role,
      memberId: member.id,
      email: member.email || undefined,
    });
    res.json({
      token,
      user: {
        id: member.id,
        name: `${member.firstName} ${member.lastName}`.trim(),
        email: member.email,
        role,
        memberId: member.id,
        status: member.status,
      },
    });
    return;
  }

  const pending = await prisma.memberApplication.findFirst({
    where: { nationalId, status: "beklemede" },
  });
  if (pending) {
    if (await bcrypt.compare(parsed.data.password, pending.passwordHash)) {
      res.status(403).json({
        message: "Başvurunuz henüz onaylanmadı. Lütfen yönetici onayını bekleyin.",
      });
      return;
    }
  }

  const rejected = await prisma.memberApplication.findFirst({
    where: { nationalId, status: "reddedildi" },
    orderBy: { updatedAt: "desc" },
  });
  if (rejected && (await bcrypt.compare(parsed.data.password, rejected.passwordHash))) {
    res.status(403).json({
      message: rejected.rejectReason
        ? `Başvurunuz reddedildi: ${rejected.rejectReason}`
        : "Başvurunuz reddedildi.",
    });
    return;
  }

  res.status(401).json({ message: "T.C. Kimlik No veya şifre hatalı" });
});

router.post("/member/register", async (req, res) => {
  const parsed = z
    .object({
      firstName: z.string().min(1),
      lastName: z.string().min(1),
      nationalId: z.string().regex(/^\d{11}$/),
      phone: z.string().min(10),
      email: z.string().optional().default(""),
      birthDate: z.string().optional().default(""),
      address: z.string().optional().default(""),
      profession: z.string().optional().default(""),
      password: z.string().min(6),
    })
    .safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Geçersiz kayıt bilgileri" });
    return;
  }
  const data = parsed.data;
  const nationalId = data.nationalId.replace(/\D/g, "");

  const existingMember = await prisma.member.findFirst({ where: { nationalId } });
  if (existingMember) {
    res.status(409).json({ message: "Bu T.C. Kimlik No ile üye kaydı zaten mevcut" });
    return;
  }
  const existingApp = await prisma.memberApplication.findFirst({
    where: { nationalId, status: "beklemede" },
  });
  if (existingApp) {
    res.status(409).json({ message: "Bu T.C. Kimlik No ile bekleyen başvuru zaten var" });
    return;
  }

  // Eski reddedilmiş başvuruları temizle; yeniden başvuru engellenmesin
  await prisma.memberApplication.deleteMany({
    where: { nationalId, status: "reddedildi" },
  });

  const passwordHash = await bcrypt.hash(data.password, 10);
  const application = await prisma.memberApplication.create({
    data: {
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      nationalId,
      phone: data.phone.trim(),
      email: (data.email || "").trim(),
      birthDate: data.birthDate || "",
      address: data.address || "",
      profession: data.profession || "",
      passwordHash,
      status: "beklemede",
      appliedAt: new Date(),
    },
  });
  res.status(201).json({
    ok: true,
    message: "Başvurunuz başarıyla alındı. Yönetici onayından sonra hesabınız aktif hale gelecektir.",
    id: application.id,
  });
});

router.get("/me", requireAuth, async (req, res) => {
  if (req.auth!.role === "ADMIN") {
    const user = await prisma.user.findUnique({ where: { id: req.auth!.userId } });
    if (!user) return void res.status(404).json({ message: "Kullanıcı bulunamadı" });
    res.json({ id: user.id, name: user.name, email: user.email, role: "ADMIN" as const });
    return;
  }
  const member = await prisma.member.findUnique({ where: { id: req.auth!.memberId! } });
  if (!member) return void res.status(404).json({ message: "Üye bulunamadı" });
  res.json({
    id: member.id,
    name: `${member.firstName} ${member.lastName}`.trim(),
    email: member.email,
    role: "MEMBER" as const,
    memberId: member.id,
    status: member.status,
  });
});

router.post("/member/change-password", requireMember, async (req, res) => {
  const parsed = z
    .object({ currentPassword: z.string().min(1), newPassword: z.string().min(6) })
    .safeParse(req.body);
  if (!parsed.success) return void res.status(400).json({ message: "Geçersiz veri" });
  const member = await prisma.member.findUnique({ where: { id: req.auth!.memberId! } });
  if (!member?.passwordHash || !(await bcrypt.compare(parsed.data.currentPassword, member.passwordHash))) {
    res.status(400).json({ message: "Mevcut şifre hatalı" });
    return;
  }
  await prisma.member.update({
    where: { id: member.id },
    data: { passwordHash: await bcrypt.hash(parsed.data.newPassword, 10) },
  });
  res.json({ ok: true });
});

export default router;
