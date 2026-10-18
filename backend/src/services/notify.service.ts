import { prisma } from "../prisma";
import { renderMailTemplate } from "../mail/mailTemplate.service";
import { sendMail } from "../mail/mail.service";

export type NotifyChannel = "email";
export type NotifyType = "dues_reminder" | "event_notice" | "custom";

export type NotifyMemberInput = {
  memberId: string;
  channel: NotifyChannel;
  type: NotifyType;
  subject: string;
  body: string;
};

function foldTrKey(key: string) {
  return key
    .toLocaleLowerCase("tr-TR")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/i̇/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c");
}

export function fillTemplate(template: string, vars: Record<string, string>) {
  const byFold = new Map<string, string>();
  for (const [k, v] of Object.entries(vars)) {
    byFold.set(foldTrKey(k), v);
  }
  return template.replace(/\{([^}]+)\}/g, (_, key: string) => {
    if (Object.prototype.hasOwnProperty.call(vars, key)) return vars[key] ?? "";
    return byFold.get(foldTrKey(key)) ?? "";
  });
}

export const defaultTemplates = {
  dues_reminder:
    "Sayın {ad} {soyad}, {ay} aidatınız ({tutar}) için hatırlatma. Son ödeme: {son_ödeme}. Durum: {durum}.",
  event_notice:
    "Sayın {ad} {soyad}, etkinlik hatırlatması: {başlık} — {tarih} {saat}, {konum}.",
};

async function logMessage(data: {
  channel: string;
  type: string;
  memberId: string;
  memberName: string;
  to: string;
  subject: string;
  body: string;
  status: string;
  error?: string;
  externalId?: string;
}) {
  return prisma.messageLog.create({
    data: {
      channel: data.channel,
      type: data.type,
      memberId: data.memberId,
      memberName: data.memberName,
      to: data.to,
      subject: data.subject,
      body: data.body,
      status: data.status,
      error: data.error || "",
      externalId: data.externalId || "",
    },
  });
}

export async function notifyMember(input: NotifyMemberInput) {
  const member = await prisma.member.findUnique({ where: { id: input.memberId } });
  if (!member) {
    return { email: null, error: "Üye bulunamadı" };
  }

  const memberName = `${member.firstName} ${member.lastName}`.trim();
  const results: {
    email: { ok: boolean; error?: string } | null;
  } = { email: null };

  if (!member.email.trim()) {
    results.email = { ok: false, error: "Üyenin e-postası yok" };
    await logMessage({
      channel: "email",
      type: input.type,
      memberId: member.id,
      memberName,
      to: "",
      subject: input.subject,
      body: input.body,
      status: "skipped",
      error: "E-posta yok",
    });
  } else {
    const { html, text } = renderMailTemplate("notification-reminder", {
      title: input.subject,
      body: input.body,
      memberName,
    });
    const res = await sendMail({
      to: member.email,
      subject: input.subject,
      text,
      html,
    });
    results.email = { ok: res.ok, error: res.error };
    await logMessage({
      channel: "email",
      type: input.type,
      memberId: member.id,
      memberName,
      to: member.email,
      subject: input.subject,
      body: input.body,
      status: res.ok ? "sent" : "failed",
      error: res.error,
      externalId: res.messageId,
    });
  }

  return results;
}

export async function notifyMany(
  memberIds: string[],
  opts: { channel: NotifyChannel; type: NotifyType; subject: string; body: string }
) {
  let sent = 0;
  let failed = 0;
  const details: Array<{ memberId: string; email?: unknown }> = [];

  for (const memberId of memberIds) {
    const member = await prisma.member.findUnique({ where: { id: memberId } });
    const vars = {
      ad: member?.firstName || "",
      soyad: member?.lastName || "",
    };
    const body = fillTemplate(opts.body, vars);
    const subject = fillTemplate(opts.subject, vars);
    const res = await notifyMember({
      memberId,
      channel: opts.channel,
      type: opts.type,
      subject,
      body,
    });
    const okEmail = !res.email || res.email.ok;
    if (okEmail && res.email) sent += 1;
    else failed += 1;
    details.push({ memberId, email: res.email });
  }

  return { total: memberIds.length, sent, failed, details };
}
