// Bump the version whenever a cached app asset changes.
const VERSION = "v50";
const APP_CACHE = `nehlsen-app-${VERSION}`;
const TILE_CACHE = `nehlsen-tiles-${VERSION}`;
// Nur Caches dieser App: aktuelle Namen sowie die Altbestände vor der Umbenennung (app-vNN, tiles-vNN).
const OWN_CACHE = /^(nehlsen-(app|tiles)-|(app|tiles)-v\d+$)/;
const CORE = [
  "./",
  "./index.html",
  "./css/app.css",
  "./js/app.js",
  "./js/domain.js",
  "./js/core/dom.js",
  "./js/core/storage.js",
  "./js/core/toast.js",
  "./js/core/viewport.js",
  "./js/data/app-state.js",
  "./js/data/locations.js",
  "./js/detail/sheet.js",
  "./js/detail/sheet-gesture.js",
  "./js/detail/sheet-template.js",
  "./js/i18n/strings.js",
  "./js/list/location-list.js",
  "./js/list/scope-filter.js",
  "./js/map/keep-marker-visible.js",
  "./js/map/map-view.js",
  "./js/map/markers.js",
  "./js/map/user-location.js",
  "./js/pwa/app-version.js",
  "./js/pwa/service-worker.js",
  "./js/settings/clear-data.js",
  "./js/settings/design.js",
  "./js/settings/language.js",
  "./js/settings/settings-menu.js",
  "./js/settings/theme.js",
  "./js/views/escape-key.js",
  "./js/views/layout.js",
  "./js/views/tabs.js",
  "./standorte.json",
  "./assets/nehlsen-logo.png",
  "./manifest.webmanifest",
  "./vendor/leaflet.js",
  "./vendor/leaflet.css",
  "./vendor/leaflet.markercluster.js",
  "./vendor/MarkerCluster.css",
  "./vendor/MarkerCluster.Default.css",
  "./vendor/images/layers.png",
  "./vendor/images/layers-2x.png",
  "./vendor/images/marker-icon.png",
  "./vendor/images/marker-icon-2x.png",
  "./vendor/images/marker-shadow.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
];
const TILE_LIMIT = 500;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(APP_CACHE)
      .then((cache) => cache.addAll(CORE.map((path) => new Request(path, { cache: "reload" }))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys
        .filter((key) => OWN_CACHE.test(key) && key !== APP_CACHE && key !== TILE_CACHE)
        .map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

async function trimTileCache(cache) {
  const keys = await cache.keys();
  const overflow = keys.length - TILE_LIMIT;
  if (overflow > 0) await Promise.all(keys.slice(0, overflow).map((key) => cache.delete(key)));
}

async function handleTile(request) {
  const cache = await caches.open(TILE_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      await cache.put(request, response.clone());
      await trimTileCache(cache);
    }
    return response;
  } catch {
    return new Response("Map tile unavailable offline", { status: 504, statusText: "Offline" });
  }
}

async function handleSameOrigin(request) {
  const cache = await caches.open(APP_CACHE);
  if (request.mode === "navigate") {
    try {
      const response = await fetch(request);
      if (response.ok) await cache.put("./index.html", response.clone());
      return response;
    } catch {
      return (await cache.match("./index.html")) ?? Response.error();
    }
  }
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) await cache.put(request, response.clone());
    return response;
  } catch {
    return Response.error();
  }
}

self.addEventListener("message", (event) => {
  if (event.data?.type !== "refresh-app-files") return;
  const reply = (ok) => event.ports[0]?.postMessage(ok);
  event.waitUntil(
    caches.open(APP_CACHE)
      .then((cache) => cache.addAll(CORE.map((path) => new Request(path, { cache: "reload" }))))
      .then(() => reply(true), () => reply(false)),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.hostname.endsWith("tile.openstreetmap.org")) {
    event.respondWith(handleTile(request));
    return;
  }
  if (url.origin === self.location.origin) {
    event.respondWith(handleSameOrigin(request));
  }
});
