import { createSidebar, bindSidebarEvents } from "./sidebar.js";
import { createNavbar } from "./navbar.js";

/**
 * Sayfa iskeleti — Vue AppLayout.vue karşılığı.
 * Her sayfa bu fonksiyonu çağırarak ortak layout'u alır.
 */
export function mountLayout({ page, subtitle = "", content }) {
  const app = document.getElementById("app");
  if (!app) return;

  app.innerHTML = `
    <div class="app-shell">
      ${createSidebar(page)}
      <div class="main-area">
        ${createNavbar(page, subtitle)}
        <main class="content" id="page-content">
          ${typeof content === "function" ? content() : content}
        </main>
      </div>
    </div>
  `;

  bindSidebarEvents();
}
