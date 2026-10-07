// Service Worker: App laeuft auch bei schlechtem Netz. Version erhoehen, wenn index.html geaendert wird!
const VERSION = "v1";
const APP = "app-" + VERSION, TILES = "tiles-" + VERSION;
const CORE = ["./", "index.html", "manifest.webmanifest", "icons/icon-192.png", "icons/icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(APP).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== APP && k !== TILES).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET") return;
  // Kartenkacheln: erst Cache, sonst Netz (max. ca. 500 Kacheln)
  if (url.hostname.endsWith("tile.openstreetmap.org")) {
    e.respondWith(caches.open(TILES).then(async c => {
      const hit = await c.match(e.request);
      if (hit) return hit;
      const res = await fetch(e.request);
      if (res.ok) { c.put(e.request, res.clone()); c.keys().then(k => { if (k.length > 500) c.delete(k[0]); }); }
      return res;
    }).catch(() => new Response("", {status: 504})));
    return;
  }
  // Eigene Dateien: erst Netz (immer aktuell), offline aus Cache
  if (url.origin === location.origin) {
    e.respondWith(fetch(e.request).then(res => {
      const copy = res.clone(); caches.open(APP).then(c => c.put(e.request, copy)); return res;
    }).catch(() => caches.match(e.request).then(r => r || caches.match("index.html"))));
    return;
  }
  // Bibliotheken (Leaflet, Schrift): Cache, sonst Netz
  e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
    if (res.ok) { const copy = res.clone(); caches.open(APP).then(c => c.put(e.request, copy)); }
    return res;
  })));
});
