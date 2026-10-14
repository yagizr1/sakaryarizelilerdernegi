import { mountLayout } from "../../components/layout.js";
import { initApp } from "../app.js";
import { dernekBilgileri } from "../../data/mock.js";
import { toast } from "../utils/helpers.js";
import { icon } from "../utils/icons.js";

initApp();

mountLayout({
  page: "ayarlar",
  subtitle: "Sistem ve dernek ayarları",
  content: () => `
    <div class="page-header">
      <div>
        <h2 class="page-header__title">Ayarlar</h2>
        <p class="page-header__desc">Dernek bilgileri, görünüm ve bildirim tercihleri</p>
      </div>
      <button class="btn btn--primary" id="btn-save">${icon("check-circle")} Kaydet</button>
    </div>

    <div class="settings-layout">
      <div class="card">
        <div class="card__body" style="padding:12px;">
          <nav class="settings-nav" id="settings-nav">
            <button class="settings-nav__item is-active" data-panel="dernek">${icon("building")} Dernek Bilgileri</button>
            <button class="settings-nav__item" data-panel="logo">${icon("upload")} Logo</button>
            <button class="settings-nav__item" data-panel="iletisim">${icon("phone")} İletişim</button>
            <button class="settings-nav__item" data-panel="tema">${icon("palette")} Tema</button>
            <button class="settings-nav__item" data-panel="bildirim">${icon("bell")} Bildirimler</button>
          </nav>
        </div>
      </div>

      <div class="stack">
        <section class="card settings-panel" id="panel-dernek">
          <div class="card__header"><h3 class="card__title">Dernek Bilgileri</h3></div>
          <div class="card__body">
            <div class="form-grid">
              <div class="form-group form-group--full">
                <label class="form-label">Dernek Adı</label>
                <input class="form-input" type="text" value="${dernekBilgileri.ad}" />
              </div>
              <div class="form-group">
                <label class="form-label">Kısa Ad</label>
                <input class="form-input" type="text" value="${dernekBilgileri.kisaAd}" />
              </div>
              <div class="form-group">
                <label class="form-label">Kuruluş Tarihi</label>
                <input class="form-input" type="text" value="${dernekBilgileri.kurulus}" />
              </div>
              <div class="form-group">
                <label class="form-label">Vergi No</label>
                <input class="form-input" type="text" value="${dernekBilgileri.vergiNo}" />
              </div>
              <div class="form-group form-group--full">
                <label class="form-label">Adres</label>
                <textarea class="form-textarea" rows="2">${dernekBilgileri.adres}</textarea>
              </div>
            </div>
          </div>
        </section>

        <section class="card settings-panel" id="panel-logo" hidden>
          <div class="card__header"><h3 class="card__title">Logo</h3></div>
          <div class="card__body">
            <p class="mb-16" style="font-size:0.875rem;">Dernek logosunu yükleyin. Önerilen boyut: 512×512 px.</p>
            <div class="logo-upload" id="logo-upload" role="button" tabindex="0">
              <div style="text-align:center;">
                ${icon("upload")}
                <div style="font-size:0.8125rem; margin-top:8px;">Logo Yükle</div>
              </div>
            </div>
          </div>
        </section>

        <section class="card settings-panel" id="panel-iletisim" hidden>
          <div class="card__header"><h3 class="card__title">İletişim</h3></div>
          <div class="card__body">
            <div class="form-grid">
              <div class="form-group">
                <label class="form-label">Telefon</label>
                <input class="form-input" type="text" value="${dernekBilgileri.telefon}" />
              </div>
              <div class="form-group">
                <label class="form-label">E-posta</label>
                <input class="form-input" type="email" value="${dernekBilgileri.email}" />
              </div>
              <div class="form-group form-group--full">
                <label class="form-label">Web Sitesi</label>
                <input class="form-input" type="text" value="${dernekBilgileri.web}" />
              </div>
            </div>
          </div>
        </section>

        <section class="card settings-panel" id="panel-tema" hidden>
          <div class="card__header"><h3 class="card__title">Tema</h3></div>
          <div class="card__body">
            <div class="setting-row">
              <div>
                <div class="setting-row__label">Açık Tema</div>
                <div class="setting-row__desc">Varsayılan açık renk teması (aktif)</div>
              </div>
              <label class="toggle">
                <input type="checkbox" checked disabled />
                <span class="toggle__slider"></span>
              </label>
            </div>
            <div class="setting-row">
              <div>
                <div class="setting-row__label">Ana Renk</div>
                <div class="setting-row__desc">Material mavi (#1976D2)</div>
              </div>
              <input type="color" value="#1976d2" style="width:42px; height:32px; border:none; background:none; cursor:pointer;" />
            </div>
            <div class="setting-row">
              <div>
                <div class="setting-row__label">Yoğun Kenarlıklar</div>
                <div class="setting-row__desc">Kartlarda daha belirgin çerçeve</div>
              </div>
              <label class="toggle">
                <input type="checkbox" />
                <span class="toggle__slider"></span>
              </label>
            </div>
          </div>
        </section>

        <section class="card settings-panel" id="panel-bildirim" hidden>
          <div class="card__header"><h3 class="card__title">Bildirim Ayarları</h3></div>
          <div class="card__body">
            <div class="setting-row">
              <div>
                <div class="setting-row__label">E-posta Bildirimleri</div>
                <div class="setting-row__desc">Yeni üye ve aidat uyarıları</div>
              </div>
              <label class="toggle">
                <input type="checkbox" checked />
                <span class="toggle__slider"></span>
              </label>
            </div>
            <div class="setting-row">
              <div>
                <div class="setting-row__label">SMS Bildirimleri</div>
                <div class="setting-row__desc">Acil duyuru ve hatırlatmalar</div>
              </div>
              <label class="toggle">
                <input type="checkbox" checked />
                <span class="toggle__slider"></span>
              </label>
            </div>
            <div class="setting-row">
              <div>
                <div class="setting-row__label">Push Bildirimleri</div>
                <div class="setting-row__desc">PWA bildirimleri (ileride)</div>
              </div>
              <label class="toggle">
                <input type="checkbox" />
                <span class="toggle__slider"></span>
              </label>
            </div>
            <div class="setting-row">
              <div>
                <div class="setting-row__label">Aidat Hatırlatması</div>
                <div class="setting-row__desc">Son ödeme tarihinden 3 gün önce</div>
              </div>
              <label class="toggle">
                <input type="checkbox" checked />
                <span class="toggle__slider"></span>
              </label>
            </div>
          </div>
        </section>
      </div>
    </div>
  `,
});

document.getElementById("settings-nav")?.addEventListener("click", (e) => {
  const item = e.target.closest(".settings-nav__item");
  if (!item) return;
  document.querySelectorAll(".settings-nav__item").forEach((el) => el.classList.remove("is-active"));
  item.classList.add("is-active");
  document.querySelectorAll(".settings-panel").forEach((panel) => {
    panel.hidden = panel.id !== `panel-${item.dataset.panel}`;
  });
});

document.getElementById("btn-save")?.addEventListener("click", () => toast("Ayarlar kaydedildi (demo)"));
document.getElementById("logo-upload")?.addEventListener("click", () => toast("Logo yükleme — demo"));
