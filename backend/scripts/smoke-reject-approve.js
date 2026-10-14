const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const base = process.env.API_URL || "http://127.0.0.1:4100";
const p = new PrismaClient();

async function json(path, opts = {}) {
  const res = await fetch(`${base}${path}`, {
    ...opts,
    headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${res.status} ${data.message || JSON.stringify(data)}`);
  return data;
}

(async () => {
  // Cleanup orphans for existing members
  const members = await p.member.findMany({ select: { nationalId: true } });
  const ids = members.map((m) => m.nationalId).filter(Boolean);
  if (ids.length) {
    const r = await p.memberApplication.deleteMany({ where: { nationalId: { in: ids } } });
    console.log("cleaned:", r.count);
  }

  const admin = await json("/api/auth/admin/login", {
    method: "POST",
    body: JSON.stringify({ email: "admin", password: "admin" }),
  });
  const auth = { Authorization: `Bearer ${admin.token}` };

  const nid = "4" + String(Math.floor(Math.random() * 1e10)).padStart(10, "0");
  const password = "sifre123";
  const body = {
    firstName: "Ali",
    lastName: "Test",
    nationalId: nid,
    phone: "05321112233",
    password,
  };

  await json("/api/auth/member/register", { method: "POST", body: JSON.stringify(body) });
  let apps = await json("/api/applications?status=beklemede", { headers: auth });
  let app = apps.find((a) => a.nationalId === nid);
  console.log("app1", app.id);

  await json(`/api/applications/${app.id}/reject`, {
    method: "POST",
    headers: auth,
    body: JSON.stringify({ reason: "eksik" }),
  });

  await json("/api/auth/member/register", { method: "POST", body: JSON.stringify(body) });
  apps = await json("/api/applications?status=beklemede", { headers: auth });
  app = apps.find((a) => a.nationalId === nid);
  console.log("app2", app.id);

  const member = await json(`/api/applications/${app.id}/approve`, {
    method: "POST",
    headers: auth,
    body: "{}",
  });
  console.log("approved", member.id, member.status);

  const leftover = await json("/api/applications?status=all", { headers: auth });
  console.log(
    "leftover for TC",
    leftover.filter((a) => a.nationalId === nid).length
  );

  // Also plant a fake rejected app to ensure login still works
  await p.memberApplication.create({
    data: {
      firstName: "X",
      lastName: "Y",
      nationalId: nid,
      passwordHash: await bcrypt.hash("x", 10),
      status: "reddedildi",
      rejectReason: "eski",
    },
  });

  const login = await json("/api/auth/member/login", {
    method: "POST",
    body: JSON.stringify({ nationalId: nid, password }),
  });
  console.log("LOGIN OK", login.user.name, login.user.role);

  await p.$disconnect();
})().catch(async (e) => {
  console.error("FAIL", e.message);
  await p.$disconnect();
  process.exit(1);
});
