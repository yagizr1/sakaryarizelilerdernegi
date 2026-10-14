import { mountLayout } from "../../components/layout.js";
import { initApp } from "../app.js";
import { duyurular } from "../../data/mock.js";
import { toast } from "../utils/helpers.js";
import { icon } from "../utils/icons.js";

initApp();

mountLayout({
  page: "duyurular",
  subtitle: "Duyuru yayınlama",
  content: () => `
    <div class="page-header">
      <div>
        <h2 class="page-header__title">Duyurular</h2>
        <p class="page-header__desc">Üyelere yönelik duyuru ve bilgilendirmeler</p>
      </div>
      <button class="btn btn--primary" id="btn-new-announce">${icon("plus")} Yeni Duyuru</button>
    </div>

    <div class="stack" style="gap:14px;">
      ${
        duyurular.length
          ? duyurular
              .map(
                (d) => `
        <article class="announce-card">
          <div class="announce-card__date">
            <div class="announce-card__day">${d.gun}</div>
            <div class="announce-card__month">${d.ay}</div>
          </div>
          <div style="flex:1; min-width:0;">
            <h3 class="announce-card__title">${d.baslik}</h3>
            <p class="announce-card__desc">${d.aciklama}</p>
            <div class="announce-card__meta">Yayın tarihi: ${d.tarih.split("-").reverse().join(".")}</div>
          </div>
          <div class="table-actions" style="flex-shrink:0;">
            <button class="btn btn--ghost btn--icon" title="Düzenle" data-action="edit">${icon("pencil")}</button>
            <button class="btn btn--ghost btn--icon" title="Sil" data-action="delete">${icon("trash")}</button>
          </div>
        </article>
      `
              )
              .join("")
          : `<div class="card"><div class="empty-state">${icon("megaphone")}<p>Henüz duyuru yok.</p></div></div>`
      }
    </div>
  `,
});

document.getElementById("btn-new-announce")?.addEventListener("click", () => {
  toast("Yeni duyuru — demo aşamasında");
});
document.querySelectorAll("[data-action]").forEach((btn) => {
  btn.addEventListener("click", () => toast("İşlem demo aşamasında"));
});
