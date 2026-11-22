// Network-first service worker: always tries fresh files, falls back to cache offline.
// HTML/navigations use cache: "no-store" so a stale index.html cannot pin an old bundle.
const CACHE = "doe-v2";
self.addEventListener("install", (e) => { self.skipWaiting(); });
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  const url = new URL(req.url);
  const isDoc = req.mode === "navigate" || (req.headers.get("accept") || "").includes("text/html") || /\/$|index\.html$/.test(url.pathname);
  e.respondWith(
    fetch(req, isDoc ? { cache: "no-store" } : undefined).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => undefined);
      return res;
    }).catch(() => caches.match(req).then((r) => r || caches.match("./")))
  );
});
