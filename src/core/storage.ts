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
    toast("Die Designauswahl kann auf diesem Gerät nicht gespeichert werden.");
  }
}

export function clearSettings(): void {
  try {
    localStorage.clear();
  } catch {
    // Gesperrter Speicher: Zwischenspeicher trotzdem leeren und neu laden.
  }
}
