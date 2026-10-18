import { mountLayout } from "../../components/layout.js";
import { initApp } from "../app.js";
import { uyeler, aidatlar } from "../../data/mock.js";
import { durumBadge, formatMoney, getQueryParam, toast } from "../utils/helpers.js";
import { icon } from "../utils/icons.js";

initApp();

const id = Number(getQueryParam("id") || "1");
const uye = uyeler.find((u) => u.id === id) || uyeler[0];

if (!uye) {
  mountLayout({
    page: "uyeler",
    subtitle: "Üye detay profili",
    content: () => `
      <div class="page-header">
        <div style="display:flex; align-items:center; gap:12px;">
          <a href="uyeler.html" class="btn btn--ghost btn--icon" title="Geri">${icon("arrow-left")}</a>
          <div>
            <h2 class="page-header__title">Üye Detayı</h2>
            <p class="page-header__desc">Kayıt bulunamadı</p>
          </div>
        </div>
      </div>
      <div class="card">
        <div class="empty-state">
          ${icon("users")}
          <p>Gösterilecek üye kaydı yok.</p>
          <a href="uyeler.html" class="btn btn--primary" style="margin-top:12px;">Üyelere Dön</a>
        </div>
      </div>
    `,
  });
} else {
  const uyeAidatlari = aidatlar.filter((a) => a.uyeId === uye.id);

  mountLayout({
    page: "uyeler",
    subtitle: "Üye detay profili",
    content: () => `
      <div class="page-header">
        <div style="display:flex; align-items:center; gap:12px;">
          <a href="uyeler.html" class="btn btn--ghost btn--icon" title="Geri">${icon("arrow-left")}</a>
          <div>
            <h2 class="page-header__title">Üye Detayı</h2>
            <p class="page-header__desc">${uye.ad} ${uye.soyad} · Üye No: #${String(uye.id).padStart(4, "0")}</p>
          </div>
        </div>
        <div class="btn-group">
          <button class="btn btn--outline" id="btn-edit">${icon("pencil")} Düzenle</button>
          <button class="btn btn--primary" id="btn-aidat">${icon("wallet")} Aidat Kaydı</button>
        </div>
      </div>

      <div class="grid-2 mb-24">
        <div class="card">
          <div class="card__body">
            <div class="profile-hero mb-16">
              <div class="avatar avatar--xl" style="background:${uye.color}">${uye.initials}</div>
              <div class="profile-hero__info">
                <h2>${uye.ad} ${uye.soyad}</h2>
                <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap; margin-top:6px;">
                  ${durumBadge(uye.durum)}
                  <span class="badge badge--primary">${uye.meslek}</span>
                </div>
                <p style="margin-top:10px; font-size:0.875rem;">
                  ${icon("map-pin")} ${uye.ilce} · Üyelik: ${uye.uyelikTarihi}
                </p>
              </div>
            </div>
            <div class="profile-meta">
              <div class="profile-meta__item">
                <div class="profile-meta__label">Telefon</div>
                <div class="profile-meta__value">${uye.telefon}</div>
              </div>
              <div class="profile-meta__item">
                <div class="profile-meta__label">E-posta</div>
                <div class="profile-meta__value">${uye.email}</div>
              </div>
              <div class="profile-meta__item">
                <div class="profile-meta__label">T.C. Kimlik</div>
                <div class="profile-meta__value">${uye.tc}</div>
              </div>
              <div class="profile-meta__item">
                <div class="profile-meta__label">Doğum Tarihi</div>
                <div class="profile-meta__value">${uye.dogumTarihi}</div>
              </div>
              <div class="profile-meta__item">
                <div class="profile-meta__label">Kan Grubu</div>
                <div class="profile-meta__value">${uye.kanGrubu}</div>
              </div>
              <div class="profile-meta__item">
                <div class="profile-meta__label">Borç Durumu</div>
                <div class="profile-meta__value ${uye.borc > 0 ? "text-danger" : "text-success"}">
                  ${uye.borc > 0 ? formatMoney(uye.borc) : "Borç yok"}
                </div>
              </div>
              <div class="profile-meta__item" style="grid-column:1/-1;">
                <div class="profile-meta__label">Adres</div>
                <div class="profile-meta__value">${uye.adres}, ${uye.ilce}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="stack">
          <div class="card">
            <div class="card__header">
              <h3 class="card__title">Hızlı İşlemler</h3>
            </div>
            <div class="card__body">
              <div class="stack" style="gap:8px;">
                <label class="form-label" for="wa-message">WhatsApp mesajı</label>
                <textarea class="form-textarea" id="wa-message" rows="3">Sayın üyemiz, Sakarya Rizeliler Derneği olarak sizi bilgilendirmek isteriz.</textarea>
                <button class="btn btn--secondary btn--block" id="btn-whatsapp" style="background:#16a34a;color:#fff;border-color:#16a34a;">
                  ${icon("message-square")} WhatsApp ile Bilgilendir
                </button>
                <button class="btn btn--secondary btn--block" data-quick="email">${icon("mail")} E-posta Gönder</button>
                <button class="btn btn--outline btn--block" data-quick="print">${icon("printer")} Üyelik Kartı Yazdır</button>
              </div>
            </div>
          </div>
          <div class="card">
            <div class="card__header">
              <h3 class="card__title">Özet</h3>
            </div>
            <div class="card__body">
              <div class="stat-card" style="padding:14px; margin-bottom:10px;">
                <div class="stat-card__icon stat-card__icon--green">${icon("check-circle")}</div>
                <div>
                  <div class="stat-card__label">Ödenen Aidat</div>
                  <div class="stat-card__value" style="font-size:1.25rem;">${formatMoney(uyeAidatlari.filter((a) => a.durum === "odendi").reduce((s, a) => s + a.tutar, 0))}</div>
                </div>
              </div>
              <div class="stat-card" style="padding:14px;">
                <div class="stat-card__icon stat-card__icon--orange">${icon("alert-circle")}</div>
                <div>
                  <div class="stat-card__label">Açık Borç</div>
                  <div class="stat-card__value" style="font-size:1.25rem;">${formatMoney(uye.borc)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card__header">
          <div>
            <h3 class="card__title">Aidat Geçmişi</h3>
            <p class="card__subtitle">Bu üyeye ait aidat kayıtları</p>
          </div>
        </div>
        <div class="card__body" style="padding-top:12px;">
          <div class="table-wrap">
            <table class="data-table" style="min-width:560px;">
              <thead>
                <tr>
                  <th>Tutar</th>
                  <th>Son Ödeme</th>
                  <th>Durum</th>
                  <th>Makbuz</th>
                </tr>
              </thead>
              <tbody>
                ${
                  uyeAidatlari.length
                    ? uyeAidatlari
                        .map(
                          (a) => `
                  <tr>
                    <td class="fw-600">${formatMoney(a.tutar)}</td>
                    <td>${a.sonOdeme}</td>
                    <td>${durumBadge(a.durum)}</td>
                    <td>${a.makbuz !== "—" ? `<a href="#" class="btn btn--ghost btn--sm">${icon("receipt")} ${a.makbuz}</a>` : "—"}</td>
                  </tr>
                `
                        )
                        .join("")
                    : `<tr><td colspan="4" class="text-muted">Kayıt bulunamadı</td></tr>`
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `,
  });

  document.getElementById("btn-edit")?.addEventListener("click", () => toast("Düzenleme — demo aşamasında"));
  document.getElementById("btn-aidat")?.addEventListener("click", () => toast("Aidat kaydı — demo aşamasında"));

  document.getElementById("btn-whatsapp")?.addEventListener("click", () => {
    const digits = String(uye.telefon || "").replace(/\D/g, "");
    let phone = digits;
    if (digits.startsWith("0") && digits.length >= 11) phone = `90${digits.slice(1)}`;
    else if (digits.length === 10) phone = `90${digits}`;
    else if (!digits.startsWith("90") && digits.length >= 10) phone = digits;
    if (!phone || phone.length < 10) {
      toast("Geçerli telefon numarası yok");
      return;
    }
    const message = document.getElementById("wa-message")?.value || "";
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  });

  document.querySelectorAll("[data-quick]").forEach((btn) => {
    btn.addEventListener("click", () => toast("İşlem demo aşamasında (backend yok)"));
  });
}
