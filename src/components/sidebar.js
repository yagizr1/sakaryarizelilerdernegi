import { routes, currentUser } from "../data/mock.js";
import { icon } from "../js/utils/icons.js";

/**
 * Sidebar bileşeni — Vue'da <Sidebar /> olarak taşınabilir.
 */
export function createSidebar(activePage) {
  const sections = [];
  let currentSection = null;

  routes.forEach((route) => {
    if (route.section !== currentSection) {
      currentSection = route.section;
      sections.push(`<div class="sidebar__section-label">${currentSection}</div>`);
    }
    const isActive = route.id === activePage ? " is-active" : "";
    sections.push(`
      <a href="${route.path}" class="sidebar__link${isActive}" data-page="${route.id}">
        ${icon(route.icon)}
        <span>${route.title}</span>
      </a>
    `);
  });

  return `
    <aside class="sidebar" id="sidebar" aria-label="Ana menü">
      <div class="sidebar__brand">
        <div class="sidebar__logo">DY</div>
        <div class="sidebar__brand-text">
          <div class="sidebar__brand-title">Dernek Yönetim</div>
          <div class="sidebar__brand-sub">Yönetim Paneli</div>
        </div>
      </div>
      <nav class="sidebar__nav">
        ${sections.join("")}
      </nav>
      <div class="sidebar__footer">
        <div class="sidebar__user">
          <div class="sidebar__user-avatar">${currentUser.initials}</div>
          <div class="sidebar__user-info">
            <div class="sidebar__user-name">${currentUser.ad}</div>
            <div class="sidebar__user-role">${currentUser.rol}</div>
          </div>
        </div>
      </div>
    </aside>
    <div class="sidebar-overlay" id="sidebar-overlay"></div>
  `;
}

export function bindSidebarEvents() {
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebar-overlay");
  const menuBtn = document.getElementById("menu-btn");

  function close() {
    sidebar?.classList.remove("is-open");
    overlay?.classList.remove("is-visible");
  }

  function open() {
    sidebar?.classList.add("is-open");
    overlay?.classList.add("is-visible");
  }

  menuBtn?.addEventListener("click", () => {
    if (sidebar?.classList.contains("is-open")) close();
    else open();
  });

  overlay?.addEventListener("click", close);
}
