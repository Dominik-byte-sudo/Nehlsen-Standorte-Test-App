// Muss mit VERSION in sw.js übereinstimmen; tests/project.test.mjs prüft das.
export const APP_VERSION = "v50";

const APP_VERSION_STORAGE_KEY = "nehlsen-app-version";
const REFRESH_TIMEOUT_MS = 15000;

const versionNumber = (version: string): number => Number(version.replace(/^v/, ""));

function storedVersion(): string | null {
  try {
    return localStorage.getItem(APP_VERSION_STORAGE_KEY);
  } catch {
    return null;
  }
}

function rememberVersion(): boolean {
  try {
    localStorage.setItem(APP_VERSION_STORAGE_KEY, APP_VERSION);
    return localStorage.getItem(APP_VERSION_STORAGE_KEY) === APP_VERSION;
  } catch {
    // Gesperrter Speicher: Der Neustart ohne Vermerk würde sonst endlos neu laden.
    return false;
  }
}




// Lädt die App-Dateien im Service-Worker-Cache frisch vom Netz (wie Strg+F5).
// Ohne aktiven Service Worker holt der Browser ohnehin alles vom Netz.
async function refreshCachedFiles(): Promise<boolean> {
  const registration = await navigator.serviceWorker?.getRegistration();
  const worker = registration?.active;
  if (!worker) return true;
  return new Promise((resolve) => {
    const channel = new MessageChannel();
    const timer = window.setTimeout(() => resolve(false), REFRESH_TIMEOUT_MS);
    channel.port1.onmessage = (event: MessageEvent<boolean>) => {
      window.clearTimeout(timer);
      resolve(event.data === true);
    };
    worker.postMessage({ type: "refresh-app-files" }, [channel.port2]);
  });
}

// Ist die gespeicherte Version älter als die laufende, werden die Dateien einmal neu geladen.
// Die neue Version wird erst nach Erfolg vermerkt, damit ein Fehler beim nächsten Start erneut versucht wird.
export async function refreshFilesAfterUpdate(): Promise<void> {
  const stored = storedVersion();
  if (stored === null) {
    rememberVersion();
    return;
  }
  if (!(versionNumber(APP_VERSION) > versionNumber(stored))) return;
  if (!navigator.onLine) return;
  if (!(await refreshCachedFiles())) return;
  if (!rememberVersion()) return;0
  window.location.reload();
}
