import { routes } from "../data/mock.js";
import { icon } from "../js/utils/icons.js";

/**
 * Navbar bileşeni — Vue'da <Navbar /> olarak taşınabilir.
 */
export function createNavbar(activePage, subtitle = "") {
  const route = routes.find((r) => r.id === activePage);
  const title = route?.title || "Dernek Yönetim";

  return `
    <header class="navbar">
      <div class="navbar__left">
        <button class="navbar__menu-btn" id="menu-btn" aria-label="Menüyü aç">
          ${icon("menu")}
        </button>
        <div>
          <h1 class="navbar__title">${title}</h1>
          ${subtitle ? `<div class="navbar__breadcrumb">${subtitle}</div>` : ""}
        </div>
      </div>
      <div class="navbar__right">
        <div class="navbar__search">
          ${icon("search")}
          <input type="search" placeholder="Ara..." aria-label="Ara" />
        </div>
        <button class="navbar__icon-btn" aria-label="Bildirimler" title="Bildirimler">
          ${icon("bell")}
          <span class="navbar__badge"></span>
        </button>
      </div>
    </header>
  `;
}
