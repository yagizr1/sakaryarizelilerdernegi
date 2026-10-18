import { mountLayout } from "../../components/layout.js";
import { initApp } from "../app.js";
import { toast } from "../utils/helpers.js";
import { icon } from "../utils/icons.js";

initApp();

const DEFAULT_WA =
  "Sayın üyemiz, Sakarya Rizeliler Derneği olarak sizi bilgilendirmek isteriz.";

function toWhatsAppPhone(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("90") && digits.length >= 12) return digits;
  if (digits.startsWith("0") && digits.length >= 11) return `90${digits.slice(1)}`;
  if (digits.length === 10) return `90${digits}`;
  return digits.length >= 10 ? digits : null;
}

function openWhatsApp(phone, message) {
  const normalized = toWhatsAppPhone(phone);
  if (!normalized) {
    toast("Geçerli telefon numarası girin");
    return;
  }
  const url = `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

mountLayout({
  page: "mesajlar",
  subtitle: "Toplu iletişim kanalları",
  content: () => `
    <div class="page-header">
      <div>
        <h2 class="page-header__title">Mesajlar</h2>
        <p class="page-header__desc">Üyelere toplu e-posta ve WhatsApp bilgilendirmesi</p>
      </div>
    </div>

    <div class="grid-2 mb-24">
      <div class="channel-card">
        <div class="channel-card__icon channel-card__icon--email">${icon("mail")}</div>
        <h3 class="channel-card__title">Toplu E-posta</h3>
        <p class="channel-card__desc">Duyuru ve bilgilendirme e-postalarını toplu olarak iletin.</p>
        <button class="btn btn--primary" data-channel="email">${icon("send")} E-posta Gönder</button>
      </div>
      <div class="channel-card">
        <div class="channel-card__icon channel-card__icon--whatsapp">${icon("message-square")}</div>
        <h3 class="channel-card__title">WhatsApp</h3>
        <p class="channel-card__desc">WhatsApp Click-to-Chat ile üye bilgilendirmesi başlatın.</p>
        <button class="btn btn--primary" data-channel="whatsapp" style="background:#16a34a; box-shadow:0 6px 16px rgba(22,163,74,0.28);">
          ${icon("send")} WhatsApp ile Bilgilendir
        </button>
      </div>
    </div>

    <div class="card">
      <div class="card__header">
        <div>
          <h3 class="card__title">Mesaj Oluştur</h3>
          <p class="card__subtitle">WhatsApp için telefon + mesaj; e-posta demo</p>
        </div>
      </div>
      <div class="card__body">
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">Kanal</label>
            <select class="form-select" id="msg-channel">
              <option value="email">E-posta</option>
              <option value="whatsapp">WhatsApp</option>
            </select>
          </div>
          <div class="form-group" id="wa-phone-group" style="display:none;">
            <label class="form-label">Telefon (ülke kodu ile)</label>
            <input class="form-input" id="wa-phone" type="tel" placeholder="0532 000 00 00" />
          </div>
          <div class="form-group">
            <label class="form-label">Hedef Kitle</label>
            <select class="form-select">
              <option>Tüm Üyeler</option>
              <option>Aktif Üyeler</option>
              <option>Borçlu Üyeler</option>
            </select>
          </div>
          <div class="form-group form-group--full" id="email-subject-group">
            <label class="form-label">Konu / Başlık</label>
            <input class="form-input" type="text" placeholder="Mesaj başlığı" />
          </div>
          <div class="form-group form-group--full">
            <label class="form-label">Mesaj İçeriği</label>
            <textarea class="form-textarea" id="msg-body" placeholder="Mesajınızı yazın...">${DEFAULT_WA}</textarea>
            <span class="form-hint">Kişiselleştirme: {{ad}}, {{soyad}}, {{aidat}}</span>
          </div>
        </div>
        <div class="btn-group mt-16">
          <button class="btn btn--outline" id="btn-preview">Önizle</button>
          <button class="btn btn--primary" id="btn-send">${icon("send")} Gönder</button>
        </div>
      </div>
    </div>
  `,
});

function syncChannelUi() {
  const channel = document.getElementById("msg-channel")?.value;
  const phoneGroup = document.getElementById("wa-phone-group");
  const subjectGroup = document.getElementById("email-subject-group");
  if (phoneGroup) phoneGroup.style.display = channel === "whatsapp" ? "" : "none";
  if (subjectGroup) subjectGroup.style.display = channel === "whatsapp" ? "none" : "";
}

document.querySelectorAll("[data-channel]").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.getElementById("msg-channel").value = btn.dataset.channel;
    syncChannelUi();
    toast(`${btn.dataset.channel === "whatsapp" ? "WhatsApp" : "E-posta"} kanalı seçildi`);
  });
});

document.getElementById("msg-channel")?.addEventListener("change", syncChannelUi);
syncChannelUi();

document.getElementById("btn-preview")?.addEventListener("click", () => toast("Önizleme — demo"));
document.getElementById("btn-send")?.addEventListener("click", () => {
  const channel = document.getElementById("msg-channel")?.value;
  const body = document.getElementById("msg-body")?.value || "";
  if (channel === "whatsapp") {
    openWhatsApp(document.getElementById("wa-phone")?.value || "", body);
    return;
  }
  toast("E-posta gönderimi demo aşamasında (backend yok)");
});
