import * as XLSX from "xlsx";

/** Excel sütunları (Türkçe başlık → alan) */
export const MEMBER_EXCEL_COLUMNS = [
  { key: "firstName", header: "ad", required: true },
  { key: "lastName", header: "soyad", required: true },
  { key: "nationalId", header: "tc_kimlik", required: false },
  { key: "phone", header: "telefon", required: false },
  { key: "email", header: "eposta", required: false },
  { key: "district", header: "ilce", required: false },
  { key: "address", header: "adres", required: false },
  { key: "profession", header: "meslek", required: false },
  { key: "bloodType", header: "kan_grubu", required: false },
  { key: "birthDate", header: "dogum_tarihi", required: false },
  { key: "joinDate", header: "uyelik_tarihi", required: false },
  { key: "status", header: "durum", required: false },
  { key: "duty", header: "gorev", required: false },
  { key: "debt", header: "borc", required: false },
  { key: "notes", header: "notlar", required: false },
  { key: "memberNo", header: "uye_no", required: false },
  { key: "password", header: "sifre", required: false },
] as const;

export type MemberExcelRow = {
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
  password: string;
};

const HEADER_TO_KEY = Object.fromEntries(
  MEMBER_EXCEL_COLUMNS.map((c) => [c.header.toLowerCase(), c.key])
) as Record<string, keyof MemberExcelRow>;

function cellStr(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "number" && Number.isFinite(v)) {
    if (Number.isInteger(v) && Math.abs(v) >= 1e11) return String(Math.trunc(v));
    return String(v);
  }
  return String(v).trim();
}

export function buildMemberTemplateWorkbook(): XLSX.WorkBook {
  const headers = MEMBER_EXCEL_COLUMNS.map((c) => c.header);
  const example: MemberExcelRow = {
    firstName: "Ahmet",
    lastName: "Yılmaz",
    nationalId: "12345678901",
    phone: "05321234567",
    email: "ahmet@ornek.com",
    district: "Adapazarı",
    address: "Örnek Mah. No:1",
    profession: "Mühendis",
    bloodType: "A+",
    birthDate: "1990-05-15",
    joinDate: "2024-01-10",
    status: "aktif",
    duty: "uye",
    debt: 0,
    notes: "",
    memberNo: "UYE-0001",
    password: "Gecis123!",
  };
  const dataRow = MEMBER_EXCEL_COLUMNS.map((c) => {
    const v = example[c.key];
    return typeof v === "number" ? v : v;
  });

  const sheet = XLSX.utils.aoa_to_sheet([headers, dataRow]);
  sheet["!cols"] = headers.map((h) => ({ wch: Math.max(12, h.length + 2) }));

  const help = XLSX.utils.aoa_to_sheet([
    ["Sakarya Rizeliler Derneği — Üye Excel şablonu"],
    [""],
    ["Nasıl kullanılır?"],
    ["1) Üyeler sayfasından bu şablonu indirin veya dışa aktarılan dosyayı düzenleyin."],
    ["2) Başlık satırını değiştirmeyin (ad, soyad, tc_kimlik, sifre ...)."],
    ["3) Her satır bir üyedir. Örnek satırı silip kendi verilerinizi yazın."],
    ["4) tc_kimlik doluysa içe aktarımda aynı TC güncellenir; yoksa yeni üye eklenir."],
    ["5) sifre kolonu: yeni üye için doldurun. Boş bırakılırsa geçici şifre üretilir."],
    ["6) Mevcut üyede sifre boşsa şifre değiştirilmez; doluysa yeni şifre atanır."],
    ["7) durum: aktif | pasif"],
    ["8) gorev: uye, baskan, baskan_yardimcisi, genel_sekreter, sayman, ..."],
    ["9) Tarihler: YYYY-MM-DD (örn. 1990-05-15)"],
    [""],
    ["ÖNEMLİ: Sistemde kayıtlı şifreler hash'lidir; dışa aktarımda gerçek eski şifreler görülemez."],
    ["Dışa aktarımda 'Yeni geçici şifre üret' seçerseniz her üyeye yeni şifre yazılır ve Excel'e konur."],
  ]);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheet, "Uyeler");
  XLSX.utils.book_append_sheet(wb, help, "Aciklama");
  return wb;
}

