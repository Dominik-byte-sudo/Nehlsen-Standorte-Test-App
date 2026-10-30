import { byId } from "../core/dom.js";
import { clearSettings } from "../core/storage.js";
import { FAVORITES_STORAGE_KEY } from "../data/app-state.js";
import { showSettingsPanel } from "./settings-menu.js";
const clearStorageButton = byId("clearStorage");
const keepFavoritesButton = byId("clearKeepFavorites");
const clearAllButton = byId("clearAllData");
const clearCancelButton = byId("clearCancel");
let clearingData = false;
// Dieselben Namen wie in sw.js: nur eigene Caches werden gelöscht, nicht die anderer Apps auf derselben Domain.
const OWN_CACHE = /^(nehlsen-(app|tiles)-|(app|tiles)-v\d+$)/;
export function isClearingLocalData() {
    return clearingData;
}
async function clearLocalDataAndReload(keepFavorites) {
    clearingData = true;
    keepFavoritesButton.disabled = true;
    clearAllButton.disabled = true;
    clearSettings(keepFavorites ? [FAVORITES_STORAGE_KEY] : []);
    try {
        if ("serviceWorker" in navigator) {
            // Nur der Service Worker in diesem Scope, nicht die anderer Apps auf derselben Domain.
            const registration = await navigator.serviceWorker.getRegistration();
            await registration?.unregister();
        }
        if ("caches" in window) {
            const keys = await caches.keys();
            await Promise.all(keys.filter((key) => OWN_CACHE.test(key)).map((key) => caches.delete(key)));
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
export function initClearData() {
    clearStorageButton.addEventListener("click", () => showSettingsPanel("clear", true));
    keepFavoritesButton.addEventListener("click", () => void clearLocalDataAndReload(true));
    clearAllButton.addEventListener("click", () => void clearLocalDataAndReload(false));
    clearCancelButton.addEventListener("click", () => showSettingsPanel("main", true));
}
