import { mountLayout } from "../../components/layout.js";
import { initApp } from "../app.js";
import {
  dashboardStats,
  uyeler,
  etkinlikler,
  chartData,
  aidatlar,
} from "../../data/mock.js";
import { formatMoney, formatNumber, durumBadge } from "../utils/helpers.js";
import { icon } from "../utils/icons.js";

initApp();

function renderStats() {
  const items = [
    {
      label: "Toplam Üye",
      value: formatNumber(dashboardStats.toplamUye),
      meta: "Kayıtlı üye",
      metaClass: "",
      icon: "users",
      tone: "blue",
    },
    {
      label: "Borçlu Üye",
      value: formatNumber(dashboardStats.borcluUye),
      meta: "Takip gerekli",
      metaClass: "",
      icon: "alert-circle",
      tone: "orange",
    },
    {
      label: "Bu Ay Tahsil Edilen",
      value: formatMoney(dashboardStats.buAyAidat),
      meta: "Aidat tahsilatı",
      metaClass: "",
      icon: "wallet",
      tone: "green",
    },
    {
      label: "Yaklaşan Etkinlik",
      value: formatNumber(dashboardStats.yaklasanEtkinlik),
      meta: "Önümüzdeki 30 gün",
      metaClass: "",
      icon: "calendar",
      tone: "cyan",
    },
  ];

  return `
    <div class="stat-grid">
      ${items
        .map(
          (item) => `
        <div class="stat-card">
          <div class="stat-card__icon stat-card__icon--${item.tone}">${icon(item.icon)}</div>
          <div>
            <div class="stat-card__label">${item.label}</div>
            <div class="stat-card__value">${item.value}</div>
            <div class="stat-card__meta ${item.metaClass}">${item.meta}</div>
          </div>
        </div>
      `
        )
        .join("")}
    </div>
  `;
}

