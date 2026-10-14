import { Router } from "express";
import { prisma } from "../prisma";
import { requireAdmin } from "../middleware/auth";

const router = Router();
router.use(requireAdmin);

router.get("/", async (_req, res) => {
  const [
    toplamUye,
    aktifUye,
    beklemede,
    pasifUye,
    yaklasanEtkinlik,
    dues,
    members,
    events,
    finance,
  ] = await Promise.all([
    prisma.member.count({ where: { status: { in: ["aktif", "pasif"] } } }),
    prisma.member.count({ where: { status: "aktif" } }),
    prisma.memberApplication.count({ where: { status: "beklemede" } }),
    prisma.member.count({ where: { status: "pasif" } }),
    prisma.event.count({ where: { status: "yaklasan" } }),
    prisma.due.findMany({ where: { status: "odendi" }, take: 200 }),
    prisma.member.findMany({
      where: { status: { in: ["aktif", "pasif"] } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.event.findMany({ where: { status: "yaklasan" }, take: 3, orderBy: { createdAt: "desc" } }),
    prisma.financeEntry.findMany(),
  ]);

  const buAyAidat = dues.reduce((s, d) => s + d.amount, 0);
  const gelir = finance.filter((f) => f.type === "gelir").reduce((s, f) => s + f.amount, 0);
  const gider = finance.filter((f) => f.type === "gider").reduce((s, f) => s + f.amount, 0);

  const aidatAll = await prisma.due.groupBy({
    by: ["status"],
    _count: { status: true },
  });

  res.json({
    stats: {
      toplamUye,
      aktifUye,
      beklemede,
      pasifUye,
      buAyAidat,
      yaklasanEtkinlik,
    },
    recentMembers: members,
    upcomingEvents: events,
    financeSummary: { gelir, gider, kasa: gelir - gider },
    charts: {
      aidat: aidatAll.map((a) => ({ label: a.status, value: a._count.status })),
    },
  });
});

export default router;
