import { t } from "../i18n/strings.js";
import { toast } from "./toast.js";

export function readSetting<T extends string>(key: string, allowed: readonly T[], fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    return allowed.find((option) => option === value) ?? fallback;
  } catch {
    // Private-browsing policies may disable local storage; the fallback applies.
    return fallback;
  }
}

export function saveSetting(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    toast(t("settingsSaveFailed"));
  }
}

export function readStringSet(key: string): Set<string> {
  try {
    const value = localStorage.getItem(key);
    if (!value) return new Set();
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) && parsed.every((item) => typeof item === "string")
      ? new Set(parsed)
      : new Set();
  } catch {
    return new Set();
  }
}

export function saveStringSet(key: string, values: Set<string>): void {
  try {
    localStorage.setItem(key, JSON.stringify([...values]));
  } catch {
    toast(t("favoritesSaveFailed"));
  }
}

export function clearSettings(): void {
  try {
    localStorage.clear();
  } catch {
    // Gesperrter Speicher: Zwischenspeicher trotzdem leeren und neu laden.
  }
}
