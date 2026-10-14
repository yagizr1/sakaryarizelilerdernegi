import { mountLayout } from "../../components/layout.js";
import { initApp } from "../app.js";
import { toast } from "../utils/helpers.js";
import { icon } from "../utils/icons.js";

initApp();

mountLayout({
  page: "mesajlar",
  subtitle: "Toplu iletişim kanalları",
  content: () => `
    <div class="page-header">
      <div>
        <h2 class="page-header__title">Mesajlar</h2>
        <p class="page-header__desc">Üyelere toplu SMS, e-posta ve WhatsApp gönderimi</p>
      </div>
    </div>

    <div class="grid-3 mb-24">
      <div class="channel-card">
        <div class="channel-card__icon channel-card__icon--sms">${icon("phone")}</div>
        <h3 class="channel-card__title">Toplu SMS</h3>
        <p class="channel-card__desc">Seçili üyelere veya tüm üyelere kısa mesaj gönderin.</p>
        <button class="btn btn--primary" data-channel="sms">${icon("send")} SMS Gönder</button>
      </div>
      <div class="channel-card">
        <div class="channel-card__icon channel-card__icon--email">${icon("mail")}</div>
        <h3 class="channel-card__title">Toplu E-posta</h3>
        <p class="channel-card__desc">Duyuru ve bilgilendirme e-postalarını toplu olarak iletin.</p>
        <button class="btn btn--primary" data-channel="email">${icon("send")} E-posta Gönder</button>
      </div>
      <div class="channel-card">
        <div class="channel-card__icon channel-card__icon--whatsapp">${icon("message-square")}</div>
        <h3 class="channel-card__title">WhatsApp</h3>
        <p class="channel-card__desc">WhatsApp üzerinden hızlı toplu mesajlaşma başlatın.</p>
        <button class="btn btn--primary" data-channel="whatsapp" style="background:#16a34a; box-shadow:0 6px 16px rgba(22,163,74,0.28);">
          ${icon("send")} WhatsApp Gönder
        </button>
      </div>
    </div>

    <div class="card">
      <div class="card__header">
        <div>
          <h3 class="card__title">Mesaj Oluştur</h3>
          <p class="card__subtitle">Demo form — gönderim yapılmaz</p>
        </div>
      </div>
      <div class="card__body">
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">Kanal</label>
            <select class="form-select" id="msg-channel">
              <option value="sms">SMS</option>
              <option value="email">E-posta</option>
              <option value="whatsapp">WhatsApp</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Hedef Kitle</label>
            <select class="form-select">
              <option>Tüm Üyeler</option>
              <option>Aktif Üyeler</option>
              <option>Borçlu Üyeler</option>
            </select>
          </div>
          <div class="form-group form-group--full">
            <label class="form-label">Konu / Başlık</label>
            <input class="form-input" type="text" placeholder="Mesaj başlığı" />
          </div>
          <div class="form-group form-group--full">
            <label class="form-label">Mesaj İçeriği</label>
            <textarea class="form-textarea" placeholder="Mesajınızı yazın..."></textarea>
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

document.querySelectorAll("[data-channel]").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.getElementById("msg-channel").value = btn.dataset.channel;
    toast(`${btn.dataset.channel.toUpperCase()} kanalı seçildi`);
  });
});

document.getElementById("btn-preview")?.addEventListener("click", () => toast("Önizleme — demo"));
document.getElementById("btn-send")?.addEventListener("click", () => toast("Gönderim demo aşamasında (backend yok)"));
