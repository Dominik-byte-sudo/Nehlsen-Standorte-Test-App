import { filterLocations } from "../domain.js";
export const appState = {
    locations: [],
    origin: null,
    activeQuery: "",
};
export function filteredLocations() {
    return filterLocations(appState.locations, appState.activeQuery, appState.origin ?? undefined);
}
