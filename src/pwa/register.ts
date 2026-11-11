// Registers the service worker that makes the app work offline. Only in
// production builds: in dev it would cache stale modules, and under Vitest
// there is nothing to register. When service workers are missing or blocked
// the app works exactly as it would without one, just not offline.
export const registerServiceWorker = (
  isProduction: boolean = import.meta.env.PROD,
  win: Window = window
) => {
  if (!isProduction || !("serviceWorker" in win.navigator)) {
    return;
  }
  const register = () => {
    try {
      win.navigator.serviceWorker
        .register(import.meta.env.BASE_URL + "sw.js")
        .catch(() => {});
    } catch {
      // Some browsers throw instead of rejecting when storage is blocked.
    }
  };
  // Wait for load so caching every file doesn't compete with first paint.
  if (win.document.readyState === "complete") {
    register();
  } else {
    win.addEventListener("load", register, { once: true });
  }
};
