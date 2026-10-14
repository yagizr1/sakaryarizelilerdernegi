import { mountLayout } from "../../components/layout.js";
import { initApp } from "../app.js";
import { uyeler } from "../../data/mock.js";
import { durumBadge, toast } from "../utils/helpers.js";
import { icon } from "../utils/icons.js";

initApp();

function renderTable(list) {
  if (!list.length) {
    return `
      <div class="card">
        <div class="empty-state">
          ${icon("users")}
          <p>Henüz üye kaydı yok.</p>
        </div>
      </div>
    `;
  }

  return `
    <div class="card">
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Profil</th>
              <th>Ad Soyad</th>
              <th>Telefon</th>
              <th>E-posta</th>
              <th>Üyelik Tarihi</th>
              <th>Durum</th>
              <th>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            ${list
              .map(
                (u) => `
              <tr>
                <td>
                  <div class="avatar" style="background:${u.color}">${u.initials}</div>
                </td>
                <td>
                  <div class="cell-user__name">${u.ad} ${u.soyad}</div>
                  ${u.borc > 0 ? `<div class="cell-user__sub text-danger">Borç: ${u.borc} ₺</div>` : ""}
                </td>
                <td>${u.telefon}</td>
                <td>${u.email}</td>
                <td>${u.uyelikTarihi}</td>
                <td>${durumBadge(u.durum)}</td>
                <td>
                  <div class="table-actions">
                    <a href="uye-detay.html?id=${u.id}" class="btn btn--ghost btn--icon" title="Görüntüle">${icon("eye")}</a>
                    <button class="btn btn--ghost btn--icon" title="Düzenle" data-action="edit">${icon("pencil")}</button>
                    <button class="btn btn--ghost btn--icon" title="Sil" data-action="delete">${icon("trash")}</button>
                  </div>
                </td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      </div>
      <div class="pagination">
        <div class="pagination__info">Toplam ${list.length} üye gösteriliyor</div>
        <div class="pagination__controls">
          <button class="pagination__btn">${icon("chevron-left")}</button>
          <button class="pagination__btn is-active">1</button>
          <button class="pagination__btn">2</button>
          <button class="pagination__btn">3</button>
          <button class="pagination__btn">${icon("chevron-right")}</button>
        </div>
      </div>
    </div>
  `;
}

mountLayout({
  page: "uyeler",
  subtitle: "Üye kayıt ve yönetim",
  content: () => `
    <div class="page-header">
      <div>
        <h2 class="page-header__title">Üyeler</h2>
        <p class="page-header__desc">Tüm dernek üyelerini görüntüleyin ve yönetin</p>
      </div>
      <button class="btn btn--primary" id="btn-add-member">${icon("user-plus")} Yeni Üye</button>
    </div>
    <div class="toolbar">
      <div class="toolbar__left">
        <div class="search-input">
          ${icon("search")}
          <input type="search" id="member-search" placeholder="Üye ara..." />
        </div>
        <select class="form-select" id="status-filter" style="height:40px; width:auto;">
          <option value="all">Tüm Durumlar</option>
          <option value="aktif">Aktif</option>
          <option value="pasif">Pasif</option>
        </select>
      </div>
      <div class="toolbar__right">
        <button class="btn btn--outline btn--sm">${icon("filter")} Filtrele</button>
        <button class="btn btn--outline btn--sm">${icon("download")} Dışa Aktar</button>
      </div>
    </div>
    <div id="members-table">${renderTable(uyeler)}</div>
  `,
});

const searchInput = document.getElementById("member-search");
const statusFilter = document.getElementById("status-filter");
const tableHost = document.getElementById("members-table");

function applyFilters() {
  const q = (searchInput?.value || "").toLowerCase().trim();
  const status = statusFilter?.value || "all";
  const filtered = uyeler.filter((u) => {
    const matchQ =
      !q ||
      `${u.ad} ${u.soyad}`.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.telefon.includes(q) ||
      u.ilce.toLowerCase().includes(q);
    const matchStatus = status === "all" || u.durum === status;
    return matchQ && matchStatus;
  });
  tableHost.innerHTML = renderTable(filtered);
}

searchInput?.addEventListener("input", applyFilters);
statusFilter?.addEventListener("change", applyFilters);

document.getElementById("btn-add-member")?.addEventListener("click", () => {
  toast("Yeni üye formu — demo aşamasında (backend yok)");
});

document.getElementById("page-content")?.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-action]");
  if (!btn) return;
  if (btn.dataset.action === "edit") toast("Düzenleme — demo aşamasında");
  if (btn.dataset.action === "delete") toast("Silme — demo aşamasında");
});
