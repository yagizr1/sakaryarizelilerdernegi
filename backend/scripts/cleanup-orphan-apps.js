const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();
(async () => {
  const members = await p.member.findMany({ select: { nationalId: true } });
  const ids = members.map((m) => m.nationalId).filter(Boolean);
  const r = ids.length
    ? await p.memberApplication.deleteMany({ where: { nationalId: { in: ids } } })
    : { count: 0 };
  console.log("cleaned orphan apps:", r.count);
  await p.$disconnect();
})().catch(async (e) => {
  console.error(e);
  await p.$disconnect();
  process.exit(1);
});
