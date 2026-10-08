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
const tabs = document.querySelector(".tabs");
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
        bubblingMouseEvents: false,
    }).on("click", (event) => {
        // Nur bei Tastaturbedienung den Fokus ins Detailfenster setzen.
        const viaKeyboard = event.originalEvent instanceof KeyboardEvent;
        openSheet(location, { moveFocus: viaKeyboard, panToMarker: true });
    });
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
// Sorgt dafür, dass der gewählte Pin nicht vom Detailfenster verdeckt wird.
function keepMarkerVisible(location) {
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
        }
        else {
            const coveredBottom = Math.max(0, mapRect.bottom - sheetRect.top);
            map.panInside([location.lat, location.lng], {
                paddingTopLeft: [padding, padding + 30],
                paddingBottomRight: [padding, coveredBottom + padding],
            });
        }
    });
}
// Nicht-modales Detailfenster: Karte, Suche und andere Pins bleiben bedienbar.
// Ein Klick auf einen anderen Pin tauscht nur den Inhalt aus.
function openSheet(location, options = {}) {
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
    sheet.scrollTop = 0;
    const wasOpen = sheet.classList.contains("open");
    if (!wasOpen) {
        const active = document.activeElement;
        lastFocusedElement = active instanceof HTMLElement && !sheet.contains(active) ? active : null;
        sheet.inert = false;
        sheet.setAttribute("aria-hidden", "false");
        sheet.classList.add("open");
    }
    if (options.moveFocus)
        closeButton.focus({ preventScroll: true });
    if (options.panToMarker)
        keepMarkerVisible(location);
}
function closeSheet() {
    if (!sheet.classList.contains("open"))
        return;
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
    else if (!isDesktop()) {
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
    const marker = locationMarkers.get(location.id);
    const openIt = () => openSheet(location, { moveFocus: event.detail === 0, panToMarker: true });
    // Cluster bei Bedarf aufklappen, damit der Pin sichtbar ist.
    if (marker && markerCluster.hasLayer(marker)) {
        map.setView([location.lat, location.lng], Math.max(map.getZoom(), 14), { animate: false });
        markerCluster.zoomToShowLayer(marker, openIt);
    }
    else {
        map.setView([location.lat, location.lng], 14);
        openIt();
    }
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
// Klick auf eine freie Stelle der Karte schließt das Fenster; Ziehen/Zoomen nicht.
map.on("click", closeSheet);
document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && sheet.classList.contains("open")) {
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
