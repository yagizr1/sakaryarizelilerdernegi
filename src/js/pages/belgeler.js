import { mountLayout } from "../../components/layout.js";
import { initApp } from "../app.js";
import { belgeler } from "../../data/mock.js";
import { toast } from "../utils/helpers.js";
import { icon } from "../utils/icons.js";

initApp();

const tipMeta = {
  pdf: { icon: "file-text", color: "#dc2626", bg: "#fee2e2", label: "PDF" },
  excel: { icon: "file-spreadsheet", color: "#16a34a", bg: "#dcfce7", label: "Excel" },
  makbuz: { icon: "receipt", color: "#d97706", bg: "#fef3c7", label: "Makbuz" },
  form: { icon: "clipboard-list", color: "#1976d2", bg: "#e3f2fd", label: "Üyelik Formu" },
};

const categories = [
  { key: "pdf", title: "PDF", desc: "Raporlar, tüzük ve arşiv belgeleri", icon: "file-text" },
  { key: "excel", title: "Excel", desc: "Tablolar ve veri dışa aktarımları", icon: "file-spreadsheet" },
  { key: "makbuz", title: "Makbuz", desc: "Aidat ve tahsilat makbuzları", icon: "receipt" },
  { key: "form", title: "Üyelik Formu", desc: "Başvuru ve üyelik form şablonları", icon: "clipboard-list" },
];

mountLayout({
  page: "belgeler",
  subtitle: "Doküman arşivi",
  content: () => `
    <div class="page-header">
      <div>
        <h2 class="page-header__title">Belgeler</h2>
        <p class="page-header__desc">Dernek belge ve dosya arşivi</p>
      </div>
      <button class="btn btn--primary" id="btn-upload">${icon("upload")} Belge Yükle</button>
    </div>

    <div class="grid-4 mb-24">
      ${categories
        .map(
          (c) => `
        <div class="feature-card" data-cat="${c.key}" style="cursor:pointer;">
          <div class="feature-card__icon">${icon(c.icon)}</div>
          <h3 class="feature-card__title">${c.title}</h3>
          <p class="feature-card__desc">${c.desc}</p>
        </div>
      `
        )
        .join("")}
    </div>

    <div class="card">
      <div class="card__header">
        <div>
          <h3 class="card__title">Tüm Belgeler</h3>
          <p class="card__subtitle">Örnek belge listesi</p>
        </div>
      </div>
      <div class="card__body" style="padding-top:12px;">
        <div class="table-wrap">
          <table class="data-table" style="min-width:640px;">
            <thead>
              <tr>
                <th>Belge</th>
                <th>Tür</th>
                <th>Boyut</th>
                <th>Tarih</th>
                <th>İşlem</th>
              </tr>
            </thead>
            <tbody>
              ${
                belgeler.length
                  ? belgeler
                      .map((b) => {
                        const meta = tipMeta[b.ikon] || tipMeta.pdf;
                        return `
                  <tr>
                    <td>
                      <div class="cell-user">
                        <div class="avatar avatar--sm" style="background:${meta.bg}; color:${meta.color}; border-radius:10px;">
                          ${icon(meta.icon)}
                        </div>
                        <div class="cell-user__name">${b.ad}</div>
                      </div>
                    </td>
                    <td><span class="badge badge--neutral">${meta.label}</span></td>
                    <td>${b.boyut}</td>
                    <td>${b.tarih}</td>
                    <td>
                      <div class="table-actions">
                        <button class="btn btn--ghost btn--icon" title="İndir" data-dl>${icon("download")}</button>
                        <button class="btn btn--ghost btn--icon" title="Görüntüle" data-view>${icon("eye")}</button>
                      </div>
                    </td>
                  </tr>
                `;
                      })
                      .join("")
                  : `<tr><td colspan="5" class="text-muted">Henüz belge yok</td></tr>`
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
});

document.getElementById("btn-upload")?.addEventListener("click", () => toast("Belge yükleme — demo"));
document.querySelectorAll("[data-cat]").forEach((card) => {
  card.addEventListener("click", () => toast(`${card.querySelector(".feature-card__title").textContent} filtresi — demo`));
});
document.querySelectorAll("[data-dl], [data-view]").forEach((btn) => {
  btn.addEventListener("click", () => toast("Belge işlemi — demo aşamasında"));
});
