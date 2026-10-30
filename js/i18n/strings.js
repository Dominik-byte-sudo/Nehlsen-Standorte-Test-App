export const LANGUAGE_STORAGE_KEY = "nehlsen-language";
export const LANGUAGE_SETTINGS = ["auto", "de", "en"];
// Platzhalter in {geschweiften Klammern} werden von t() ersetzt.
const de = {
    documentTitle: "Nehlsen Standorte",
    brandTitle: "Standorte",
    loading: "Standorte werden geladen …",
    searchPlaceholder: "Ort, PLZ oder Gesellschaft …",
    searchLabel: "Standorte durchsuchen",
    scopeFilterLabel: "Standorte filtern",
    scopeFilterValue: "Standorte filtern: {value}",
    scopeAll: "Alle Standorte",
    scopeAllShort: "Alle",
    scopeFavorites: "Favoriten",
    nearLabel: "In der Nähe",
    nearAria: "Standorte in meiner Nähe",
    tabsLabel: "Ansicht auswählen",
    tabMap: "Karte",
    tabList: "Liste",
    mapRegion: "Karte mit Nehlsen-Standorten",
    listRegion: "Nehlsen-Standorte",
    listToggleHide: "Standortliste ausblenden",
    listToggleShow: "Standortliste einblenden",
    settingsOpen: "Einstellungen öffnen",
    settingsClose: "Einstellungen schließen",
    settingsTitle: "Einstellungen",
    appearanceLabel: "Darstellung",
    themeActivateDark: "Dunkelmodus aktivieren",
    themeActivateLight: "Hellmodus aktivieren",
    themeSwitchDark: "Dunkelmodus",
    colorMode: "Farbmodus",
    colorSystem: "System",
    colorLight: "Hell",
    colorDark: "Dunkel",
    designStyle: "Designstil",
    designNormal: "Normal",
    designGlass: "Liquid Glass",
    language: "Sprache",
    languageAuto: "Automatisch",
    languageNameDe: "Deutsch",
    languageNameEn: "English",
    back: "Zurück",
    clearStorage: "Lokalen Speicher leeren",
    clearStorageTitle: "Gespeicherte Einstellungen und Zwischenspeicher löschen und neu laden",
    grabLabel: "Standortdetails schließen",
    grabTitle: "Antippen oder nach unten ziehen zum Schließen",
    close: "Schließen",
    routeGoogle: "Route starten",
    routeApple: "Apple Karten",
    routeAppleAria: "Route in Apple Karten",
    copyAddress: "Adresse kopieren",
    addressCopied: "Adresse kopiert.",
    addressCopyFailed: "Adresse konnte nicht kopiert werden.",
    distanceNote: "ca. {km} km Luftlinie entfernt",
    favoriteAdd: "Zu Favoriten hinzufügen",
    favoriteRemove: "Aus Favoriten entfernen",
    favoritesSaveFailed: "Favoriten können auf diesem Gerät nicht gespeichert werden.",
    settingsSaveFailed: "Einstellungen können auf diesem Gerät nicht gespeichert werden.",
    countOf: "{shown} von {total} Standorten",
    countUnavailable: "Standortdaten nicht verfügbar",
    noResults: "Kein Standort gefunden für „{query}“.",
    noFavorites: "Keine Favoriten gefunden.",
    kmUnit: "km",
    geoUnsupported: "Standortbestimmung wird nicht unterstützt.",
    geoUnavailable: "Standort nicht verfügbar – bitte Freigabe erlauben.",
    nearestLocation: "Nächster Standort: {name} ({km} km)",
    offlineFailed: "Offline-Speicherung konnte nicht aktiviert werden.",
    dataLoadFailed: "Standortdaten konnten nicht geladen werden ({status}).",
    dataLoadFailedGeneric: "Standortdaten konnten nicht geladen werden.",
    clearAskText: "Sollen auch die Favoriten gelöscht werden?",
    clearKeepFavorites: "Nur Einstellungen löschen",
    clearAllData: "Einstellungen und Favoriten löschen",
    cancel: "Abbrechen",
    mapZoomIn: "Vergrößern",
    mapZoomOut: "Verkleinern",
    toolTitle: "Koordinaten-Werkzeug · Nehlsen Standorte",
    toolHeading: "Koordinaten-Werkzeug",
    toolIntro: "Standorte werden direkt aus standorte.json geladen. Nominatim-Abfragen dauern etwa eine Minute. Orange/rote Treffer bitte prüfen; Pins können gezogen werden.",
    toolAsideLabel: "Koordinaten prüfen",
    toolRun: "Koordinaten ermitteln",
    toolDownload: "standorte.json herunterladen",
    toolProgressLoading: "Daten werden geladen …",
    toolListLabel: "Standortliste",
    toolMapLabel: "Karte zum Prüfen und Verschieben der Koordinaten",
    toolStateUntested: "ungeprüft – gespeicherte Koordinate",
    toolStateManual: "manuell gesetzt",
    toolStateFound: "gefunden (Hausnummer)",
    toolStateApprox: "nur Straße/Ort – bitte prüfen",
    toolStateMissing: "nicht gefunden – Pin manuell prüfen",
    toolStateError: "Fehler bei Abfrage",
    toolStateErrorDetail: "Fehler bei Abfrage: {message}",
    toolSearching: "Suche {index} / {total} …",
    toolLoaded: "{count} Standorte geladen.",
    toolDone: "Fertig. Orange/rote Einträge und verschobene Pins prüfen.",
    toolLoadError: "Standortdaten konnten nicht geladen werden: {message}",
    toolUnknownError: "Unbekannter Fehler",
};
const en = {
    documentTitle: "Nehlsen Locations",
    brandTitle: "Locations",
    loading: "Loading locations …",
    searchPlaceholder: "City, postal code or company …",
    searchLabel: "Search locations",
    scopeFilterLabel: "Filter locations",
    scopeFilterValue: "Filter locations: {value}",
    scopeAll: "All locations",
    scopeAllShort: "All",
    scopeFavorites: "Favorites",
    nearLabel: "Nearby",
    nearAria: "Locations near me",
    tabsLabel: "Choose view",
    tabMap: "Map",
    tabList: "List",
    mapRegion: "Map of Nehlsen locations",
    listRegion: "Nehlsen locations",
    listToggleHide: "Hide location list",
    listToggleShow: "Show location list",
    settingsOpen: "Open settings",
    settingsClose: "Close settings",
    settingsTitle: "Settings",
    appearanceLabel: "Appearance",
    themeActivateDark: "Switch to dark mode",
    themeActivateLight: "Switch to light mode",
    themeSwitchDark: "Dark mode",
    colorMode: "Color mode",
    colorSystem: "System",
    colorLight: "Light",
    colorDark: "Dark",
    designStyle: "Design style",
    designNormal: "Normal",
    designGlass: "Liquid Glass",
    language: "Language",
    languageAuto: "Automatic",
    languageNameDe: "Deutsch",
    languageNameEn: "English",
    back: "Back",
    clearStorage: "Clear local storage",
    clearStorageTitle: "Delete saved settings and cache, then reload",
    grabLabel: "Close location details",
    grabTitle: "Tap or drag down to close",
    close: "Close",
    routeGoogle: "Start route",
    routeApple: "Apple Maps",
    routeAppleAria: "Route in Apple Maps",
    copyAddress: "Copy address",
    addressCopied: "Address copied.",
    addressCopyFailed: "The address could not be copied.",
    distanceNote: "about {km} km away in a straight line",
    favoriteAdd: "Add to favorites",
    favoriteRemove: "Remove from favorites",
    favoritesSaveFailed: "Favorites cannot be saved on this device.",
    settingsSaveFailed: "Settings cannot be saved on this device.",
    countOf: "{shown} of {total} locations",
    countUnavailable: "Location data unavailable",
    noResults: "No location found for “{query}”.",
    noFavorites: "No favorites found.",
    kmUnit: "km",
    geoUnsupported: "Location services are not supported.",
    geoUnavailable: "Location unavailable – please allow access.",
    nearestLocation: "Nearest location: {name} ({km} km)",
    offlineFailed: "Offline storage could not be enabled.",
    dataLoadFailed: "Location data could not be loaded ({status}).",
    dataLoadFailedGeneric: "Location data could not be loaded.",
    clearAskText: "Should the favorites be deleted too?",
    clearKeepFavorites: "Delete settings only",
    clearAllData: "Delete settings and favorites",
    cancel: "Cancel",
    mapZoomIn: "Zoom in",
    mapZoomOut: "Zoom out",
    toolTitle: "Coordinate tool · Nehlsen Locations",
    toolHeading: "Coordinate tool",
    toolIntro: "Locations are loaded directly from standorte.json. Nominatim lookups take about a minute. Please check orange/red results; pins can be dragged.",
    toolAsideLabel: "Check coordinates",
    toolRun: "Find coordinates",
    toolDownload: "Download standorte.json",
    toolProgressLoading: "Loading data …",
    toolListLabel: "Location list",
    toolMapLabel: "Map for checking and moving coordinates",
    toolStateUntested: "not checked – saved coordinate",
    toolStateManual: "set manually",
    toolStateFound: "found (house number)",
    toolStateApprox: "street/town only – please check",
    toolStateMissing: "not found – check pin manually",
    toolStateError: "Lookup error",
    toolStateErrorDetail: "Lookup error: {message}",
    toolSearching: "Searching {index} / {total} …",
    toolLoaded: "{count} locations loaded.",
    toolDone: "Done. Please check orange/red entries and moved pins.",
    toolLoadError: "Location data could not be loaded: {message}",
    toolUnknownError: "Unknown error",
};
const messages = { de, en };
function detectSystemLanguage() {
    const systemLanguage = navigator.languages?.[0] ?? navigator.language ?? "";
    return systemLanguage.toLowerCase().startsWith("de") ? "de" : "en";
}
function readStoredSetting() {
    try {
        const value = localStorage.getItem(LANGUAGE_STORAGE_KEY);
        return LANGUAGE_SETTINGS.find((option) => option === value) ?? "auto";
    }
    catch {
        return "auto";
    }
}
function resolveLanguage(setting) {
    return setting === "auto" ? detectSystemLanguage() : setting;
}
let languageSetting = readStoredSetting();
let activeLanguage = resolveLanguage(languageSetting);
const languageListeners = new Set();
export function t(key, params = {}) {
    const template = messages[activeLanguage][key] ?? key;
    return template.replace(/\{(\w+)\}/g, (placeholder, name) => (name in params ? String(params[name]) : placeholder));
}
export function currentLanguage() {
    return activeLanguage;
}
export function currentLanguageSetting() {
    return languageSetting;
}
// Module mit dynamischen Texten registrieren sich hier, um ihre Anzeige nach einem Sprachwechsel zu aktualisieren.
export function onLanguageChange(listener) {
    languageListeners.add(listener);
}
export function applyStaticTranslations() {
    for (const element of document.querySelectorAll("[data-i18n], [data-i18n-title], [data-i18n-aria-label], [data-i18n-placeholder]")) {
        const { i18n, i18nTitle, i18nAriaLabel, i18nPlaceholder } = element.dataset;
        if (i18n)
            element.textContent = t(i18n);
        if (i18nTitle)
            element.title = t(i18nTitle);
        if (i18nAriaLabel)
            element.setAttribute("aria-label", t(i18nAriaLabel));
        if (i18nPlaceholder)
            element.setAttribute("placeholder", t(i18nPlaceholder));
    }
}
function applyLanguage() {
    document.documentElement.lang = activeLanguage;
    applyStaticTranslations();
    for (const listener of languageListeners)
        listener();
}
export function setLanguageSetting(setting, save = false) {
    languageSetting = setting;
    activeLanguage = resolveLanguage(setting);
    if (save) {
        try {
            localStorage.setItem(LANGUAGE_STORAGE_KEY, setting);
        }
        catch {
            // Gesperrter Speicher: Die Sprache gilt trotzdem für diese Sitzung.
        }
    }
    applyLanguage();
}
export function initLanguage() {
    applyLanguage();
    window.addEventListener("languagechange", () => {
        if (languageSetting !== "auto")
            return;
        activeLanguage = resolveLanguage("auto");
        applyLanguage();
    });
}
