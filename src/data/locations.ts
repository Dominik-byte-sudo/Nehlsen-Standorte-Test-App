import { toast } from "../core/toast.js";
import { validateLocations, type Location } from "../domain.js";
import { countElement, renderLocations } from "../list/location-list.js";
import { t } from "../i18n/strings.js";
import { createLocationMarker, locationMarkers } from "../map/markers.js";
import { appState } from "./app-state.js";

export async function loadLocations(): Promise<void> {
  countElement.textContent = t("loading");
  try {
    const response = await fetch("./standorte.json", { cache: "no-cache" });
    if (!response.ok) throw new Error(t("dataLoadFailed", { status: response.status }));
    const records = await response.json() as Location[];
    validateLocations(records);
    appState.locations = records;
    for (const location of records) locationMarkers.set(location.id, createLocationMarker(location));
    renderLocations();
  } catch (error) {
    countElement.textContent = t("countUnavailable");
    toast(error instanceof Error ? error.message : t("dataLoadFailedGeneric"));
  }
}
