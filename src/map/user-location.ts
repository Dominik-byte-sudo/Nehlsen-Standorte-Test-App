import { byId } from "../core/dom.js";
import { toast } from "../core/toast.js";
import { isDesktop } from "../core/viewport.js";
import { distanceKm } from "../domain.js";
import { appState, filteredLocations } from "../data/app-state.js";
import { renderLocations } from "../list/location-list.js";
import { showTab } from "../views/tabs.js";
import { map } from "./map-view.js";

declare const L: typeof import("leaflet");

const nearButton = byId<HTMLButtonElement>("nearBtn");
let userMarker: L.Marker | null = null;

export function initUserLocation(): void {
  nearButton.addEventListener("click", () => {
    if (!navigator.geolocation) {
      toast("Standortbestimmung wird nicht unterstützt.");
      return;
    }
    nearButton.disabled = true;
    navigator.geolocation.getCurrentPosition((position) => {
      nearButton.disabled = false;
      const origin = { lat: position.coords.latitude, lng: position.coords.longitude };
      appState.origin = origin;
      userMarker?.remove();
      userMarker = L.marker([origin.lat, origin.lng], {
        icon: L.divIcon({ className: "", html: '<div class="me"></div>', iconSize: [22, 22] }),
        interactive: false,
      }).addTo(map);
      renderLocations();
      const nearest = filteredLocations()[0];
      if (!nearest) return;
      map.fitBounds(L.latLngBounds([[origin.lat, origin.lng], [nearest.lat, nearest.lng]]), { padding: [50, 50] });
      toast(`Nächster Standort: ${nearest.company} ${nearest.name} (${Math.round(distanceKm(origin, nearest))} km)`);
      if (!isDesktop()) showTab("list");
    }, () => {
      nearButton.disabled = false;
      toast("Standort nicht verfügbar – bitte Freigabe erlauben.");
    }, { enableHighAccuracy: true, timeout: 10000 });
  });
}
