import type { Location } from "../domain.js";
import { openSheet } from "../detail/sheet.js";

declare const L: typeof import("leaflet");

export const locationMarkers = new Map<string, L.Marker>();

const markerIcon = L.divIcon({
  className: "",
  html: '<div class="pin"></div>',
  iconSize: [26, 26],
  iconAnchor: [13, 26],
});

export function createLocationMarker(location: Location): L.Marker {
  return L.marker([location.lat, location.lng], {
    icon: markerIcon,
    title: `${location.company} – ${location.name}`,
    keyboard: true,
    bubblingMouseEvents: false,
  }).on("click", (event: L.LeafletMouseEvent) => {
    // Nur bei Tastaturbedienung den Fokus ins Detailfenster setzen.
    const viaKeyboard = event.originalEvent instanceof KeyboardEvent;
    openSheet(location, { moveFocus: viaKeyboard, panToMarker: true });
  });
}
