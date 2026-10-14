import { mountLayout } from "../../components/layout.js";
import { initApp } from "../app.js";
import { etkinlikler } from "../../data/mock.js";
import { durumBadge, toast } from "../utils/helpers.js";
import { icon } from "../utils/icons.js";

initApp();

mountLayout({
  page: "etkinlikler",
  subtitle: "Etkinlik planlama ve takip",
  content: () => `
    <div class="page-header">
      <div>
        <h2 class="page-header__title">Etkinlikler</h2>
        <p class="page-header__desc">Dernek etkinliklerini planlayın ve yönetin</p>
      </div>
      <button class="btn btn--primary" id="btn-new-event">${icon("plus")} Yeni Etkinlik</button>
    </div>

    <div class="tabs" id="event-tabs">
      <button class="tabs__item is-active" data-filter="all">Tümü</button>
      <button class="tabs__item" data-filter="yaklasan">Yaklaşan</button>
      <button class="tabs__item" data-filter="tamamlandi">Tamamlanan</button>
    </div>

    <div class="grid-3" id="events-grid">
      ${
        etkinlikler.length
          ? etkinlikler
              .map(
                (e) => `
        <article class="event-card" data-durum="${e.durum}">
          <div class="event-card__banner"></div>
          <div class="event-card__body">
            <div style="display:flex; justify-content:space-between; gap:8px; align-items:flex-start;">
              <h3 class="event-card__title">${e.baslik}</h3>
              ${durumBadge(e.durum)}
            </div>
            <div class="event-card__meta">
              <div class="event-card__meta-row">${icon("calendar")} ${e.tarih}</div>
              <div class="event-card__meta-row">${icon("clock")} ${e.saat}</div>
              <div class="event-card__meta-row">${icon("map-pin")} ${e.konum}</div>
            </div>
          </div>
          <div class="event-card__footer">
            <span class="fw-600" style="font-size:0.8125rem; color:var(--color-primary-700);">
              ${icon("users")} ${e.katilimci} katılımcı
            </span>
            <button class="btn btn--ghost btn--sm" data-detail>Detay</button>
          </div>
        </article>
      `
              )
              .join("")
          : `<div class="card" style="grid-column:1/-1;"><div class="empty-state">${icon("calendar")}<p>Henüz etkinlik yok.</p></div></div>`
      }
    </div>
  `,
});

document.getElementById("event-tabs")?.addEventListener("click", (e) => {
  const tab = e.target.closest(".tabs__item");
  if (!tab) return;
  document.querySelectorAll(".tabs__item").forEach((t) => t.classList.remove("is-active"));
  tab.classList.add("is-active");
  const filter = tab.dataset.filter;
  document.querySelectorAll(".event-card").forEach((card) => {
    card.style.display = filter === "all" || card.dataset.durum === filter ? "" : "none";
  });
});

document.getElementById("btn-new-event")?.addEventListener("click", () => toast("Yeni etkinlik — demo aşamasında"));
document.querySelectorAll("[data-detail]").forEach((btn) => {
  btn.addEventListener("click", () => toast("Etkinlik detayı — demo aşamasında"));
});