function renderRecentMembers() {
  const recent = [...uyeler].slice(-5).reverse();
  return `
    <div class="card">
      <div class="card__header">
        <div>
          <h3 class="card__title">Son Eklenen Üyeler</h3>
          <p class="card__subtitle">En son kayıt olan 5 üye</p>
        </div>
        <a href="uyeler.html" class="btn btn--ghost btn--sm">Tümü</a>
      </div>
      <div class="card__body" style="padding-top: 12px; padding-bottom: 8px;">
        <div class="table-wrap">
          <table class="data-table" style="min-width: 480px;">
            <thead>
              <tr>
                <th>Üye</th>
                <th>Tarih</th>
                <th>Durum</th>
              </tr>
            </thead>
            <tbody>
              ${
                recent.length
                  ? recent
                      .map(
                        (u) => `
                <tr>
                  <td>
                    <div class="cell-user">
                      <div class="avatar avatar--sm" style="background:${u.color}">${u.initials}</div>
                      <div>
                        <div class="cell-user__name">${u.ad} ${u.soyad}</div>
                        <div class="cell-user__sub">${u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>${u.uyelikTarihi || "—"}</td>
                  <td>${u.uyelikTarihi}</td>
                  <td>${durumBadge(u.durum)}</td>
                </tr>
              `
                      )
                      .join("")
                  : `<tr><td colspan="4" class="text-muted">Henüz üye kaydı yok</td></tr>`
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function renderUpcomingEvents() {
  const upcoming = etkinlikler.filter((e) => e.durum === "yaklasan").slice(0, 3);
  return `
    <div class="card">
      <div class="card__header">
        <div>
          <h3 class="card__title">Yaklaşan Etkinlikler</h3>
          <p class="card__subtitle">Takvimdeki sonraki etkinlikler</p>
        </div>
        <a href="etkinlikler.html" class="btn btn--ghost btn--sm">Tümü</a>
      </div>
      <div class="card__body">
        <div class="stack">
          ${
            upcoming.length
              ? upcoming
                  .map(
                    (e) => `
            <div style="display:flex; gap:14px; align-items:flex-start; padding:12px; background:var(--color-surface-2); border-radius:var(--radius-sm);">
              <div style="width:44px; height:44px; border-radius:10px; background:var(--color-primary-50); color:var(--color-primary-600); display:grid; place-items:center; flex-shrink:0;">
                ${icon("calendar")}
              </div>
              <div style="min-width:0; flex:1;">
                <div class="fw-600" style="font-size:0.9375rem;">${e.baslik}</div>
                <div class="text-muted" style="font-size:0.75rem; margin-top:4px;">
                  ${e.tarih} · ${e.saat} · ${e.konum}
                </div>
              </div>
              <span class="badge badge--primary">${e.katilimci} kişi</span>
            </div>
          `
                  )
                  .join("")
              : `<p class="text-muted" style="font-size:0.875rem;">Yaklaşan etkinlik yok</p>`
          }
        </div>
      </div>
    </div>
  `;
}

function renderAidatSummary() {
  const rows = aidatlar.slice(0, 5);
  return `
    <div class="card">
      <div class="card__header">
        <div>
          <h3 class="card__title">Son Aidat Hareketleri</h3>
          <p class="card__subtitle">Ödeme durumu özeti</p>
        </div>
        <a href="aidatlar.html" class="btn btn--ghost btn--sm">Tümü</a>
      </div>
      <div class="card__body" style="padding-top:12px;">
        <div class="table-wrap">
          <table class="data-table" style="min-width:420px;">
            <thead>
              <tr>
                <th>Üye</th>
                <th>Tutar</th>
                <th>Durum</th>
              </tr>
            </thead>
            <tbody>
              ${
                rows.length
                  ? rows
                      .map(
                        (a) => `
                <tr>
                  <td class="fw-600">${a.uye}</td>
                  <td>${formatMoney(a.tutar)}</td>
                  <td>${durumBadge(a.durum)}</td>
                </tr>
              `
                      )
                      .join("")
                  : `<tr><td colspan="3" class="text-muted">Henüz aidat kaydı yok</td></tr>`
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

mountLayout({
  page: "dashboard",
  subtitle: "Dernek özet görünümü",
  content: () => `
    <div class="page-header">
      <div>
        <h2 class="page-header__title">Dashboard</h2>
        <p class="page-header__desc">Dernek faaliyetlerinizin genel özeti</p>
      </div>
      <div class="btn-group">
        <a href="uyeler.html" class="btn btn--secondary">${icon("user-plus")} Üye Ekle</a>
        <a href="raporlar.html" class="btn btn--primary">${icon("bar-chart-3")} Raporlar</a>
      </div>
    </div>
    ${renderStats()}
    <div class="grid-2 mb-24">
      <div class="card">
        <div class="card__header">
          <div>
            <h3 class="card__title">Gelir - Gider</h3>
            <p class="card__subtitle">Son 6 aylık trend</p>
          </div>
        </div>
        <div class="card__body">
          <div class="chart-container">
            <canvas id="chart-gelir-gider"></canvas>
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card__header">
          <div>
            <h3 class="card__title">Aidat Durumu</h3>
            <p class="card__subtitle">Üye ödeme dağılımı</p>
          </div>
        </div>
        <div class="card__body">
          <div class="chart-container chart-container--sm">
            <canvas id="chart-aidat"></canvas>
          </div>
        </div>
      </div>
    </div>
    <div class="grid-2">
      ${renderRecentMembers()}
      <div class="stack">
        ${renderUpcomingEvents()}
        ${renderAidatSummary()}
      </div>
    </div>
  `,
});

function initCharts() {
  if (typeof Chart === "undefined") return;

  const gelirCtx = document.getElementById("chart-gelir-gider");
  if (gelirCtx) {
    new Chart(gelirCtx, {
      type: "line",
      data: {
        labels: chartData.gelirGiderAylik.labels,
        datasets: [
          {
            label: "Gelir",
            data: chartData.gelirGiderAylik.gelir,
            borderColor: "#1976d2",
            backgroundColor: "rgba(25, 118, 210, 0.12)",
            fill: true,
            tension: 0.4,
            borderWidth: 2.5,
            pointRadius: 3,
            pointBackgroundColor: "#1976d2",
          },
          {
            label: "Gider",
            data: chartData.gelirGiderAylik.gider,
            borderColor: "#dc2626",
            backgroundColor: "rgba(220, 38, 38, 0.08)",
            fill: true,
            tension: 0.4,
            borderWidth: 2.5,
            pointRadius: 3,
            pointBackgroundColor: "#dc2626",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: "bottom", labels: { usePointStyle: true, padding: 16 } },
        },
        scales: {
          x: { grid: { display: false } },
          y: {
            grid: { color: "#eef2f7" },
            ticks: {
              callback: (v) => (v >= 1000 ? `${v / 1000}k` : v),
            },
          },
        },
      },
    });
  }

  const aidatCtx = document.getElementById("chart-aidat");
  if (aidatCtx) {
    new Chart(aidatCtx, {
      type: "doughnut",
      data: {
        labels: chartData.aidatDurum.labels,
        datasets: [
          {
            data: chartData.aidatDurum.values,
            backgroundColor: ["#16a34a", "#d97706", "#dc2626"],
            borderWidth: 0,
            hoverOffset: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "68%",
        plugins: {
          legend: { position: "bottom", labels: { usePointStyle: true, padding: 16 } },
        },
      },
    });
  }
}

initCharts();
