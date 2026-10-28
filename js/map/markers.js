import { openSheet } from "../detail/sheet.js";
export const locationMarkers = new Map();
const markerIcon = L.divIcon({
    className: "",
    html: '<div class="pin"></div>',
    iconSize: [26, 26],
    iconAnchor: [13, 26],
});
export function createLocationMarker(location) {
    return L.marker([location.lat, location.lng], {
        icon: markerIcon,
        title: `${location.company} – ${location.name}`,
        keyboard: true,
        bubblingMouseEvents: false,
    }).on("click", (event) => {
        // Nur bei Tastaturbedienung den Fokus ins Detailfenster setzen.
        const viaKeyboard = event.originalEvent instanceof KeyboardEvent;
        openSheet(location, { moveFocus: viaKeyboard, panToMarker: true });
    });
}
