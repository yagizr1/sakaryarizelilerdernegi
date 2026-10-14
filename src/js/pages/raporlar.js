import { mountLayout } from "../../components/layout.js";
import { initApp } from "../app.js";
import { chartData } from "../../data/mock.js";
import { icon } from "../utils/icons.js";

initApp();

mountLayout({
  page: "raporlar",
  subtitle: "Analitik ve grafikler",
  content: () => `
    <div class="page-header">
      <div>
        <h2 class="page-header__title">Raporlar</h2>
        <p class="page-header__desc">Gelir, aidat ve üye istatistikleri</p>
      </div>
      <button class="btn btn--outline">${icon("download")} Rapor İndir</button>
    </div>

    <div class="grid-2 mb-24">
      <div class="card">
        <div class="card__header">
          <div>
            <h3 class="card__title">Gelir - Gider</h3>
            <p class="card__subtitle">Aylık karşılaştırma</p>
          </div>
        </div>
        <div class="card__body">
          <div class="chart-container">
            <canvas id="r-gelir-gider"></canvas>
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card__header">
          <div>
            <h3 class="card__title">Aidatlar</h3>
            <p class="card__subtitle">Ödeme durumu dağılımı</p>
          </div>
        </div>
        <div class="card__body">
          <div class="chart-container">
            <canvas id="r-aidat"></canvas>
          </div>
        </div>
      </div>
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="card__header">
          <div>
            <h3 class="card__title">Yeni Üyeler</h3>
            <p class="card__subtitle">Son 6 ayda katılan üyeler</p>
          </div>
        </div>
        <div class="card__body">
          <div class="chart-container">
            <canvas id="r-yeni"></canvas>
          </div>
        </div>
      </div>
    </div>
  `,
});

function initCharts() {
  if (typeof Chart === "undefined") return;

  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: "bottom", labels: { usePointStyle: true, padding: 16 } } },
  };

  new Chart(document.getElementById("r-gelir-gider"), {
    type: "bar",
    data: {
      labels: chartData.gelirGiderAylik.labels,
      datasets: [
        {
          label: "Gelir",
          data: chartData.gelirGiderAylik.gelir,
          backgroundColor: "#1976d2",
          borderRadius: 6,
        },
        {
          label: "Gider",
          data: chartData.gelirGiderAylik.gider,
          backgroundColor: "#90caf9",
          borderRadius: 6,
        },
      ],
    },
    options: {
      ...commonOptions,
      scales: {
        x: { grid: { display: false } },
        y: { grid: { color: "#eef2f7" } },
      },
    },
  });

  new Chart(document.getElementById("r-aidat"), {
    type: "pie",
    data: {
      labels: chartData.aidatDurum.labels,
      datasets: [
        {
          data: chartData.aidatDurum.values,
          backgroundColor: ["#16a34a", "#d97706", "#dc2626"],
          borderWidth: 0,
        },
      ],
    },
    options: commonOptions,
  });

  new Chart(document.getElementById("r-yeni"), {
    type: "line",
    data: {
      labels: chartData.yeniUyeler.labels,
      datasets: [
        {
          label: "Yeni Üye",
          data: chartData.yeniUyeler.values,
          borderColor: "#1976d2",
          backgroundColor: "rgba(25,118,210,0.15)",
          fill: true,
          tension: 0.4,
          borderWidth: 2.5,
          pointBackgroundColor: "#1976d2",
        },
      ],
    },
    options: {
      ...commonOptions,
      scales: {
        x: { grid: { display: false } },
        y: { grid: { color: "#eef2f7" }, beginAtZero: true },
      },
    },
  });
}

initCharts();
