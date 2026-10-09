/// <reference types="leaflet.markercluster" />
declare const L: typeof import("leaflet");

import { distanceKm, escapeHtml, filterLocations, validateLocations, type Coordinates, type Location } from "./domain.js";


const byId = <T extends HTMLElement>(id: string): T => {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Missing required element #${id}`);
  return element as T;
};

const mapElement = byId<HTMLDivElement>("map");
const listElement = byId<HTMLDivElement>("list");

const countElement = byId<HTMLParagraphElement>("count");
const queryInput = byId<HTMLInputElement>("q");
const nearButton = byId<HTMLButtonElement>("nearBtn");
const sheet = byId<HTMLElement>("sheet");
const closeButton = byId<HTMLButtonElement>("sClose");
const tabs = document.querySelector<HTMLElement>(".tabs");
const mapTab = byId<HTMLButtonElement>("tMap");
const listTab = byId<HTMLButtonElement>("tList");
const toastElement = byId<HTMLDivElement>("toast");
const workspace = byId<HTMLElement>("workspace");
const listToggle = byId<HTMLButtonElement>("listToggle");
const themeToggle = byId<HTMLButtonElement>("themeToggle");
const themeDock = byId<HTMLElement>("themeDock");
const themeColor = byId<HTMLMetaElement>("themeColor");
const appearanceToggle = byId<HTMLButtonElement>("appearanceToggle");
const appearanceMenu = byId<HTMLDivElement>("appearanceMenu");
const designNormal = byId<HTMLButtonElement>("designNormal");
const designGlass = byId<HTMLButtonElement>("designGlass");

const map = L.map(mapElement, { zoomControl: false }).setView([52.9, 10.5], 6);
L.control.zoom({ position: "bottomright", zoomInTitle: "Vergrößern", zoomOutTitle: "Verkleinern" }).addTo(map);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
}).addTo(map);

const markerIcon = L.divIcon({
  className: "",
  html: '<div class="pin"></div>',
  iconSize: [26, 26],
  iconAnchor: [13, 26],
});
const markerCluster = L.markerClusterGroup({ showCoverageOnHover: false, maxClusterRadius: 45 });
map.addLayer(markerCluster);

let locations: Location[] = [];
let origin: Coordinates | null = null;
let userMarker: L.Marker | null = null;
let activeQuery = "";
let toastTimer: number | undefined;
let lastFocusedElement: HTMLElement | null = null;
const locationMarkers = new Map<string, L.Marker>();

const isDesktop = (): boolean => window.matchMedia("(min-width: 800px)").matches;

function toast(message: string): void {
  toastElement.textContent = message;
  toastElement.classList.remove("hidden");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toastElement.classList.add("hidden"), 3500);
}

type ColorTheme = "light" | "dark";
type DesignStyle = "normal" | "glass";

