export interface Location {
  id: string;
  company: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  hours: string;
  lat: number;
  lng: number;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export function distanceKm(a: Coordinates, b: Coordinates): number {
  const radians = (value: number): number => (value * Math.PI) / 180;
  const latitudeDelta = radians(b.lat - a.lat);
  const longitudeDelta = radians(b.lng - a.lng);
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(radians(a.lat)) *
      Math.cos(radians(b.lat)) *
      Math.sin(longitudeDelta / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(haversine));
}

export function filterLocations(
  locations: Location[],
  query: string,
  origin?: Coordinates,
): Location[] {
  const normalizedQuery = query.trim().toLocaleLowerCase("de-DE");
  const matches = locations.filter((location) => {
    const searchable = `${location.company} ${location.name} ${location.address}`;
    return !normalizedQuery || searchable.toLocaleLowerCase("de-DE").includes(normalizedQuery);
  });
  if (!origin) return matches;
  return matches
    .map((location) => ({ location, distance: distanceKm(origin, location) }))
    .sort((a, b) => a.distance - b.distance)
    .map(({ location }) => location);
}

export function validateLocations(locations: Location[]): void {
  const ids = new Set<string>();
  for (const location of locations) {
    if (!location.id || ids.has(location.id)) {
      throw new Error(`Duplicate or empty location id: ${location.id}`);
    }
    ids.add(location.id);
    if (
      !Number.isFinite(location.lat) ||
      !Number.isFinite(location.lng) ||
      location.lat < -90 ||
      location.lat > 90 ||
      location.lng < -180 ||
      location.lng > 180
    ) {
      throw new Error(`Invalid coordinates for ${location.id}`);
    }
  }
}

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character] ?? character;
  });
}
