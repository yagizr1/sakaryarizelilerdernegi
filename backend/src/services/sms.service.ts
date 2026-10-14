import { env } from "../config/env";

export type SmsSendResult = {
  ok: boolean;
  externalId?: string;
  error?: string;
};

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("90")) return digits;
  if (digits.startsWith("0")) return `90${digits.slice(1)}`;
  if (digits.length === 10) return `90${digits}`;
  return digits;
}

async function sendViaNetgsm(phone: string, message: string): Promise<SmsSendResult> {
  const { NETGSM_USERCODE, NETGSM_PASSWORD, NETGSM_HEADER } = env;
  if (!NETGSM_USERCODE || !NETGSM_PASSWORD || !NETGSM_HEADER) {
    return { ok: false, error: "Netgsm bilgileri eksik" };
  }

  const url = new URL("https://api.netgsm.com.tr/sms/send/get");
  url.searchParams.set("usercode", NETGSM_USERCODE);
  url.searchParams.set("password", NETGSM_PASSWORD);
  url.searchParams.set("gsmno", normalizePhone(phone));
  url.searchParams.set("message", message);
  url.searchParams.set("msgheader", NETGSM_HEADER);

  try {
    const response = await fetch(url.toString());
    const text = (await response.text()).trim();
    if (text.startsWith("00") || text.startsWith("01") || text.startsWith("02")) {
      return { ok: true, externalId: text };
    }
    return { ok: false, error: text || "Netgsm hatası" };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Netgsm isteği başarısız" };
  }
}

export async function sendSms(phone: string, message: string): Promise<SmsSendResult> {
  const cleaned = phone.trim();
  if (!cleaned) return { ok: false, error: "Telefon gerekli" };

  if (!env.SMS_ENABLED) {
    console.log(`[SMS mock] ${cleaned}: ${message.slice(0, 120)}`);
    return { ok: true, externalId: `mock-${Date.now()}` };
  }

  if (env.SMS_PROVIDER === "netgsm") {
    return sendViaNetgsm(cleaned, message);
  }

  console.log(`[SMS mock] ${cleaned}: ${message.slice(0, 120)}`);
  return { ok: true, externalId: `mock-${Date.now()}` };
}

export function getSmsStatus() {
  return {
    enabled: env.SMS_ENABLED,
    provider: env.SMS_PROVIDER,
    configured:
      env.SMS_PROVIDER === "mock" ||
      Boolean(env.NETGSM_USERCODE && env.NETGSM_PASSWORD && env.NETGSM_HEADER),
    mock: !env.SMS_ENABLED || env.SMS_PROVIDER === "mock",
  };
}
