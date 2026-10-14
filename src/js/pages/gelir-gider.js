import { mountLayout } from "../../components/layout.js";
import { initApp } from "../app.js";
import { gelirGider } from "../../data/mock.js";
import { formatMoney, toast } from "../utils/helpers.js";
import { icon } from "../utils/icons.js";

initApp();

mountLayout({
  page: "gelir-gider",
  subtitle: "Finansal hareketler",
  content: () => `
    <div class="page-header">
      <div>
        <h2 class="page-header__title">Gelir - Gider</h2>
        <p class="page-header__desc">Kasa ve finansal işlem özeti</p>
      </div>
      <div class="btn-group">
        <button class="btn btn--secondary" id="btn-gelir">${icon("plus")} Gelir Ekle</button>
        <button class="btn btn--outline" id="btn-gider">${icon("plus")} Gider Ekle</button>
      </div>
    </div>

    <div class="stat-grid stat-grid--3">
      <div class="stat-card">
        <div class="stat-card__icon stat-card__icon--green">${icon("trending-up")}</div>
        <div>
          <div class="stat-card__label">Toplam Gelir</div>
          <div class="stat-card__value">${formatMoney(gelirGider.toplamGelir)}</div>
          <div class="stat-card__meta stat-card__meta--up">Yıl başından itibaren</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-card__icon stat-card__icon--red">${icon("wallet")}</div>
        <div>
          <div class="stat-card__label">Toplam Gider</div>
          <div class="stat-card__value">${formatMoney(gelirGider.toplamGider)}</div>
          <div class="stat-card__meta">Yıl başından itibaren</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-card__icon stat-card__icon--blue">${icon("landmark")}</div>
        <div>
          <div class="stat-card__label">Kasa</div>
          <div class="stat-card__value">${formatMoney(gelirGider.kasa)}</div>
          <div class="stat-card__meta">Güncel bakiye</div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card__header">
        <div>
          <h3 class="card__title">Son İşlemler</h3>
          <p class="card__subtitle">Örnek gelir ve gider kayıtları</p>
        </div>
        <button class="btn btn--ghost btn--sm">${icon("download")} Dışa Aktar</button>
      </div>
      <div class="card__body" style="padding-top:12px;">
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Tarih</th>
                <th>Açıklama</th>
                <th>Kategori</th>
                <th>Tür</th>
                <th class="text-right">Tutar</th>
              </tr>
            </thead>
            <tbody>
              ${
                gelirGider.islemler.length
                  ? gelirGider.islemler
                      .map(
                        (i) => `
                <tr>
                  <td>${i.tarih}</td>
                  <td class="fw-600">${i.aciklama}</td>
                  <td><span class="badge badge--neutral">${i.kategori}</span></td>
                  <td>
                    <span class="badge ${i.tur === "gelir" ? "badge--success" : "badge--danger"}">
                      ${i.tur === "gelir" ? "Gelir" : "Gider"}
                    </span>
                  </td>
                  <td class="text-right fw-600 ${i.tur === "gelir" ? "text-success" : "text-danger"}">
                    ${i.tur === "gelir" ? "+" : "−"}${formatMoney(i.tutar)}
                  </td>
                </tr>
              `
                      )
                      .join("")
                  : `<tr><td colspan="5" class="text-muted">Henüz işlem kaydı yok</td></tr>`
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
});

document.getElementById("btn-gelir")?.addEventListener("click", () => toast("Gelir ekleme — demo"));
document.getElementById("btn-gider")?.addEventListener("click", () => toast("Gider ekleme — demo"));
