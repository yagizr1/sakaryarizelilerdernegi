import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { prisma } from "../prisma";
import { requireAdmin } from "../middleware/auth";

const router = Router();
router.use(requireAdmin);

const uploadsDir = path.join(process.cwd(), "uploads", "documents");
fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase().slice(0, 20);
    cb(null, `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
});

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

router.get("/", async (_req, res) => {
  res.json(await prisma.document.findMany({ orderBy: { createdAt: "desc" } }));
});

router.post("/", (req, res) => {
  upload.single("file")(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        res.status(400).json({ message: "Dosya en fazla 20 MB olabilir" });
        return;
      }
      res.status(400).json({ message: err.message });
      return;
    }
    if (err) {
      res.status(400).json({ message: "Yükleme başarısız" });
      return;
    }
    if (!req.file) {
      res.status(400).json({ message: "Dosya seçin" });
      return;
    }

    const original = req.file.originalname;
    const displayName =
      (typeof req.body?.name === "string" && req.body.name.trim()) || original;
    const ext = path.extname(original).replace(".", "").toLowerCase() || "dosya";

    try {
      const doc = await prisma.document.create({
        data: {
          name: displayName,
          type: ext,
          size: formatSize(req.file.size),
          date: todayISO(),
          storageKey: req.file.filename,
        },
      });
      res.status(201).json(doc);
    } catch {
      try {
        fs.unlinkSync(req.file.path);
      } catch {
        /* ignore */
      }
      res.status(500).json({ message: "Belge kaydedilemedi" });
    }
  });
});

router.get("/:id/download", async (req, res) => {
  try {
    const doc = await prisma.document.findUnique({ where: { id: req.params.id } });
    if (!doc || !doc.storageKey) {
      res.status(404).json({ message: "Dosya bulunamadı" });
      return;
    }
    const filePath = path.join(uploadsDir, path.basename(doc.storageKey));
    if (!fs.existsSync(filePath)) {
      res.status(404).json({ message: "Dosya diskte yok" });
      return;
    }
    res.download(filePath, doc.name);
  } catch {
    res.status(404).json({ message: "Dosya bulunamadı" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const doc = await prisma.document.findUnique({ where: { id: req.params.id } });
    if (!doc) {
      res.status(404).json({ message: "Kayıt bulunamadı" });
      return;
    }
    await prisma.document.delete({ where: { id: doc.id } });
    if (doc.storageKey) {
      const filePath = path.join(uploadsDir, path.basename(doc.storageKey));
      try {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      } catch {
        /* ignore */
      }
    }
    res.json({ ok: true });
  } catch {
    res.status(404).json({ message: "Kayıt bulunamadı" });
  }
});

export default router;