function preferredTheme(): ColorTheme {
  try {
    const savedTheme = localStorage.getItem("nehlsen-theme");
    if (savedTheme === "light" || savedTheme === "dark") return savedTheme;
  } catch {
    // Private-browsing policies may disable local storage; use the system setting.
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme: ColorTheme, save = false): void {
  document.documentElement.dataset.theme = theme;
  themeToggle.setAttribute("aria-pressed", String(theme === "dark"));
  const action = theme === "dark" ? "Hellmodus aktivieren" : "Dunkelmodus aktivieren";
  themeToggle.setAttribute("aria-label", action);
  themeToggle.title = action;
  const label = themeToggle.querySelector<HTMLElement>(".theme-label");
  if (label) label.textContent = theme === "dark" ? "Hell" : "Dunkel";
  themeColor.content = "#6ab023";
  if (save) {
    try {
      localStorage.setItem("nehlsen-theme", theme);
    } catch {
      toast("Die Designauswahl kann auf diesem Gerät nicht gespeichert werden.");
    }
  }
}

applyTheme(preferredTheme());
themeToggle.addEventListener("click", () => {
  applyTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark", true);
});

function preferredDesign(): DesignStyle {
  try {
    const savedDesign = localStorage.getItem("nehlsen-design");
    if (savedDesign === "normal" || savedDesign === "glass") return savedDesign;
  } catch {
    // Falls localStorage gesperrt ist, bleibt das normale Design aktiv.
  }
  return "normal";
}

function closeAppearanceMenu(): void {
  appearanceMenu.classList.add("hidden");
  appearanceToggle.setAttribute("aria-expanded", "false");
}

function applyDesign(design: DesignStyle, save = false): void {
  document.documentElement.dataset.design = design;
  designNormal.setAttribute("aria-pressed", String(design === "normal"));
  designGlass.setAttribute("aria-pressed", String(design === "glass"));
  if (save) {
    try {
      localStorage.setItem("nehlsen-design", design);
    } catch {
      toast("Die Designauswahl kann auf diesem Gerät nicht gespeichert werden.");
    }
  }
}

applyDesign(preferredDesign());
appearanceToggle.addEventListener("click", () => {
  const open = appearanceToggle.getAttribute("aria-expanded") !== "true";
  appearanceMenu.classList.toggle("hidden", !open);
  appearanceToggle.setAttribute("aria-expanded", String(open));
});
designNormal.addEventListener("click", () => {
  applyDesign("normal", true);
  closeAppearanceMenu();
});
designGlass.addEventListener("click", () => {
  applyDesign("glass", true);
  closeAppearanceMenu();
});
listToggle.addEventListener("click", () => {
  const expanded = listToggle.getAttribute("aria-expanded") !== "false";
  const nextExpanded = !expanded;
  workspace.classList.toggle("list-collapsed", !nextExpanded);
  listToggle.setAttribute("aria-expanded", String(nextExpanded));
  const action = nextExpanded ? "Standortliste ausblenden" : "Standortliste einblenden";
  listToggle.setAttribute("aria-label", action);
  listToggle.title = action;
  window.requestAnimationFrame(() => map.invalidateSize());
});
workspace.addEventListener("transitionend", (event: TransitionEvent) => {
  if (event.propertyName !== "grid-template-columns") return;
  window.requestAnimationFrame(() => map.invalidateSize());
});

function filteredLocations(): Location[] {
  return filterLocations(locations, activeQuery, origin ?? undefined);
}

function makeMarker(location: Location): L.Marker {
  return L.marker([location.lat, location.lng], {
    icon: markerIcon,
    title: `${location.company} – ${location.name}`,
    keyboard: true,
    bubblingMouseEvents: false,
  }).on("click", (event: L.LeafletMouseEvent) => {
    // Nur bei Tastaturbedienung den Fokus ins Detailfenster setzen.
    const viaKeyboard = event.originalEvent instanceof KeyboardEvent;
    openSheet(location, { moveFocus: viaKeyboard, panToMarker: true });
  });
}

function render(): void {
  const results = filteredLocations();
  markerCluster.clearLayers();
  markerCluster.addLayers(results.map((location) => locationMarkers.get(location.id)!).filter(Boolean));
  countElement.textContent = `${results.length} von ${locations.length} Standorten`;

  if (!results.length) {
    listElement.innerHTML = `<div class="empty">Kein Standort gefunden für „${escapeHtml(activeQuery)}“.</div>`;
    return;
  }

  listElement.innerHTML = results.map((location) => {
    const distance = origin ? distanceKm(origin, location) : null;
    const distanceBadge = distance === null ? "" : `<span class="dist">${distance < 10 ? distance.toFixed(1) : Math.round(distance)} km</span>`;
    return `<div class="item-wrap" role="listitem"><button class="item" type="button" data-id="${escapeHtml(location.id)}">
      ${distanceBadge}<b>${escapeHtml(location.company)} · ${escapeHtml(location.name)}</b>
      <span>${escapeHtml(location.address)}</span></button></div>`;
  }).join("");

  if (activeQuery && results.length) {
    const bounds = L.latLngBounds(results.map((location) => [location.lat, location.lng] as [number, number]));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
  }
}

// Sorgt dafür, dass der gewählte Pin nicht vom Detailfenster verdeckt wird.
function keepMarkerVisible(location: Location): void {
  window.requestAnimationFrame(() => {
    const sheetRect = sheet.getBoundingClientRect();
    const mapRect = mapElement.getBoundingClientRect();
    const padding = 24;
    if (isDesktop()) {
      const coveredRight = Math.max(0, mapRect.right - sheetRect.left);
      map.panInside([location.lat, location.lng], {
        paddingTopLeft: [padding, padding],
        paddingBottomRight: [coveredRight + padding, padding],
      });
    } else {
      const coveredBottom = Math.max(0, mapRect.bottom - sheetRect.top);
      map.panInside([location.lat, location.lng], {
        paddingTopLeft: [padding, padding + 30],
        paddingBottomRight: [padding, coveredBottom + padding],
      });
    }
  });
}

interface OpenSheetOptions {
  moveFocus?: boolean;
  panToMarker?: boolean;
}

// Nicht-modales Detailfenster: Karte, Suche und andere Pins bleiben bedienbar.
// Ein Klick auf einen anderen Pin tauscht nur den Inhalt aus.
function openSheet(location: Location, options: OpenSheetOptions = {}): void {
  const destination = encodeURIComponent(location.address);
  const distance = origin ? `<div class="distance-note">ca. ${Math.round(distanceKm(origin, location))} km Luftlinie entfernt</div>` : "";
  byId<HTMLDivElement>("sBody").innerHTML = `<div class="co">${escapeHtml(location.company)}</div>
    <h2 id="sTitle">${escapeHtml(location.name)}</h2>${distance}
    <div class="row"><span aria-hidden="true"><svg class="row-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg></span><span>${escapeHtml(location.address)}</span></div>
    <div class="row"><span aria-hidden="true"><svg class="row-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.4 19.4 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7l.4 2.8a2 2 0 0 1-.6 1.7L7.5 9.6a16 16 0 0 0 6.9 6.9l1.4-1.4a2 2 0 0 1 1.7-.6l2.8.4a2 2 0 0 1 1.7 2Z"/></svg></span><a href="tel:${location.phone.replace(/[^\d+]/g, "")}">${escapeHtml(location.phone)}</a></div>
    <div class="row"><span aria-hidden="true"><svg class="row-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg></span><a href="mailto:${escapeHtml(location.email)}">${escapeHtml(location.email)}</a></div>
    <div class="row"><span aria-hidden="true"><svg class="row-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg></span><span class="hours">${escapeHtml(location.hours)}</span></div>
    <div class="actions">
      <a class="btn primary" target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?api=1&amp;destination=${destination}">Route starten</a>
      <a class="btn secondary" target="_blank" rel="noopener" href="https://maps.apple.com/?daddr=${destination}" aria-label="Route in Apple Karten">Apple Karten</a>
    </div>`;
  sheet.scrollTop = 0;

  const wasOpen = sheet.classList.contains("open");
  if (!wasOpen) {
    const active = document.activeElement;
    lastFocusedElement = active instanceof HTMLElement && !sheet.contains(active) ? active : null;
    sheet.inert = false;
    sheet.setAttribute("aria-hidden", "false");
    sheet.classList.add("open");
  }

  if (options.moveFocus) closeButton.focus({ preventScroll: true });
  if (options.panToMarker) keepMarkerVisible(location);
}

function closeSheet(): void {
  if (!sheet.classList.contains("open")) return;
  const focusWasInside = sheet.contains(document.activeElement);
  sheet.classList.remove("open");
  sheet.setAttribute("aria-hidden", "true");
  sheet.inert = true;
  // Fokus nur zurückgeben, wenn er im Fenster lag – sonst nicht "wegreißen".
  if (focusWasInside) {
    const fallback = isDesktop() ? queryInput : mapTab;
    const focusTarget = lastFocusedElement?.isConnected && !lastFocusedElement.closest(".hidden")
      ? lastFocusedElement
      : fallback;
    focusTarget.focus({ preventScroll: true });
  }
  lastFocusedElement = null;
}

function showTab(tab: "map" | "list"): void {
  const showMap = tab === "map";
  mapTab.setAttribute("aria-selected", String(showMap));
  listTab.setAttribute("aria-selected", String(!showMap));
  mapTab.tabIndex = showMap ? 0 : -1;
  listTab.tabIndex = showMap ? -1 : 0;
  if (!isDesktop()) {
    mapElement.classList.toggle("hidden", !showMap);
    listElement.classList.toggle("hidden", showMap);
  } else {
    mapElement.classList.remove("hidden");
    listElement.classList.remove("hidden");
  }
  if (showMap) {
    window.requestAnimationFrame(() => map.invalidateSize());
  } else if (!isDesktop()) {
    closeSheet();
  }
}

async function loadLocations(): Promise<void> {
  try {
    const response = await fetch("./standorte.json", { cache: "no-cache" });
    if (!response.ok) throw new Error(`Standortdaten konnten nicht geladen werden (${response.status}).`);
    const records = await response.json() as Location[];
    validateLocations(records);
    locations = records;
    for (const location of locations) locationMarkers.set(location.id, makeMarker(location));
    render();
  } catch (error) {
    countElement.textContent = "Standortdaten nicht verfügbar";
    toast(error instanceof Error ? error.message : "Standortdaten konnten nicht geladen werden.");
  }
}

listElement.addEventListener("click", (event) => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>(".item");
  if (!button) return;
  const location = locations.find((candidate) => candidate.id === button.dataset.id);
  if (!location) return;
  showTab("map");
  const marker = locationMarkers.get(location.id);
  const openIt = (): void => openSheet(location, { moveFocus: event.detail === 0, panToMarker: true });
  // Cluster bei Bedarf aufklappen, damit der Pin sichtbar ist.
  if (marker && markerCluster.hasLayer(marker)) {
    map.setView([location.lat, location.lng], Math.max(map.getZoom(), 14), { animate: false });
    openIt();
    markerCluster.zoomToShowLayer(marker, () => keepMarkerVisible(location));
  } else {
    map.setView([location.lat, location.lng], 14);
    openIt();
  }
});

