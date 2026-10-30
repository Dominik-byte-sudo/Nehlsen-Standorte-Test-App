import { filterLocations, type Coordinates, type Location } from "../domain.js";
import { readStringSet, saveStringSet } from "../core/storage.js";

export const FAVORITES_STORAGE_KEY = "nehlsen-favorites";
export interface AppState {
  locations: Location[];
  origin: Coordinates | null;
  activeQuery: string;
  favoritesOnly: boolean;
  favoriteIds: Set<string>;
}

export const appState: AppState = {
  locations: [],
  origin: null,
  activeQuery: "",
  favoritesOnly: false,
  favoriteIds: readStringSet(FAVORITES_STORAGE_KEY),
};

export function filteredLocations(): Location[] {
  const locations = appState.favoritesOnly
    ? appState.locations.filter((location) => appState.favoriteIds.has(location.id))
    : appState.locations;
  return filterLocations(locations, appState.activeQuery, appState.origin ?? undefined);
}

export function isFavorite(locationId: string): boolean {
  return appState.favoriteIds.has(locationId);
}

export function toggleFavorite(locationId: string): boolean {
  if (appState.favoriteIds.has(locationId)) {
    appState.favoriteIds.delete(locationId);
  } else {
    appState.favoriteIds.add(locationId);
  }
  saveStringSet(FAVORITES_STORAGE_KEY, appState.favoriteIds);
  return appState.favoriteIds.has(locationId);
}
