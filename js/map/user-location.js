import { byId } from "../core/dom.js";
import { toast } from "../core/toast.js";
import { isDesktop } from "../core/viewport.js";
import { distanceKm } from "../domain.js";
import { appState, filteredLocations } from "../data/app-state.js";
import { renderLocations } from "../list/location-list.js";
import { t } from "../i18n/strings.js";
import { showTab } from "../views/tabs.js";
import { map } from "./map-view.js";
const nearButton = byId("nearBtn");
let userMarker = null;
export function initUserLocation() {
    nearButton.addEventListener("click", () => {
        if (!navigator.geolocation) {
            toast(t("geoUnsupported"));
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
            if (!nearest)
                return;
            map.fitBounds(L.latLngBounds([[origin.lat, origin.lng], [nearest.lat, nearest.lng]]), { padding: [50, 50] });
            toast(t("nearestLocation", { name: `${nearest.company} ${nearest.name}`, km: Math.round(distanceKm(origin, nearest)) }));
            if (!isDesktop())
                showTab("list");
        }, () => {
            nearButton.disabled = false;
            toast(t("geoUnavailable"));
        }, { enableHighAccuracy: true, timeout: 10000 });
    });
}