mapTab.addEventListener("click", () => showTab("map"));
listTab.addEventListener("click", () => showTab("list"));
tabs?.addEventListener("keydown", (event) => {
  if (!(event instanceof KeyboardEvent)) return;
  const order = [mapTab, listTab];
  const currentIndex = order.indexOf(document.activeElement as HTMLButtonElement);
  if (currentIndex < 0) return;
  let nextIndex: number | null = null;
  if (event.key === "ArrowRight" || event.key === "ArrowDown") nextIndex = (currentIndex + 1) % order.length;
  if (event.key === "ArrowLeft" || event.key === "ArrowUp") nextIndex = (currentIndex + order.length - 1) % order.length;
  if (event.key === "Home") nextIndex = 0;
  if (event.key === "End") nextIndex = order.length - 1;
  if (nextIndex === null) return;
  event.preventDefault();
  order[nextIndex].focus();
  showTab(nextIndex === 0 ? "map" : "list");
});

queryInput.addEventListener("input", () => {
  activeQuery = queryInput.value;
  render();
});

closeButton.addEventListener("click", closeSheet);
// Klick auf eine freie Stelle der Karte schließt das Fenster; Ziehen/Zoomen nicht.
map.on("click", closeSheet);
document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  if (!appearanceMenu.classList.contains("hidden")) {
    event.preventDefault();
    closeAppearanceMenu();
    appearanceToggle.focus({ preventScroll: true });
  }
  if (sheet.classList.contains("open")) {
    event.preventDefault();
    closeSheet();
  }
});

