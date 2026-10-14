import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma";
import { requireAdmin } from "../middleware/auth";

const router = Router();
router.use(requireAdmin);

async function nextMemberNo() {
  const count = await prisma.member.count({ where: { memberNo: { not: "" } } });
  return `UYE-${String(count + 1).padStart(4, "0")}`;
}

router.get("/", async (req, res) => {
  const status = String(req.query.status || "beklemede");
  const q = String(req.query.q || "").trim().toLowerCase();
  const where: {
    status?: string | { in: string[] };
  } = status === "all" ? { status: { in: ["beklemede", "reddedildi"] } } : { status };

  const list = await prisma.memberApplication.findMany({
    where,
    orderBy: { appliedAt: "desc" },
  });

  const filtered = !q
    ? list
    : list.filter((m) => {
        const hay =
          `${m.firstName} ${m.lastName} ${m.nationalId} ${m.phone} ${m.email} ${m.profession} ${m.address}`.toLowerCase();
        return hay.includes(q);
      });

  res.json(
    filtered.map((m) => ({
      id: m.id,
      firstName: m.firstName,
      lastName: m.lastName,
      nationalId: m.nationalId,
      phone: m.phone,
      email: m.email,
      birthDate: m.birthDate,
      address: m.address,
      profession: m.profession,
      status: m.status,
      rejectReason: m.rejectReason,
      appliedAt: m.appliedAt,
      createdAt: m.createdAt,
    }))
  );
});

router.post("/:id/approve", async (req, res) => {
  const app = await prisma.memberApplication.findUnique({ where: { id: req.params.id } });
  if (!app) return void res.status(404).json({ message: "Başvuru bulunamadı" });
  if (app.status !== "beklemede" && app.status !== "reddedildi") {
    res.status(400).json({ message: "Bu başvuru onaylanamaz" });
    return;
  }

  const dup = await prisma.member.findFirst({ where: { nationalId: app.nationalId } });
  if (dup) {
    res.status(409).json({ message: "Bu T.C. Kimlik No ile üye zaten kayıtlı" });
    return;
  }

  const today = new Date().toISOString().slice(0, 10);
  const memberNo = await nextMemberNo();

  const member = await prisma.$transaction(async (tx) => {
    const created = await tx.member.create({
      data: {
        firstName: app.firstName,
        lastName: app.lastName,
        phone: app.phone,
        email: app.email,
        address: app.address,
        profession: app.profession,
        nationalId: app.nationalId,
        birthDate: app.birthDate,
        passwordHash: app.passwordHash,
        status: "aktif",
        memberNo,
        joinDate: today,
      },
    });
    // Onaylanan + aynı TC'ye ait tüm başvuru artıkları silinsin
    await tx.memberApplication.deleteMany({ where: { nationalId: app.nationalId } });
    return created;
  });

  res.json(member);
});

router.post("/:id/reject", async (req, res) => {
  const parsed = z.object({ reason: z.string().optional().default("") }).safeParse(req.body || {});
  const app = await prisma.memberApplication.findUnique({ where: { id: req.params.id } });
  if (!app) return void res.status(404).json({ message: "Başvuru bulunamadı" });
  if (app.status !== "beklemede") {
    res.status(400).json({ message: "Sadece bekleyen başvurular reddedilebilir" });
    return;
  }
  const updated = await prisma.memberApplication.update({
    where: { id: app.id },
    data: {
      status: "reddedildi",
      rejectReason: parsed.success ? parsed.data.reason : "",
    },
  });
  res.json(updated);
});

/** Reddedilen / istenmeyen başvuruyu tamamen sil */
router.delete("/:id", async (req, res) => {
  try {
    await prisma.memberApplication.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch {
    res.status(404).json({ message: "Başvuru bulunamadı" });
  }
});

export default router;
