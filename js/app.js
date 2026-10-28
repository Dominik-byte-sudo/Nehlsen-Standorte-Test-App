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
const sheetGrab = sheet.querySelector(".grab");
if (!sheetGrab)
    throw new Error("Missing required element .grab");
const viewControls = byId("viewControls");
const tabs = document.querySelector(".tabs");
const mapTab = byId("tMap");
const listTab = byId("tList");
const mobileMenuToggle = byId("mobileMenuToggle");
const toastElement = byId("toast");
const workspace = byId("workspace");
const listToggle = byId("listToggle");
const themeToggle = byId("themeToggle");
const themeDock = byId("themeDock");
const themeColor = byId("themeColor");
const appearanceToggle = byId("appearanceToggle");
const appearanceMenu = byId("appearanceMenu");
const designNormal = byId("designNormal");
const designGlass = byId("designGlass");
const clearStorageButton = byId("clearStorage");
const settingsMain = byId("settingsMain");
const designMenu = byId("designMenu");
const designMenuToggle = byId("designMenuToggle");
const designBack = byId("designBack");
const designValue = byId("designValue");
const themeMenu = byId("themeMenu");
const themeMenuToggle = byId("themeMenuToggle");
const themeBack = byId("themeBack");
const themeValue = byId("themeValue");
const themeSystem = byId("themeSystem");
const themeLight = byId("themeLight");
const themeDark = byId("themeDark");
const uiStrings = {
    de: {
        settingsTitle: "Einstellungen",
        designStyle: "Designstil",
        clearStorage: "Lokalen Speicher leeren",
        clearStorageTitle: "Gespeicherte Einstellungen und Zwischenspeicher löschen und neu laden",
        back: "Zurück",
        colorMode: "Farbmodus",
        colorSystem: "System",
        colorLight: "Hell",
        colorDark: "Dunkel",
    },
    en: {
        settingsTitle: "Settings",
        designStyle: "Design style",
        clearStorage: "Clear Local Storage",
        clearStorageTitle: "Clear saved settings and cache, then reload",
        back: "Back",
        colorMode: "Color mode",
        colorSystem: "System",
        colorLight: "Light",
        colorDark: "Dark",
    },
};
function detectUiLanguage() {
    const systemLanguage = navigator.languages?.[0] ?? navigator.language ?? "";
    return systemLanguage.toLowerCase().startsWith("de") ? "de" : "en";
}
const uiLanguage = detectUiLanguage();
const uiText = uiStrings[uiLanguage];
for (const element of document.querySelectorAll("[data-i18n], [data-i18n-title], [data-i18n-aria-label]")) {
    const { i18n, i18nTitle, i18nAriaLabel } = element.dataset;
    if (i18n)
        element.textContent = uiText[i18n];
    if (i18nTitle)
        element.title = uiText[i18nTitle];
    if (i18nAriaLabel)
        element.setAttribute("aria-label", uiText[i18nAriaLabel]);
}
const map = L.map(mapElement, { zoomControl: false }).setView([52.9, 10.5], 6);
L.control.zoom({ position: "bottomright", zoomInTitle: "Vergrößern", zoomOutTitle: "Verkleinern" }).addTo(map);
L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    referrerPolicy: "strict-origin-when-cross-origin",
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
const isDesktop = () => window.matchMedia("(min-width: 1024px)").matches;
function toast(message) {
    toastElement.textContent = message;
    toastElement.classList.remove("hidden");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toastElement.classList.add("hidden"), 3500);
}
const systemDarkQuery = window.matchMedia("(prefers-color-scheme: dark)");
const colorModeLabel = {
    system: uiText.colorSystem,
    light: uiText.colorLight,
    dark: uiText.colorDark,
};
function savedThemeSetting() {
    try {
        const savedTheme = localStorage.getItem("nehlsen-theme");
        if (savedTheme === "light" || savedTheme === "dark" || savedTheme === "system")
            return savedTheme;
    }
    catch {
        // Private-browsing policies may disable local storage; follow the system setting.
    }
    return "system";
}
function resolveTheme(setting) {
    if (setting === "system")
        return systemDarkQuery.matches ? "dark" : "light";
    return setting;
}
function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    themeToggle.setAttribute("aria-pressed", String(theme === "dark"));
    const action = theme === "dark" ? "Hellmodus aktivieren" : "Dunkelmodus aktivieren";
    themeToggle.setAttribute("aria-label", action);
    themeToggle.title = action;
    const label = themeToggle.querySelector(".theme-label");
    if (label)
        label.textContent = theme === "dark" ? "Hell" : "Dunkel";
    themeColor.content = "#6ab023";
}
function setThemeSetting(setting, save = false) {
    themeSetting = setting;
    applyTheme(resolveTheme(setting));
    themeValue.textContent = colorModeLabel[setting];
    themeSystem.setAttribute("aria-pressed", String(setting === "system"));
    themeLight.setAttribute("aria-pressed", String(setting === "light"));
    themeDark.setAttribute("aria-pressed", String(setting === "dark"));
    if (save) {
        try {
            localStorage.setItem("nehlsen-theme", setting);
        }
        catch {
            toast("Die Designauswahl kann auf diesem Gerät nicht gespeichert werden.");
        }
    }
}
let themeSetting = savedThemeSetting();
setThemeSetting(themeSetting);
systemDarkQuery.addEventListener("change", () => {
    if (themeSetting === "system")
        applyTheme(resolveTheme("system"));
});
themeToggle.addEventListener("click", () => {
    setThemeSetting(document.documentElement.dataset.theme === "dark" ? "light" : "dark", true);
    closeMobileMenu();
});
themeMenuToggle.addEventListener("click", () => showSettingsPanel("theme"));
themeBack.addEventListener("click", () => showSettingsPanel("main"));
themeSystem.addEventListener("click", () => {
    setThemeSetting("system", true);
    closeAppearanceMenu();
    closeMobileMenu();
});
themeLight.addEventListener("click", () => {
    setThemeSetting("light", true);
    closeAppearanceMenu();
    closeMobileMenu();
});
themeDark.addEventListener("click", () => {
    setThemeSetting("dark", true);
    closeAppearanceMenu();
    closeMobileMenu();
});
function preferredDesign() {
    try {
        const savedDesign = localStorage.getItem("nehlsen-design");
        if (savedDesign === "normal" || savedDesign === "glass")
            return savedDesign;
    }
    catch {
        // Falls localStorage gesperrt ist, bleibt das normale Design aktiv.
    }
    return "normal";
}
function showSettingsPanel(panel) {
    settingsMain.classList.toggle("hidden", panel !== "main");
    designMenu.classList.toggle("hidden", panel !== "design");
    themeMenu.classList.toggle("hidden", panel !== "theme");
    designMenuToggle.setAttribute("aria-expanded", String(panel === "design"));
    themeMenuToggle.setAttribute("aria-expanded", String(panel === "theme"));
}
function closeAppearanceMenu() {
    appearanceMenu.classList.add("hidden");
    appearanceToggle.setAttribute("aria-expanded", "false");
    showSettingsPanel("main");
}
function setMobileMenu(open) {
    if (!open)
        closeAppearanceMenu();
    viewControls.classList.toggle("menu-open", open);
    mobileMenuToggle.setAttribute("aria-expanded", String(open));
    const action = open ? "Einstellungen schließen" : "Einstellungen öffnen";
    mobileMenuToggle.setAttribute("aria-label", action);
    mobileMenuToggle.title = action;
}
function closeMobileMenu() {
    setMobileMenu(false);
}
mobileMenuToggle.addEventListener("click", () => {
    setMobileMenu(mobileMenuToggle.getAttribute("aria-expanded") !== "true");
});
function applyDesign(design, save = false) {
    document.documentElement.dataset.design = design;
    designNormal.setAttribute("aria-pressed", String(design === "normal"));
    designGlass.setAttribute("aria-pressed", String(design === "glass"));
    designValue.textContent = design === "glass" ? "Liquid Glass" : "Normal";
    window.requestAnimationFrame(() => map.invalidateSize());
    if (save) {
        try {
            localStorage.setItem("nehlsen-design", design);
        }
        catch {
            toast("Die Designauswahl kann auf diesem Gerät nicht gespeichert werden.");
        }
    }
}
applyDesign(preferredDesign());
appearanceToggle.addEventListener("click", () => {
    const open = appearanceToggle.getAttribute("aria-expanded") !== "true";
    if (open)
        showSettingsPanel("main");
    appearanceMenu.classList.toggle("hidden", !open);
    appearanceToggle.setAttribute("aria-expanded", String(open));
});
designMenuToggle.addEventListener("click", () => showSettingsPanel("design"));
designBack.addEventListener("click", () => showSettingsPanel("main"));
designNormal.addEventListener("click", () => {
    applyDesign("normal", true);
    closeAppearanceMenu();
    closeMobileMenu();
});
designGlass.addEventListener("click", () => {
    applyDesign("glass", true);
    closeAppearanceMenu();
    closeMobileMenu();
});
let clearingData = false;
async function clearLocalDataAndReload() {
    clearingData = true;
    clearStorageButton.disabled = true;
    try {
        localStorage.clear();
    }
    catch {
        // Gesperrter Speicher: Zwischenspeicher trotzdem leeren und neu laden.
    }
    try {
        if ("serviceWorker" in navigator) {
            const registrations = await navigator.serviceWorker.getRegistrations();
            await Promise.all(registrations.map((registration) => registration.unregister()));
        }
        if ("caches" in window) {
            const keys = await caches.keys();
            await Promise.all(keys.map((key) => caches.delete(key)));
        }
        // Wie Strg+F5: Seite und alle eigenen Dateien mit cache "reload" frisch laden, damit auch der HTTP-Cache erneuert wird.
        const ownUrls = performance.getEntriesByType("resource")
            .map((entry) => entry.name)
            .filter((url) => new URL(url).origin === window.location.origin);
        await Promise.all([window.location.href, ...ownUrls].map((url) => fetch(url, { cache: "reload" }).catch(() => undefined)));
    }
    catch {
        // Ohne Zugriff auf Caches wird trotzdem neu geladen.
    }
    window.location.reload();
}
clearStorageButton.addEventListener("click", () => {
    void clearLocalDataAndReload();
});
listToggle.addEventListener("click", () => {
    const expanded = listToggle.getAttribute("aria-expanded") !== "false";
    const nextExpanded = !expanded;
    workspace.classList.toggle("list-collapsed", !nextExpanded);
    viewControls.classList.toggle("list-collapsed", !nextExpanded);
    listToggle.setAttribute("aria-expanded", String(nextExpanded));
    const action = nextExpanded ? "Standortliste ausblenden" : "Standortliste einblenden";
    listToggle.setAttribute("aria-label", action);
    listToggle.title = action;
    window.requestAnimationFrame(() => map.invalidateSize());
});
workspace.addEventListener("transitionend", (event) => {
    if (event.propertyName !== "grid-template-columns")
        return;
    window.requestAnimationFrame(() => map.invalidateSize());
});
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
async function copyAddress(address) {
    try {
        await navigator.clipboard.writeText(address);
        toast("Adresse kopiert.");
    }
    catch {
        toast("Adresse konnte nicht kopiert werden.");
    }
}
// Nicht-modales Detailfenster: Karte, Suche und andere Pins bleiben bedienbar.
// Ein Klick auf einen anderen Pin tauscht nur den Inhalt aus.
function openSheet(location, options = {}) {
    const destination = encodeURIComponent(location.address);
    const distance = origin ? `<div class="distance-note">ca. ${Math.round(distanceKm(origin, location))} km Luftlinie entfernt</div>` : "";
    byId("sBody").innerHTML = `<div class="co">${escapeHtml(location.company)}</div>
    <h2 id="sTitle">${escapeHtml(location.name)}</h2>${distance}
    <div class="row"><span aria-hidden="true"><svg class="row-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg></span>    <span class="address-text">${escapeHtml(location.address)}</span><button class="copy-address" type="button" aria-label="Adresse kopieren" title="Adresse kopieren"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg></button></div>    <div class="row"><span aria-hidden="true"><svg class="row-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.4 19.4 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7l.4 2.8a2 2 0 0 1-.6 1.7L7.5 9.6a16 16 0 0 0 6.9 6.9l1.4-1.4a2 2 0 0 1 1.7-.6l2.8.4a2 2 0 0 1 1.7 2Z"/></svg></span><a href="tel:${location.phone.replace(/[^\d+]/g, "")}">${escapeHtml(location.phone)}</a></div>
    <div class="row"><span aria-hidden="true"><svg class="row-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg></span><a href="mailto:${escapeHtml(location.email)}">${escapeHtml(location.email)}</a></div>
    <div class="row"><span aria-hidden="true"><svg class="row-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg></span><span class="hours">${escapeHtml(location.hours)}</span></div>
    <div class="actions">
      <a class="btn primary" target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?api=1&amp;destination=${destination}">Route starten</a>
      <a class="btn secondary" target="_blank" rel="noopener" href="https://maps.apple.com/?daddr=${destination}" aria-label="Route in Apple Karten">Apple Karten</a>
    </div>`;
    const detailBody = byId("sBody");
    detailBody.querySelector(".copy-address")?.addEventListener("click", () => {
        void copyAddress(location.address);
    });
    if (!location.phone) {
        detailBody.querySelector('a[href^="tel:"]')?.closest(".row")?.remove();
    }
    if (!location.hours) {
        detailBody.querySelector(".hours")?.closest(".row")?.remove();
    }
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
let dragStartY = null;
let dragStartTime = 0;
let didMoveGrab = false;
let suppressPointerClickUntil = 0;
function resetSheetDrag() {
    dragStartY = null;
    sheet.classList.remove("is-dragging");
    sheet.style.removeProperty("--sheet-drag-offset");
}
sheetGrab.addEventListener("pointerdown", (event) => {
    if (!event.isPrimary || (event.pointerType === "mouse" && event.button !== 0))
        return;
    dragStartY = event.clientY;
    dragStartTime = performance.now();
    didMoveGrab = false;
    sheetGrab.setPointerCapture(event.pointerId);
});
sheetGrab.addEventListener("pointermove", (event) => {
    if (dragStartY === null)
        return;
    const distance = event.clientY - dragStartY;
    if (Math.abs(distance) > 8)
        didMoveGrab = true;
    sheet.classList.add("is-dragging");
    sheet.style.setProperty("--sheet-drag-offset", `${Math.max(0, distance)}px`);
});
sheetGrab.addEventListener("pointerup", (event) => {
    if (dragStartY === null)
        return;
    const distance = event.clientY - dragStartY;
    const elapsed = Math.max(1, performance.now() - dragStartTime);
    const speed = distance / elapsed;
    const shouldClose = distance >= 80 || (distance >= 28 && speed >= 0.55);
    const moved = didMoveGrab;
    if (sheetGrab.hasPointerCapture(event.pointerId)) {
        sheetGrab.releasePointerCapture(event.pointerId);
    }
    resetSheetDrag();
    if (moved)
        suppressPointerClickUntil = performance.now() + 400;
    if (shouldClose)
        closeSheet();
});
sheetGrab.addEventListener("pointercancel", () => {
    resetSheetDrag();
    didMoveGrab = false;
});
sheetGrab.addEventListener("click", (event) => {
    if (event.detail > 0 && performance.now() < suppressPointerClickUntil) {
        event.preventDefault();
        suppressPointerClickUntil = 0;
        return;
    }
    closeSheet();
});
function showTab(tab) {
    const showMap = tab === "map";
    closeMobileMenu();
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
        openIt();
        markerCluster.zoomToShowLayer(marker, () => keepMarkerVisible(location));
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
workspace.addEventListener("click", closeMobileMenu);
// Klick auf eine freie Stelle der Karte schließt das Fenster; Ziehen/Zoomen nicht.
map.on("click", closeSheet);
document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape")
        return;
    if (!appearanceMenu.classList.contains("hidden")) {
        event.preventDefault();
        closeAppearanceMenu();
        appearanceToggle.focus({ preventScroll: true });
    }
    else if (viewControls.classList.contains("menu-open")) {
        event.preventDefault();
        closeMobileMenu();
        mobileMenuToggle.focus({ preventScroll: true });
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
    if (navigator.serviceWorker.controller) {
        let reloading = false;
        navigator.serviceWorker.addEventListener("controllerchange", () => {
            if (reloading || clearingData)
                return;
            reloading = true;
            window.location.reload();
        });
    }
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("./sw.js").catch(() => toast("Offline-Speicherung konnte nicht aktiviert werden."));
    });
}
showTab("map");
void loadLocations();
