import { mountLayout } from "../../components/layout.js";
import { initApp } from "../app.js";
import { aidatlar } from "../../data/mock.js";
import { durumBadge, formatMoney, toast } from "../utils/helpers.js";
import { icon } from "../utils/icons.js";

initApp();

const odenen = aidatlar.filter((a) => a.durum === "odendi").reduce((s, a) => s + a.tutar, 0);
const bekleyen = aidatlar.filter((a) => a.durum !== "odendi").reduce((s, a) => s + a.tutar, 0);

mountLayout({
  page: "aidatlar",
  subtitle: "Aidat takip ve tahsilat",
  content: () => `
    <div class="page-header">
      <div>
        <h2 class="page-header__title">Aidatlar</h2>
        <p class="page-header__desc">Üye aidat ödemelerini takip edin</p>
      </div>
      <button class="btn btn--primary" id="btn-new-dues">${icon("plus")} Aidat Kaydı</button>
    </div>

    <div class="stat-grid stat-grid--3">
      <div class="stat-card">
        <div class="stat-card__icon stat-card__icon--green">${icon("check-circle")}</div>
        <div>
          <div class="stat-card__label">Tahsil Edilen</div>
          <div class="stat-card__value">${formatMoney(odenen)}</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-card__icon stat-card__icon--orange">${icon("alert-circle")}</div>
        <div>
          <div class="stat-card__label">Bekleyen / Geciken</div>
          <div class="stat-card__value">${formatMoney(bekleyen)}</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-card__icon stat-card__icon--blue">${icon("wallet")}</div>
        <div>
          <div class="stat-card__label">Toplam Kayıt</div>
          <div class="stat-card__value">${aidatlar.length}</div>
        </div>
      </div>
    </div>

    <div class="toolbar">
      <div class="toolbar__left">
        <div class="search-input">
          ${icon("search")}
          <input type="search" id="dues-search" placeholder="Üye ara..." />
        </div>
        <select class="form-select" id="dues-filter" style="height:40px; width:auto;">
          <option value="all">Tüm Durumlar</option>
          <option value="odendi">Ödendi</option>
          <option value="bekliyor">Bekliyor</option>
          <option value="gecikti">Gecikti</option>
        </select>
      </div>
    </div>

    <div class="card">
      <div class="table-wrap">
        <table class="data-table" id="dues-table">
          <thead>
            <tr>
              <th>Üye</th>
              <th>Tutar</th>
              <th>Son Ödeme</th>
              <th>Durum</th>
              <th>Makbuz</th>
              <th>İşlem</th>
            </tr>
          </thead>
          <tbody>
            ${
              aidatlar.length
                ? aidatlar
                    .map(
                      (a) => `
              <tr data-uye="${a.uye.toLowerCase()}" data-durum="${a.durum}">
                <td class="fw-600">${a.uye}</td>
                <td>${formatMoney(a.tutar)}</td>
                <td>${a.sonOdeme}</td>
                <td>${durumBadge(a.durum)}</td>
                <td>${
                  a.makbuz !== "—"
                    ? `<button class="btn btn--ghost btn--sm" data-makbuz="${a.makbuz}">${icon("receipt")} ${a.makbuz}</button>`
                    : `<span class="text-muted">—</span>`
                }</td>
                <td>
                  <div class="table-actions">
                    <button class="btn btn--ghost btn--icon" title="Görüntüle">${icon("eye")}</button>
                    <button class="btn btn--ghost btn--icon" title="Düzenle">${icon("pencil")}</button>
                  </div>
                </td>
              </tr>
            `
                    )
                    .join("")
                : `<tr><td colspan="6" class="text-muted">Henüz aidat kaydı yok</td></tr>`
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
});

const search = document.getElementById("dues-search");
const filter = document.getElementById("dues-filter");

function filterRows() {
  const q = (search?.value || "").toLowerCase();
  const status = filter?.value || "all";
  document.querySelectorAll("#dues-table tbody tr").forEach((row) => {
    const matchQ = !q || row.dataset.uye.includes(q);
    const matchS = status === "all" || row.dataset.durum === status;
    row.style.display = matchQ && matchS ? "" : "none";
  });
}

search?.addEventListener("input", filterRows);
filter?.addEventListener("change", filterRows);
document.getElementById("btn-new-dues")?.addEventListener("click", () => toast("Aidat kaydı — demo aşamasında"));
document.querySelectorAll("[data-makbuz]").forEach((btn) => {
  btn.addEventListener("click", () => toast(`Makbuz ${btn.dataset.makbuz} — demo`));
});
