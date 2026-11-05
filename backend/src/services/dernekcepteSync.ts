import { env } from "../config/env";
import { prisma } from "../prisma";

type SyncMember = {
  firstName: string;
  lastName: string;
  nationalId: string;
  phone: string;
  email: string;
  district: string;
  address: string;
  profession: string;
  bloodType: string;
  birthDate: string;
  joinDate: string;
  status: string;
  duty: string;
  debt: number;
  notes: string;
  memberNo: string;
  passwordHash: string;
  deactivate?: boolean;
};

function enabled(): boolean {
  return Boolean(
    env.DERNEKCEPTE_SYNC_ENABLED &&
      env.DERNEKCEPTE_SYNC_URL &&
      env.DERNEKCEPTE_SYNC_SECRET
  );
}

function toPayload(m: {
  firstName: string;
  lastName: string;
  nationalId: string;
  phone: string;
  email: string;
  district: string;
  address: string;
  profession: string;
  bloodType: string;
  birthDate: string;
  joinDate: string;
  status: string;
  duty: string;
  debt: number;
  notes: string;
  memberNo: string;
  passwordHash: string;
}): SyncMember | null {
  const nationalId = (m.nationalId || "").replace(/\D/g, "").slice(0, 11);
  if (nationalId.length < 5) return null;
  return {
    firstName: m.firstName,
    lastName: m.lastName,
    nationalId,
    phone: m.phone || "",
    email: m.email || "",
    district: m.district || "",
    address: m.address || "",
    profession: m.profession || "",
    bloodType: m.bloodType || "",
    birthDate: m.birthDate || "",
    joinDate: m.joinDate || "",
    status: m.status || "aktif",
    duty: m.duty || "uye",
    debt: m.debt || 0,
    notes: m.notes || "",
    memberNo: m.memberNo || "",
    passwordHash: m.passwordHash || "",
  };
}

async function postMembers(members: SyncMember[]): Promise<void> {
  if (!enabled() || members.length === 0) return;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 25_000);
  try {
    const res = await fetch(env.DERNEKCEPTE_SYNC_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Sync-Secret": env.DERNEKCEPTE_SYNC_SECRET,
      },
      body: JSON.stringify({
        orgSlug: env.DERNEKCEPTE_SYNC_ORG_SLUG,
        members,
      }),
      signal: ctrl.signal,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.warn(
        `[dernekcepte-sync] HTTP ${res.status}: ${text.slice(0, 200)}`
      );
    }
  } catch (e) {
    console.warn(
      `[dernekcepte-sync] ${e instanceof Error ? e.message : "bağlantı hatası"}`
    );
  } finally {
    clearTimeout(timer);
  }
}

/** Ana isteği asla bekletmez / bozmaz */
export function syncMemberSafe(
  member: Parameters<typeof toPayload>[0] | null | undefined,
  opts?: { deactivate?: boolean }
): void {
  if (!enabled() || !member) return;
  const payload = toPayload(member);
  if (!payload) return;
  if (opts?.deactivate) payload.deactivate = true;
  void postMembers([payload]);
}

export async function syncAllMembers(): Promise<{
  ok: boolean;
  sent: number;
  skippedNoTc: number;
  message?: string;
}> {
  if (!enabled()) {
    return { ok: false, sent: 0, skippedNoTc: 0, message: "Senkron kapalı" };
  }
  const all = await prisma.member.findMany({
    where: { status: { notIn: ["beklemede", "reddedildi"] } },
  });
  const members: SyncMember[] = [];
  let skippedNoTc = 0;
  for (const m of all) {
    const p = toPayload(m);
    if (!p) {
      skippedNoTc += 1;
      continue;
    }
    members.push(p);
  }
  // parçala
  const chunk = 200;
  for (let i = 0; i < members.length; i += chunk) {
    await postMembers(members.slice(i, i + chunk));
  }
  return { ok: true, sent: members.length, skippedNoTc };
}

let intervalStarted = false;

export function startDernekcepteSyncScheduler(): void {
  if (intervalStarted || !enabled()) return;
  intervalStarted = true;
  // ilk boot sonrası tam senkron
  setTimeout(() => {
    void syncAllMembers().then((r) =>
      console.log(`[dernekcepte-sync] boot: sent=${r.sent} skipTc=${r.skippedNoTc}`)
    );
  }, 15_000);
  // 15 dk'da bir uzlaşma
  setInterval(() => {
    void syncAllMembers().then((r) =>
      console.log(`[dernekcepte-sync] interval: sent=${r.sent}`)
    );
  }, 15 * 60 * 1000);
}
