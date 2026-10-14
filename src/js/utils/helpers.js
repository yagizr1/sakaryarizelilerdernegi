/**
 * Ortak yardımcılar — Vue composable / util olarak taşınabilir.
 */

export function formatMoney(value) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value) {
  return new Intl.NumberFormat("tr-TR").format(value);
}

export function durumBadge(durum) {
  const map = {
    aktif: { label: "Aktif", className: "badge--success" },
    pasif: { label: "Pasif", className: "badge--neutral" },
    odendi: { label: "Ödendi", className: "badge--success" },
    bekliyor: { label: "Bekliyor", className: "badge--warning" },
    gecikti: { label: "Gecikti", className: "badge--danger" },
    yaklasan: { label: "Yaklaşan", className: "badge--info" },
    tamamlandi: { label: "Tamamlandı", className: "badge--neutral" },
  };
  const item = map[durum] || { label: durum, className: "badge--neutral" };
  return `<span class="badge ${item.className}">${item.label}</span>`;
}

export function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

export function toast(message) {
  let el = document.getElementById("app-toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "app-toast";
    el.style.cssText = `
      position: fixed; bottom: 24px; right: 24px; z-index: 300;
      background: #1e293b; color: white; padding: 12px 20px;
      border-radius: 10px; font-size: 0.875rem; font-weight: 500;
      box-shadow: 0 10px 28px rgba(15,23,42,0.2);
      opacity: 0; transform: translateY(8px); transition: all 220ms ease;
      max-width: 320px;
    `;
    document.body.appendChild(el);
  }
  el.textContent = message;
  requestAnimationFrame(() => {
    el.style.opacity = "1";
    el.style.transform = "translateY(0)";
  });
  clearTimeout(el._timer);
  el._timer = setTimeout(() => {
    el.style.opacity = "0";
    el.style.transform = "translateY(8px)";
  }, 2600);
}
