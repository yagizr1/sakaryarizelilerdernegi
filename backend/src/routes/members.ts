import { Router } from "express";
import multer from "multer";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../prisma";
import { requireAdmin } from "../middleware/auth";
import {
  buildMemberTemplateWorkbook,
  membersToWorkbook,
  parseMemberExcel,
  randomTempPassword,
  workbookToBuffer,
  type MemberExcelRow,
} from "../services/memberExcel";
import { syncAllMembers, syncMemberSafe } from "../services/dernekcepteSync";

const router = Router();
router.use(requireAdmin);

const excelUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const name = (file.originalname || "").toLowerCase();
    const ok =
      name.endsWith(".xlsx") ||
      name.endsWith(".xls") ||
      /spreadsheet|excel|csv/.test(file.mimetype || "");
    if (ok) cb(null, true);
    else cb(new Error("Yalnızca Excel (.xlsx) yükleyin"));
  },
});

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

/** Boş örnek Excel şablonu */
router.get("/excel/template", async (_req, res) => {
  const buf = workbookToBuffer(buildMemberTemplateWorkbook());
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader(
    "Content-Disposition",
    'attachment; filename="srd-uye-sablonu.xlsx"'
  );
  res.send(buf);
});

/**
 * Üyeleri Excel olarak dışa aktar.
 * ?withNewPasswords=1 → her üyeye yeni geçici şifre üretir, DB'ye yazar ve Excel'e koyar.
 */
router.get("/excel/export", async (req, res) => {
  const withNewPasswords =
    String(req.query.withNewPasswords || "") === "1" ||
    String(req.query.withNewPasswords || "").toLowerCase() === "true";

  const members = await prisma.member.findMany({
    where: {
      status: { notIn: ["beklemede", "reddedildi"] },
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });

  const rows: MemberExcelRow[] = [];
  for (const m of members) {
    let password = "";
    if (withNewPasswords) {
      password = randomTempPassword();
      await prisma.member.update({
        where: { id: m.id },
        data: { passwordHash: await bcrypt.hash(password, 10) },
      });
    }
    rows.push({
      firstName: m.firstName,
      lastName: m.lastName,
      nationalId: m.nationalId,
      phone: m.phone,
      email: m.email,
      district: m.district,
      address: m.address,
      profession: m.profession,
      bloodType: m.bloodType,
      birthDate: m.birthDate,
      joinDate: m.joinDate,
      status: m.status,
      duty: m.duty,
      debt: m.debt,
      notes: m.notes,
      memberNo: m.memberNo,
      password,
    });
  }

  const buf = workbookToBuffer(
    membersToWorkbook(rows, { includePasswordNote: withNewPasswords })
  );
  const stamp = new Date().toISOString().slice(0, 10);
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="uyeler-${stamp}.xlsx"`
  );
  res.send(buf);
});

/** Excel'den toplu üye içe aktar (oluştur / TC ile güncelle) */
router.post("/excel/import", (req, res) => {
  excelUpload.single("file")(req, res, async (err) => {
    if (err) {
      res.status(400).json({
        message: err instanceof Error ? err.message : "Dosya yüklenemedi",
      });
      return;
    }
    if (!req.file?.buffer) {
      res.status(400).json({ message: "Excel dosyası seçin (.xlsx)" });
      return;
    }

    const { rows, errors: parseErrors } = parseMemberExcel(req.file.buffer);
    if (!rows.length) {
      res.status(400).json({
        message: "Aktarılacak üye satırı bulunamadı",
        errors: parseErrors,
      });
      return;
    }

    let created = 0;
    let updated = 0;
    let skipped = 0;
    const rowErrors = [...parseErrors];

    for (const [i, row] of rows.entries()) {
      const line = i + 2;
      try {
        const duty = (DUTY_VALUES as readonly string[]).includes(row.duty)
          ? row.duty
          : "uye";

        const data = {
          firstName: row.firstName,
          lastName: row.lastName,
          phone: row.phone,
          email: row.email,
          district: row.district,
          address: row.address,
          profession: row.profession,
          bloodType: row.bloodType,
          nationalId: row.nationalId,
          birthDate: row.birthDate,
          joinDate: row.joinDate || new Date().toISOString().slice(0, 10),
          status: row.status === "pasif" ? "pasif" : "aktif",
          duty,
          debt: row.debt || 0,
          notes: row.notes,
          memberNo: row.memberNo,
        };

        let existing = null as Awaited<ReturnType<typeof prisma.member.findFirst>>;
        if (row.nationalId) {
          existing = await prisma.member.findFirst({
            where: { nationalId: row.nationalId },
          });
        }

        if (existing) {
          const patch: Record<string, unknown> = { ...data };
          if (row.password) {
            patch.passwordHash = await bcrypt.hash(row.password, 10);
          }
          await prisma.member.update({ where: { id: existing.id }, data: patch });
          updated += 1;
        } else {
          const password = row.password || randomTempPassword();
          await prisma.member.create({
            data: {
              ...data,
              passwordHash: await bcrypt.hash(password, 10),
            },
          });
          created += 1;
        }
      } catch (e) {
        skipped += 1;
        rowErrors.push(
          `Satır ${line}: ${e instanceof Error ? e.message : "kayıt hatası"}`
        );
      }
    }

    // Excel sonrası arka planda tam senkron (isteği bekletmez)
    void syncAllMembers();

    res.json({
      ok: true,
      created,
      updated,
      skipped,
      total: rows.length,
      errors: rowErrors.slice(0, 50),
      message: `${created} yeni, ${updated} güncellendi${skipped ? `, ${skipped} atlandı` : ""}.`,
    });
  });
});

/** Manuel / test: tüm üyeleri DernekCepte'ye gönder */
router.post("/sync-dernekcepte", async (_req, res) => {
  const result = await syncAllMembers();
  res.status(result.ok ? 200 : 503).json(result);
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
  syncMemberSafe(member);
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
    syncMemberSafe(member);
    res.json(member);
  } catch {
    res.status(404).json({ message: "Üye bulunamadı" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const existing = await prisma.member.findUnique({ where: { id: req.params.id } });
    // İlişkili aidat, katılım, oy kayıtları cascade ile silinir
    await prisma.member.delete({ where: { id: req.params.id } });
    if (existing) syncMemberSafe(existing, { deactivate: true });
    res.json({ ok: true });
  } catch {
    res.status(404).json({ message: "Üye bulunamadı" });
  }
});

export default router;
