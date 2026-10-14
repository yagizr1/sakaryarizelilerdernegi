export function money(n: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(n || 0);
}

export function initials(first: string, last: string) {
  return `${(first || "?")[0] || ""}${(last || "")[0] || ""}`.toUpperCase();
}

export const statusLabel: Record<string, string> = {
  aktif: "Aktif",
  pasif: "Pasif",
  beklemede: "Beklemede",
  reddedildi: "Reddedildi",
  odendi: "Ödendi",
  bekliyor: "Bekleniyor",
  odenmedi: "Ödenmedi",
  gecikti: "Ödenmedi",
  yaklasan: "Yaklaşan",
  tamamlandi: "Tamamlandı",
};

export const DUTY_OPTIONS = [
  { value: "uye", label: "Üye" },
  { value: "baskan", label: "Başkan" },
  { value: "baskan_yardimcisi", label: "Başkan Yardımcısı" },
  { value: "genel_sekreter", label: "Genel Sekreter" },
  { value: "sayman", label: "Sayman" },
  { value: "yonetim_kurulu_uyesi", label: "Yönetim Kurulu Üyesi" },
  { value: "denetim_kurulu_baskani", label: "Denetim Kurulu Başkanı" },
  { value: "denetim_kurulu_uyesi", label: "Denetim Kurulu Üyesi" },
  { value: "kadin_kollari_baskani", label: "Kadın Kolları Başkanı" },
  { value: "kadin_kollari_uyesi", label: "Kadın Kolları Üyesi" },
  { value: "genclik_kollari_baskani", label: "Gençlik Kolları Başkanı" },
  { value: "genclik_kollari_uyesi", label: "Gençlik Kolları Üyesi" },
] as const;

export const dutyLabel: Record<string, string> = Object.fromEntries(
  DUTY_OPTIONS.map((d) => [d.value, d.label])
);

/** Bugünün tarihi YYYY-MM-DD */
export function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Verilen ayın (veya bugünün ayının) son günü YYYY-MM-DD */
export function monthEndISO(year?: number, month?: number) {
  const d = new Date();
  const y = year ?? d.getFullYear();
  const m = month ?? d.getMonth() + 1;
  const day = new Date(y, m, 0).getDate();
  return `${y}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** date input (type=date) için YYYY-MM-DD */
export function toDateInputValue(raw: string) {
  if (!raw) return "";
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const tr = raw.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  if (tr) {
    return `${tr[3]}-${tr[2].padStart(2, "0")}-${tr[1].padStart(2, "0")}`;
  }
  if (/^\d{4}$/.test(raw.trim())) return `${raw.trim()}-01-01`;
  const d = new Date(raw);
  if (!Number.isNaN(d.getTime())) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }
  return "";
}

function parseDateParts(raw: string): { y: number; m: number } | null {
  if (!raw) return null;
  // YYYY-MM-DD
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return { y: Number(iso[1]), m: Number(iso[2]) - 1 };
  // DD.MM.YYYY
  const tr = raw.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  if (tr) return { y: Number(tr[3]), m: Number(tr[2]) - 1 };
  const d = new Date(raw);
  if (!Number.isNaN(d.getTime())) return { y: d.getFullYear(), m: d.getMonth() };
  return null;
}

export function formatDueDate(raw: string) {
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[3]}.${iso[2]}.${iso[1]}`;
  return raw || "—";
}

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

/** Örn: Temmuz 2026 */
export function formatDueMonth(raw: string) {
  const parts = parseDateParts(raw);
  if (!parts) return "Ay belirsiz";
  return `${MONTH_TR[parts.m]} ${parts.y}`;
}

/** Sıralama / grup için anahtar: 2026-07 */
export function dueMonthKey(raw: string) {
  const parts = parseDateParts(raw);
  if (!parts) return "0000-00";
  return `${parts.y}-${String(parts.m + 1).padStart(2, "0")}`;
}

/**
 * Ödendi → kullanıcı işaretlediyse.
 * Aynı ay / gelecek ay → Bekleniyor.
 * Son ödeme ayı geçtiyse → Ödenmedi (gecikti yok).
 */
export function effectiveDueStatus(status: string, dueDate: string) {
  if (status === "odendi") return "odendi";
  const parts = parseDateParts(dueDate);
  if (!parts) return "bekliyor";
  const now = new Date();
  const dueKey = parts.y * 12 + parts.m;
  const nowKey = now.getFullYear() * 12 + now.getMonth();
  if (nowKey > dueKey) return "odenmedi";
  return "bekliyor";
}
