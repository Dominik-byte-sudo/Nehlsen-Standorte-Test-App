export function distanceKm(a, b) {
    const radians = (value) => (value * Math.PI) / 180;
    const latitudeDelta = radians(b.lat - a.lat);
    const longitudeDelta = radians(b.lng - a.lng);
    const haversine = Math.sin(latitudeDelta / 2) ** 2 +
        Math.cos(radians(a.lat)) *
            Math.cos(radians(b.lat)) *
            Math.sin(longitudeDelta / 2) ** 2;
    return 2 * 6371 * Math.asin(Math.sqrt(haversine));
}
export function filterLocations(locations, query, origin) {
    const normalizedQuery = query.trim().toLocaleLowerCase("de-DE");
    const matches = locations.filter((location) => {
        const searchable = `${location.company} ${location.name} ${location.address}`;
        return !normalizedQuery || searchable.toLocaleLowerCase("de-DE").includes(normalizedQuery);
    });
    if (!origin)
        return matches;
    return matches
        .map((location) => ({ location, distance: distanceKm(origin, location) }))
        .sort((a, b) => a.distance - b.distance)
        .map(({ location }) => location);
}
export function validateLocations(locations) {
    const ids = new Set();
    for (const location of locations) {
        if (!location.id || ids.has(location.id)) {
            throw new Error(`Duplicate or empty location id: ${location.id}`);
        }
        ids.add(location.id);
        if (!Number.isFinite(location.lat) ||
            !Number.isFinite(location.lng) ||
            location.lat < -90 ||
            location.lat > 90 ||
            location.lng < -180 ||
            location.lng > 180) {
            throw new Error(`Invalid coordinates for ${location.id}`);
        }
    }
}
export function escapeHtml(value) {
    return value.replace(/[&<>"']/g, (character) => {
        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;",
        };
        return entities[character] ?? character;
    });
}
