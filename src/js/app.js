/**
 * Uygulama giriş noktası — Vue main.js karşılığı.
 */
export function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;

  window.addEventListener("load", () => {
    const swUrl = new URL("../../sw.js", import.meta.url);
    // import.meta.url = .../src/js/app.js → ../../sw.js = kök
    navigator.serviceWorker.register(swUrl.href).catch(() => {
      /* file:// veya kısıtlı ortamda sessizce geç */
    });
  });
}

export function initApp() {
  registerServiceWorker();
}
