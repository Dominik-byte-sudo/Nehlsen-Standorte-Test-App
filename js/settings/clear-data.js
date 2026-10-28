import { byId } from "../core/dom.js";
import { clearSettings } from "../core/storage.js";
const clearStorageButton = byId("clearStorage");
let clearingData = false;
export function isClearingLocalData() {
    return clearingData;
}
async function clearLocalDataAndReload() {
    clearingData = true;
    clearStorageButton.disabled = true;
    clearSettings();
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
export function initClearData() {
    clearStorageButton.addEventListener("click", () => {
        void clearLocalDataAndReload();
    });
}
