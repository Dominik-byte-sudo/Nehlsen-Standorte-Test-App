import { byId } from "../core/dom.js";
import { distanceKm, escapeHtml } from "../domain.js";
import { appState, filteredLocations, isFavorite } from "../data/app-state.js";
import { openSheet } from "../detail/sheet.js";
import { t, onLanguageChange } from "../i18n/strings.js";
import { keepMarkerVisible } from "../map/keep-marker-visible.js";
import { map, markerCluster } from "../map/map-view.js";
import { locationMarkers } from "../map/markers.js";
import { showTab } from "../views/tabs.js";

declare const L: typeof import("leaflet");

const LOCATION_ZOOM = 14;

export const listElement = byId<HTMLDivElement>("list");
export const countElement = byId<HTMLParagraphElement>("count");
const queryInput = byId<HTMLInputElement>("q");

export function renderLocations(): void {
  const results = filteredLocations();
  markerCluster.clearLayers();
  markerCluster.addLayers(results.flatMap((location) => {
    const marker = locationMarkers.get(location.id);
    return marker ? [marker] : [];
  }));
  const total = appState.favoritesOnly
    ? appState.locations.filter((location) => isFavorite(location.id)).length
    : appState.locations.length;
  countElement.textContent = t("countOf", { shown: results.length, total });

  if (!results.length) {
    const reason = appState.favoritesOnly
      ? t("noFavorites")
      : escapeHtml(t("noResults", { query: appState.activeQuery }));
    listElement.innerHTML = `<div class="empty">${reason}</div>`;
    return;
  }

  const { origin } = appState;
  listElement.innerHTML = results.map((location) => {
    const distance = origin ? distanceKm(origin, location) : null;
    const distanceBadge = distance === null ? "" : `<span class="dist">${distance < 10 ? distance.toFixed(1) : Math.round(distance)} ${t("kmUnit")}</span>`;
    return `<div class="item-wrap" role="listitem"><button class="item" type="button" data-id="${escapeHtml(location.id)}">
      ${distanceBadge}<b><span class="favorite-indicator" aria-hidden="true">${isFavorite(location.id) ? "★" : "☆"}</span>${escapeHtml(location.company)} · ${escapeHtml(location.name)}</b>
      <span>${escapeHtml(location.address)}</span></button></div>`;
  }).join("");

  if (appState.activeQuery) {
    const bounds = L.latLngBounds(results.map((location) => [location.lat, location.lng] as [number, number]));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
  }
}

export function initLocationList(): void {
  listElement.addEventListener("click", (event) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>(".item");
    if (!button) return;
    const location = appState.locations.find((candidate) => candidate.id === button.dataset.id);
    if (!location) return;
    showTab("map");
    const marker = locationMarkers.get(location.id);
    const openIt = (): void => openSheet(location, { moveFocus: event.detail === 0, panToMarker: true });
    // Cluster bei Bedarf aufklappen, damit der Pin sichtbar ist.
    if (marker && markerCluster.hasLayer(marker)) {
      map.setView([location.lat, location.lng], Math.max(map.getZoom(), LOCATION_ZOOM), { animate: false });
      openIt();
      markerCluster.zoomToShowLayer(marker, () => keepMarkerVisible(location));
    } else {
      map.setView([location.lat, location.lng], LOCATION_ZOOM);
      openIt();
    }
  });

  queryInput.addEventListener("input", () => {
    appState.activeQuery = queryInput.value;
    renderLocations();
  });
  window.addEventListener("favoriteschange", renderLocations);
  onLanguageChange(() => {
    if (appState.locations.length) renderLocations();
  });
}
