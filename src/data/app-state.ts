import { filterLocations, type Coordinates, type Location } from "../domain.js";

export interface AppState {
  locations: Location[];
  origin: Coordinates | null;
  activeQuery: string;
}

export const appState: AppState = {
  locations: [],
  origin: null,
  activeQuery: "",
};

export function filteredLocations(): Location[] {
  return filterLocations(appState.locations, appState.activeQuery, appState.origin ?? undefined);
}
