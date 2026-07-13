const C = "anpat-v2";
const ASSETS = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png"];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(C).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return; // 同期のPOST等はそのまま通す
  const isDoc = e.request.mode === "navigate" || e.request.destination === "document";
  if (isDoc) {
    // 画面本体はネット優先（更新を確実に配信、オフライン時はキャッシュ）
    e.respondWith(
      fetch(e.request).then(r => {
        const cp = r.clone();
        caches.open(C).then(c => c.put(e.request, cp));
        return r;
      }).catch(() => caches.match(e.request).then(m => m || caches.match("./index.html")))
    );
  } else {
    e.respondWith(
      caches.match(e.request).then(m => m || fetch(e.request).then(r => {
        const cp = r.clone();
        caches.open(C).then(c => c.put(e.request, cp));
        return r;
      }))
    );
  }
});
