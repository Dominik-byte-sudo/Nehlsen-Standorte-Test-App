/// <reference types="leaflet.markercluster" />
import { distanceKm, escapeHtml, filterLocations, validateLocations } from "./domain.js";
const byId = (id) => {
    const element = document.getElementById(id);
    if (!element)
        throw new Error(`Missing required element #${id}`);
    return element;
};
const mapElement = byId("map");
const listElement = byId("list");
const countElement = byId("count");
const queryInput = byId("q");
const nearButton = byId("nearBtn");
const sheet = byId("sheet");
const closeButton = byId("sClose");
const appHeader = document.querySelector("#app > header");
const tabs = document.querySelector(".tabs");
const main = document.querySelector("#app > main");
const mapTab = byId("tMap");
const listTab = byId("tList");
const toastElement = byId("toast");
const map = L.map(mapElement, { zoomControl: false }).setView([52.9, 10.5], 6);
L.control.zoom({ position: "bottomright" }).addTo(map);
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
let locations = [];
let origin = null;
let userMarker = null;
let activeQuery = "";
let toastTimer;
let lastFocusedElement = null;
const locationMarkers = new Map();
const isDesktop = () => window.matchMedia("(min-width: 800px)").matches;
function toast(message) {
    toastElement.textContent = message;
    toastElement.classList.remove("hidden");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toastElement.classList.add("hidden"), 3500);
}
function filteredLocations() {
    return filterLocations(locations, activeQuery, origin ?? undefined);
}
function makeMarker(location) {
    return L.marker([location.lat, location.lng], {
        icon: markerIcon,
        title: `${location.company} – ${location.name}`,
        keyboard: true,
    }).on("click", () => openSheet(location));
}
function render() {
    const results = filteredLocations();
    markerCluster.clearLayers();
    markerCluster.addLayers(results.map((location) => locationMarkers.get(location.id)).filter(Boolean));
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
        const bounds = L.latLngBounds(results.map((location) => [location.lat, location.lng]));
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
    }
}
function focusableElements() {
    return [...sheet.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])')]
        .filter((element) => !element.hasAttribute("hidden"));
}
function setBackgroundInert(inert) {
    for (const element of [appHeader, tabs, main]) {
        if (element)
            element.inert = inert;
    }
}
function openSheet(location) {
    const destination = encodeURIComponent(location.address);
    const distance = origin ? `<div class="distance-note">ca. ${Math.round(distanceKm(origin, location))} km Luftlinie entfernt</div>` : "";
    byId("sBody").innerHTML = `<div class="co">${escapeHtml(location.company)}</div>
    <h2 id="sTitle">${escapeHtml(location.name)}</h2>${distance}
    <div class="row"><span aria-hidden="true">⌖</span><span>${escapeHtml(location.address)}</span></div>
    <div class="row"><span aria-hidden="true">☎</span><a href="tel:${location.phone.replace(/[^\d+]/g, "")}">${escapeHtml(location.phone)}</a></div>
    <div class="row"><span aria-hidden="true">✉</span><a href="mailto:${escapeHtml(location.email)}">${escapeHtml(location.email)}</a></div>
    <div class="row"><span aria-hidden="true">◷</span><span class="hours">${escapeHtml(location.hours)}</span></div>
    <div class="actions">
      <a class="btn primary" target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?api=1&amp;destination=${destination}">Route starten</a>
      <a class="btn secondary" target="_blank" rel="noopener" href="https://maps.apple.com/?daddr=${destination}" aria-label="Route in Apple Karten">Apple Karten</a>
    </div>`;
    lastFocusedElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    sheet.inert = false;
    sheet.setAttribute("aria-hidden", "false");
    sheet.classList.add("open");
    setBackgroundInert(true);
    closeButton.focus({ preventScroll: true });
}
function closeSheet() {
    if (!sheet.classList.contains("open"))
        return;
    sheet.classList.remove("open");
    sheet.setAttribute("aria-hidden", "true");
    sheet.inert = true;
    setBackgroundInert(false);
    const fallback = isDesktop() ? queryInput : mapTab;
    const focusTarget = lastFocusedElement?.isConnected && !lastFocusedElement.closest(".hidden")
        ? lastFocusedElement
        : fallback;
    focusTarget.focus({ preventScroll: true });
    lastFocusedElement = null;
}
function showTab(tab) {
    const showMap = tab === "map";
    mapTab.setAttribute("aria-selected", String(showMap));
    listTab.setAttribute("aria-selected", String(!showMap));
    mapTab.tabIndex = showMap ? 0 : -1;
    listTab.tabIndex = showMap ? -1 : 0;
    if (!isDesktop()) {
        mapElement.classList.toggle("hidden", !showMap);
        listElement.classList.toggle("hidden", showMap);
    }
    else {
        mapElement.classList.remove("hidden");
        listElement.classList.remove("hidden");
    }
    if (showMap) {
        window.requestAnimationFrame(() => map.invalidateSize());
    }
    else {
        closeSheet();
    }
}
async function loadLocations() {
    try {
        const response = await fetch("./standorte.json", { cache: "no-cache" });
        if (!response.ok)
            throw new Error(`Standortdaten konnten nicht geladen werden (${response.status}).`);
        const records = await response.json();
        validateLocations(records);
        locations = records;
        for (const location of locations)
            locationMarkers.set(location.id, makeMarker(location));
        render();
    }
    catch (error) {
        countElement.textContent = "Standortdaten nicht verfügbar";
        toast(error instanceof Error ? error.message : "Standortdaten konnten nicht geladen werden.");
    }
}
listElement.addEventListener("click", (event) => {
    const button = event.target.closest(".item");
    if (!button)
        return;
    const location = locations.find((candidate) => candidate.id === button.dataset.id);
    if (!location)
        return;
    showTab("map");
    map.setView([location.lat, location.lng], 14);
    openSheet(location);
});
mapTab.addEventListener("click", () => showTab("map"));
listTab.addEventListener("click", () => showTab("list"));
tabs?.addEventListener("keydown", (event) => {
    if (!(event instanceof KeyboardEvent))
        return;
    const order = [mapTab, listTab];
    const currentIndex = order.indexOf(document.activeElement);
    if (currentIndex < 0)
        return;
    let nextIndex = null;
    if (event.key === "ArrowRight" || event.key === "ArrowDown")
        nextIndex = (currentIndex + 1) % order.length;
    if (event.key === "ArrowLeft" || event.key === "ArrowUp")
        nextIndex = (currentIndex + order.length - 1) % order.length;
    if (event.key === "Home")
        nextIndex = 0;
    if (event.key === "End")
        nextIndex = order.length - 1;
    if (nextIndex === null)
        return;
    event.preventDefault();
    order[nextIndex].focus();
    showTab(nextIndex === 0 ? "map" : "list");
});
queryInput.addEventListener("input", () => {
    activeQuery = queryInput.value;
    render();
});
closeButton.addEventListener("click", closeSheet);
map.on("click", closeSheet);
document.addEventListener("keydown", (event) => {
    if (!sheet.classList.contains("open"))
        return;
    if (event.key === "Escape") {
        event.preventDefault();
        closeSheet();
        return;
    }
    if (event.key !== "Tab")
        return;
    const focusables = focusableElements();
    if (!focusables.length) {
        event.preventDefault();
        closeButton.focus({ preventScroll: true });
        return;
    }
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
    }
    else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
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
        }).addTo(map);
        render();
        const nearest = filteredLocations()[0];
        if (!nearest)
            return;
        map.fitBounds(L.latLngBounds([[origin.lat, origin.lng], [nearest.lat, nearest.lng]]), { padding: [50, 50] });
        toast(`Nächster Standort: ${nearest.company} ${nearest.name} (${Math.round(distanceKm(origin, nearest))} km)`);
        if (!isDesktop())
            showTab("list");
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
