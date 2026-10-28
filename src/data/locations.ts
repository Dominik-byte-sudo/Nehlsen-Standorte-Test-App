import { toast } from "../core/toast.js";
import { validateLocations, type Location } from "../domain.js";
import { countElement, renderLocations } from "../list/location-list.js";
import { createLocationMarker, locationMarkers } from "../map/markers.js";
import { appState } from "./app-state.js";

export async function loadLocations(): Promise<void> {
  try {
    const response = await fetch("./standorte.json", { cache: "no-cache" });
    if (!response.ok) throw new Error(`Standortdaten konnten nicht geladen werden (${response.status}).`);
    const records = await response.json() as Location[];
    validateLocations(records);
    appState.locations = records;
    for (const location of records) locationMarkers.set(location.id, createLocationMarker(location));
    renderLocations();
  } catch (error) {
    countElement.textContent = "Standortdaten nicht verfügbar";
    toast(error instanceof Error ? error.message : "Standortdaten konnten nicht geladen werden.");
  }
}
