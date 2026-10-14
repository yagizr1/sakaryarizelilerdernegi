import { Router } from "express";
import { prisma } from "../prisma";
import { requireAdmin } from "../middleware/auth";

const router = Router();
router.use(requireAdmin);

const MONTH_TR = [
  "Ocak",
  "Şubat",
  "Mart",
  "Nisan",
  "Mayıs",
  "Haziran",
  "Temmuz",
  "Ağustos",
  "Eylül",
  "Ekim",
  "Kasım",
  "Aralık",
];

type YMD = { y: number; m: number; d: number };

function parseYMD(raw: string): YMD | null {
  if (!raw) return null;
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return { y: Number(iso[1]), m: Number(iso[2]), d: Number(iso[3]) };
  const tr = raw.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  if (tr) return { y: Number(tr[3]), m: Number(tr[2]), d: Number(tr[1]) };
  const d = new Date(raw);
  if (!Number.isNaN(d.getTime())) {
    return { y: d.getFullYear(), m: d.getMonth() + 1, d: d.getDate() };
  }
  return null;
}

function fromDate(d: Date): YMD {
  return { y: d.getFullYear(), m: d.getMonth() + 1, d: d.getDate() };
}

function monthKey(y: number, m: number) {
  return `${y}-${String(m).padStart(2, "0")}`;
}

function yearKey(y: number) {
  return String(y);
}

type Bucket = {
  key: string;
  label: string;
  newMembers: number;
  payingMembers: Set<string>;
  paidDues: number;
  paidAmount: number;
  openDues: number;
  openAmount: number;
};

function emptyBucket(key: string, label: string): Bucket {
  return {
    key,
    label,
    newMembers: 0,
    payingMembers: new Set(),
    paidDues: 0,
    paidAmount: 0,
    openDues: 0,
    openAmount: 0,
  };
}

function serialize(b: Bucket) {
  return {
    key: b.key,
    label: b.label,
    newMembers: b.newMembers,
    payingMembers: b.payingMembers.size,
    paidDues: b.paidDues,
    paidAmount: b.paidAmount,
    openDues: b.openDues,
    openAmount: b.openAmount,
  };
}

router.get("/", async (_req, res) => {
  const [members, dues] = await Promise.all([
    prisma.member.findMany({
      where: { status: { in: ["aktif", "pasif"] } },
      select: { id: true, joinDate: true, createdAt: true },
    }),
    prisma.due.findMany({
      where: { member: { status: { in: ["aktif", "pasif"] } } },
      select: { id: true, memberId: true, amount: true, dueDate: true, status: true, createdAt: true, updatedAt: true },
    }),
  ]);

  const now = new Date();
  const currentYear = now.getFullYear();
  const monthly = new Map<string, Bucket>();
  const yearly = new Map<string, Bucket>();

  // Son 5 yılın Ocak→Aralık ayları (takvim sırası)
  for (let yi = 4; yi >= 0; yi--) {
    const y = currentYear - yi;
    yearly.set(yearKey(y), emptyBucket(yearKey(y), String(y)));
    for (let m = 1; m <= 12; m++) {
      const key = monthKey(y, m);
      monthly.set(key, emptyBucket(key, `${MONTH_TR[m - 1]} ${y}`));
    }
  }

  function ensureMonth(y: number, m: number) {
    const key = monthKey(y, m);
    if (!monthly.has(key)) monthly.set(key, emptyBucket(key, `${MONTH_TR[m - 1]} ${y}`));
    return monthly.get(key)!;
  }
  function ensureYear(y: number) {
    const key = yearKey(y);
    if (!yearly.has(key)) yearly.set(key, emptyBucket(key, String(y)));
    return yearly.get(key)!;
  }

  for (const mem of members) {
    const ymd = parseYMD(mem.joinDate) || fromDate(mem.createdAt);
    ensureMonth(ymd.y, ymd.m).newMembers += 1;
    ensureYear(ymd.y).newMembers += 1;
  }

  for (const due of dues) {
    const ymd =
      parseYMD(due.dueDate) ||
      fromDate(due.status === "odendi" ? due.updatedAt : due.createdAt);
    const mBucket = ensureMonth(ymd.y, ymd.m);
    const yBucket = ensureYear(ymd.y);

    if (due.status === "odendi") {
      mBucket.paidDues += 1;
      mBucket.paidAmount += due.amount;
      mBucket.payingMembers.add(due.memberId);
      yBucket.paidDues += 1;
      yBucket.paidAmount += due.amount;
      yBucket.payingMembers.add(due.memberId);
    } else {
      mBucket.openDues += 1;
      mBucket.openAmount += due.amount;
      yBucket.openDues += 1;
      yBucket.openAmount += due.amount;
    }
  }

  // Ocak → Aralık, yıllar artan (2022-01 … 2026-12)
  const months = [...monthly.keys()].sort().map((k) => serialize(monthly.get(k)!));
  const years = [...yearly.keys()].sort().map((k) => serialize(yearly.get(k)!));

  const curM = monthKey(now.getFullYear(), now.getMonth() + 1);
  const curY = yearKey(now.getFullYear());

  res.json({
    currentMonth: serialize(
      monthly.get(curM) || emptyBucket(curM, `${MONTH_TR[now.getMonth()]} ${now.getFullYear()}`)
    ),
    currentYear: serialize(yearly.get(curY) || emptyBucket(curY, curY)),
    monthly: months,
    yearly: years,
    totals: {
      members: members.length,
      paidDues: dues.filter((d) => d.status === "odendi").length,
      paidAmount: dues.filter((d) => d.status === "odendi").reduce((s, d) => s + d.amount, 0),
      openDues: dues.filter((d) => d.status !== "odendi").length,
    },
  });
});

export default router;
