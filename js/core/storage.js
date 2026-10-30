import { t } from "../i18n/strings.js";
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
        toast(t("settingsSaveFailed"));
    }
}
export function readStringSet(key) {
    try {
        const value = localStorage.getItem(key);
        if (!value)
            return new Set();
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) && parsed.every((item) => typeof item === "string")
            ? new Set(parsed)
            : new Set();
    }
    catch {
        return new Set();
    }
}
export function saveStringSet(key, values) {
    try {
        localStorage.setItem(key, JSON.stringify([...values]));
    }
    catch {
        toast(t("favoritesSaveFailed"));
    }
}
export function clearSettings(keepKeys = []) {
    try {
        const kept = keepKeys.flatMap((key) => {
            const value = localStorage.getItem(key);
            return value === null ? [] : [[key, value]];
        });
        localStorage.clear();
        for (const [key, value] of kept)
            localStorage.setItem(key, value);
    }
    catch {
        // Gesperrter Speicher: Zwischenspeicher trotzdem leeren und neu laden.
    }
}