export function membersToWorkbook(
  rows: MemberExcelRow[],
  opts?: { includePasswordNote?: boolean }
): XLSX.WorkBook {
  const headers = MEMBER_EXCEL_COLUMNS.map((c) => c.header);
  const aoa: unknown[][] = [headers];
  for (const row of rows) {
    aoa.push(
      MEMBER_EXCEL_COLUMNS.map((c) => {
        const v = row[c.key];
        return v == null ? "" : v;
      })
    );
  }
  const sheet = XLSX.utils.aoa_to_sheet(aoa);
  sheet["!cols"] = headers.map((h) => ({ wch: Math.max(12, h.length + 2) }));

  const helpRows = [
    ["Sakarya Rizeliler Derneği — Üye dışa aktarım"],
    [`Satır sayısı: ${rows.length}`],
    [""],
    ["sifre kolonu:"],
    opts?.includePasswordNote
      ? ["Bu dosyada geçici şifreler üretilmiş ve sisteme yazılmıştır. Üyelere güvenli kanaldan iletin."]
      : [
          "Gerçek eski şifreler güvenlik nedeniyle dışa aktarılamaz (hash). sifre sütunu boş bırakılmıştır.",
        ],
    ["İçe aktarımda sifre doldurursanız o şifre atanır."],
  ];
  const help = XLSX.utils.aoa_to_sheet(helpRows);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheet, "Uyeler");
  XLSX.utils.book_append_sheet(wb, help, "Aciklama");
  return wb;
}

export function workbookToBuffer(wb: XLSX.WorkBook): Buffer {
  const out = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  return Buffer.from(out);
}

export function parseMemberExcel(buffer: Buffer): { rows: MemberExcelRow[]; errors: string[] } {
  const wb = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const sheetName =
    wb.SheetNames.find((n) => n.toLowerCase().includes("uye")) || wb.SheetNames[0];
  if (!sheetName) return { rows: [], errors: ["Excel sayfası bulunamadı"] };
  const sheet = wb.Sheets[sheetName]!;
  const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
    raw: false,
  });

  const errors: string[] = [];
  const rows: MemberExcelRow[] = [];

  json.forEach((raw, idx) => {
    const line = idx + 2;
    const mapped: Partial<MemberExcelRow> = {};
    for (const [header, value] of Object.entries(raw)) {
      const key = HEADER_TO_KEY[header.trim().toLowerCase()];
      if (!key) continue;
      if (key === "debt") {
        const n = Number(String(value).replace(",", "."));
        mapped.debt = Number.isFinite(n) ? n : 0;
      } else {
        let s = cellStr(value);
        if (key === "birthDate" || key === "joinDate") {
          if (/^\d{4}-\d{2}-\d{2}/.test(s)) s = s.slice(0, 10);
          else if (/^\d{1,2}\.\d{1,2}\.\d{4}$/.test(s)) {
            const [d, m, y] = s.split(".");
            s = `${y}-${m!.padStart(2, "0")}-${d!.padStart(2, "0")}`;
          }
        }
        (mapped as Record<string, string | number>)[key] = s;
      }
    }

    const firstName = String(mapped.firstName || "").trim();
    const lastName = String(mapped.lastName || "").trim();
    if (!firstName && !lastName) return;
    if (!firstName || !lastName) {
      errors.push(`Satır ${line}: ad ve soyad zorunlu`);
      return;
    }

    rows.push({
      firstName,
      lastName,
      nationalId: String(mapped.nationalId || "").replace(/\D/g, "").slice(0, 11),
      phone: String(mapped.phone || "").trim(),
      email: String(mapped.email || "").trim(),
      district: String(mapped.district || "").trim(),
      address: String(mapped.address || "").trim(),
      profession: String(mapped.profession || "").trim(),
      bloodType: String(mapped.bloodType || "").trim(),
      birthDate: String(mapped.birthDate || "").trim(),
      joinDate: String(mapped.joinDate || "").trim(),
      status: String(mapped.status || "aktif").trim().toLowerCase() === "pasif" ? "pasif" : "aktif",
      duty: String(mapped.duty || "uye").trim() || "uye",
      debt: typeof mapped.debt === "number" ? mapped.debt : 0,
      notes: String(mapped.notes || "").trim(),
      memberNo: String(mapped.memberNo || "").trim(),
      password: String(mapped.password || "").trim(),
    });
  });

  return { rows, errors };
}

export function randomTempPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let s = "";
  for (let i = 0; i < 10; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}
