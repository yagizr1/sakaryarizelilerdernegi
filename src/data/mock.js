/**
 * Mock data — boş başlangıç. Vue 3'e taşınırken src/data/ veya pinia store olarak kullanılabilir.
 */
export const dernekBilgileri = {
  ad: "",
  kisaAd: "",
  kurulus: "",
  vergiNo: "",
  adres: "",
  telefon: "",
  email: "",
  web: "",
};

export const currentUser = {
  ad: "Yönetici",
  rol: "Yönetici",
  initials: "Y",
};

export const uyeler = [];

export const aidatlar = [];

export const etkinlikler = [];

export const duyurular = [];

export const gelirGider = {
  toplamGelir: 0,
  toplamGider: 0,
  kasa: 0,
  islemler: [],
};

export const belgeler = [];

export const genelKurul = {
  tarih: "",
  saat: "",
  yer: "",
  gundem: "",
  katilanlar: [],
};

export const dashboardStats = {
  toplamUye: 0,
  borcluUye: 0,
  buAyAidat: 0,
  yaklasanEtkinlik: 0,
};

export const chartData = {
  gelirGiderAylik: {
    labels: [],
    gelir: [],
    gider: [],
  },
  aidatDurum: {
    labels: [],
    values: [],
  },
  ilceDagilim: {
    labels: [],
    values: [],
  },
  yeniUyeler: {
    labels: [],
    values: [],
  },
};

/** Vue Router tarzı rota tanımları */
export const routes = [
  { id: "dashboard", title: "Dashboard", path: "dashboard.html", section: "Ana Menü", icon: "layout-dashboard" },
  { id: "uyeler", title: "Üyeler", path: "uyeler.html", section: "Ana Menü", icon: "users" },
  { id: "aidatlar", title: "Aidatlar", path: "aidatlar.html", section: "Ana Menü", icon: "wallet" },
  { id: "etkinlikler", title: "Etkinlikler", path: "etkinlikler.html", section: "Ana Menü", icon: "calendar" },
  { id: "duyurular", title: "Duyurular", path: "duyurular.html", section: "İletişim", icon: "megaphone" },
  { id: "mesajlar", title: "Mesajlar", path: "mesajlar.html", section: "İletişim", icon: "message-square" },
  { id: "gelir-gider", title: "Gelir - Gider", path: "gelir-gider.html", section: "Finans", icon: "trending-up" },
  { id: "belgeler", title: "Belgeler", path: "belgeler.html", section: "Finans", icon: "folder" },
  { id: "genel-kurul", title: "Genel Kurul", path: "genel-kurul.html", section: "Yönetim", icon: "landmark" },
  { id: "raporlar", title: "Raporlar", path: "raporlar.html", section: "Yönetim", icon: "bar-chart-3" },
  { id: "ayarlar", title: "Ayarlar", path: "ayarlar.html", section: "Yönetim", icon: "settings" },
];
