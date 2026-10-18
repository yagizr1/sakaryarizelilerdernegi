/** Türkiye telefonunu WhatsApp uluslararası formatına çevirir (905XXXXXXXXX). */
export function toWhatsAppPhone(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("90") && digits.length >= 12) return digits;
  if (digits.startsWith("0") && digits.length >= 11) return `90${digits.slice(1)}`;
  if (digits.length === 10) return `90${digits}`;
  return digits.length >= 10 ? digits : null;
}

export function buildWhatsAppUrl(phone: string, message: string): string | null {
  const normalized = toWhatsAppPhone(phone);
  if (!normalized) return null;
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}

/** WhatsApp Click-to-Chat penceresini açar. Telefon yoksa false döner. */
export function openWhatsAppChat(phone: string, message: string): boolean {
  const url = buildWhatsAppUrl(phone, message);
  if (!url) return false;
  window.open(url, "_blank", "noopener,noreferrer");
  return true;
}

export const DEFAULT_WHATSAPP_TEMPLATE =
  "Sayın üyemiz, Sakarya Rizeliler Derneği olarak sizi bilgilendirmek isteriz.";
