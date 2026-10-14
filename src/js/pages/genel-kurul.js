import { mountLayout } from "../../components/layout.js";
import { initApp } from "../app.js";
import { genelKurul } from "../../data/mock.js";
import { toast } from "../utils/helpers.js";
import { icon } from "../utils/icons.js";

initApp();

const katilan = genelKurul.katilanlar.filter((k) => k.imza).length;
const toplam = genelKurul.katilanlar.length;

mountLayout({
  page: "genel-kurul",
  subtitle: "Genel kurul ve hazirun",
  content: () => `
    <div class="page-header">
      <div>
        <h2 class="page-header__title">Genel Kurul</h2>
        <p class="page-header__desc">${genelKurul.gundem}</p>
      </div>
      <div class="btn-group">
        <button class="btn btn--outline" id="btn-print-hazirun">${icon("printer")} Hazirun Yazdır</button>
        <button class="btn btn--primary" id="btn-imza">${icon("download")} İmza Çıktısı</button>
      </div>
    </div>

    <div class="stat-grid stat-grid--3">
      <div class="stat-card">
        <div class="stat-card__icon stat-card__icon--blue">${icon("calendar")}</div>
        <div>
          <div class="stat-card__label">Tarih / Saat</div>
          <div class="stat-card__value" style="font-size:1.125rem;">${genelKurul.tarih}</div>
          <div class="stat-card__meta">${genelKurul.saat}</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-card__icon stat-card__icon--cyan">${icon("map-pin")}</div>
        <div>
          <div class="stat-card__label">Yer</div>
          <div class="stat-card__value" style="font-size:1rem; line-height:1.35;">${genelKurul.yer}</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-card__icon stat-card__icon--green">${icon("users")}</div>
        <div>
          <div class="stat-card__label">Katılım</div>
          <div class="stat-card__value">${katilan} / ${toplam}</div>
          <div class="stat-card__meta">İmzalı üye</div>
        </div>
      </div>
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="card__header">
          <div>
            <h3 class="card__title">Katılan Üyeler</h3>
            <p class="card__subtitle">Hazirun listesi</p>
          </div>
        </div>
        <div class="card__body" style="padding-top:12px;">
          <div class="table-wrap">
            <table class="data-table" style="min-width:420px;">
              <thead>
                <tr>
                  <th>Sıra</th>
                  <th>Ad Soyad</th>
                  <th>T.C.</th>
                  <th>İmza</th>
                </tr>
              </thead>
              <tbody>
                ${
                  genelKurul.katilanlar.length
                    ? genelKurul.katilanlar
                        .map(
                          (k) => `
                  <tr>
                    <td>${k.sira}</td>
                    <td class="fw-600">${k.ad}</td>
                    <td>${k.tc}</td>
                    <td>
                      ${
                        k.imza
                          ? `<span class="badge badge--success">İmzalandı</span>`
                          : `<span class="badge badge--warning">Bekliyor</span>`
                      }
                    </td>
                  </tr>
                `
                        )
                        .join("")
                    : `<tr><td colspan="4" class="text-muted">Hazirun listesi boş</td></tr>`
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="stack">
        <div class="feature-card">
          <div class="feature-card__icon">${icon("clipboard-list")}</div>
          <h3 class="feature-card__title">Hazirun Listesi</h3>
          <p class="feature-card__desc">
            Genel kurul toplantısına katılan üyelerin resmi yoklama listesini oluşturun ve yazdırın.
          </p>
          <button class="btn btn--secondary" id="btn-hazirun">${icon("file-text")} Listeyi Görüntüle</button>
        </div>
        <div class="feature-card">
          <div class="feature-card__icon">${icon("printer")}</div>
          <h3 class="feature-card__title">İmza Çıktısı</h3>
          <p class="feature-card__desc">
            İmza alanlı hazır çıktı belgesi. Toplantı tutanağı ve yoklama için kullanın.
          </p>
          <button class="btn btn--primary" id="btn-imza-card">${icon("download")} PDF İndir</button>
        </div>
      </div>
    </div>
  `,
});

["btn-print-hazirun", "btn-imza", "btn-hazirun", "btn-imza-card"].forEach((id) => {
  document.getElementById(id)?.addEventListener("click", () => toast("Çıktı işlemi — demo aşamasında"));
});
