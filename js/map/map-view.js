import { byId } from "../core/dom.js";
import { onLanguageChange, t } from "../i18n/strings.js";
export const mapElement = byId("map");
export const map = L.map(mapElement, { zoomControl: false }).setView([52.9, 10.5], 6);
L.control.zoom({ position: "bottomright", zoomInTitle: t("mapZoomIn"), zoomOutTitle: t("mapZoomOut") }).addTo(map);
onLanguageChange(() => {
    document.querySelector(".leaflet-control-zoom-in")?.setAttribute("title", t("mapZoomIn"));
    document.querySelector(".leaflet-control-zoom-out")?.setAttribute("title", t("mapZoomOut"));
});
L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    referrerPolicy: "strict-origin-when-cross-origin",
    attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
}).addTo(map);
export const markerCluster = L.markerClusterGroup({ showCoverageOnHover: false, maxClusterRadius: 45 });
map.addLayer(markerCluster);
