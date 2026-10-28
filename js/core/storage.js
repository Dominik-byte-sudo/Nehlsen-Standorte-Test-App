import { toast } from "./toast.js";
export function readSetting(key, allowed, fallback) {
    try {
        const value = localStorage.getItem(key);
        return allowed.find((option) => option === value) ?? fallback;
    }
    catch {
        // Private-browsing policies may disable local storage; the fallback applies.
        return fallback;
    }
}
export function saveSetting(key, value) {
    try {
        localStorage.setItem(key, value);
    }
    catch {
        toast("Die Designauswahl kann auf diesem Gerät nicht gespeichert werden.");
    }
}
export function clearSettings() {
    try {
        localStorage.clear();
    }
    catch {
        // Gesperrter Speicher: Zwischenspeicher trotzdem leeren und neu laden.
    }
}