nearButton.addEventListener("click", () => {
  if (!navigator.geolocation) {
    toast("Standortbestimmung wird nicht unterstützt.");
    return;
  }
  nearButton.disabled = true;
  navigator.geolocation.getCurrentPosition((position) => {
    nearButton.disabled = false;
    origin = { lat: position.coords.latitude, lng: position.coords.longitude };
    userMarker?.remove();
    userMarker = L.marker([origin.lat, origin.lng], {
      icon: L.divIcon({ className: "", html: '<div class="me"></div>', iconSize: [22, 22] }),
      interactive: false,
    }).addTo(map);
    render();
      const nearest = filteredLocations()[0];
    if (!nearest) return;
    map.fitBounds(L.latLngBounds([[origin.lat, origin.lng], [nearest.lat, nearest.lng]]), { padding: [50, 50] });
    toast(`Nächster Standort: ${nearest.company} ${nearest.name} (${Math.round(distanceKm(origin, nearest))} km)`);
    if (!isDesktop()) showTab("list");
  }, () => {
    nearButton.disabled = false;
    toast("Standort nicht verfügbar – bitte Freigabe erlauben.");
  }, { enableHighAccuracy: true, timeout: 10000 });
});

window.addEventListener("resize", () => showTab(mapTab.getAttribute("aria-selected") === "true" ? "map" : "list"));

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => toast("Offline-Speicherung konnte nicht aktiviert werden."));
  });
}

showTab("map");
void loadLocations();
