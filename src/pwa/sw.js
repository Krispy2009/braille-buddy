/* global VERSION, PRECACHE, self, caches, fetch, Request, URL, setTimeout */
// Service worker template. At build time serviceWorkerPlugin.ts prepends
//   const VERSION = "<hash of every emitted file>";
//   const PRECACHE = ["./", "assets/index-abc123.js", ...];
// and writes the result to build/sw.js. Any change to any file changes
// VERSION, so the browser sees a new sw.js and installs it.
//
// Update strategy (see also the README):
// - Each version lives in its own cache, filled atomically on install, so a
//   cache always holds an index.html and exactly the assets it references.
//   We never write network responses into it, so it can't drift.
// - The new worker takes over at once (skipWaiting + clients.claim) but we
//   never reload open pages. The app is one JS and one CSS file, so an
//   already-running page has nothing left to fetch and keeps working; the
//   next load the user starts gets the new version, whole.
// - Navigations go to the network first, so an online user always gets the
//   latest deploy even before the new worker has installed. Offline, or on a
//   network too slow to answer within NETWORK_TIMEOUT_MS, they get the
//   cached copy, which matches the cached assets.

const CACHE = "braille-buddy-" + VERSION;
const NETWORK_TIMEOUT_MS = 4000;
// ignoreVary: the page loads its module script with an Origin header that
// the install-time fetch didn't send, so a "Vary: Origin" response (some
// servers add it) would otherwise never match. Each URL is cached only once.
const MATCH = { cacheName: CACHE, ignoreVary: true };

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      // cache: "reload" skips the HTTP cache, so a stale index.html can't
      // end up next to new assets.
      .then((cache) =>
        cache.addAll(PRECACHE.map((url) => new Request(url, { cache: "reload" })))
      )
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("braille-buddy-") && key !== CACHE)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) {
    return;
  }
  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request));
  } else {
    // Hashed assets never change; icons and the manifest are re-cached with
    // every version. Fall back to the network for anything not precached.
    event.respondWith(
      caches.match(request, MATCH).then((cached) => cached || fetch(request))
    );
  }
});

function networkFirst(request) {
  // "./" rather than "index.html": hosts that redirect /index.html to / would
  // give us a redirected response, which browsers refuse for navigations.
  const cached = () =>
    caches.match("./", MATCH).then((response) => response || fetch(request));
  const network = fetch(request);
  network.catch(() => {}); // a late failure after the timeout is not an error
  const timeout = new Promise((resolve) => setTimeout(resolve, NETWORK_TIMEOUT_MS));
  return Promise.race([network, timeout])
    .then((response) => response || cached())
    .catch(cached);
}
