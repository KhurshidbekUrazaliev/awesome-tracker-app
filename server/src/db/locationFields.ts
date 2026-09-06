/**
 * Shared location shape reused by usersRepo.ts and listingsRepo.ts — both
 * `users` and `listings` carry an identical set of location columns (see
 * schema.ts). Raw coordinates are only ever included for the resource's own
 * owner; every other viewer gets just the human-readable summary, never
 * lat/lng, plus a computed distanceKm where applicable (see the callers).
 */
export interface LocationSummary {
  city?: string;
  region?: string;
  country?: string;
  countryCode?: string;
  lat?: number;
  lng?: number;
}

interface LocationColumns {
  locationLat: number | null;
  locationLng: number | null;
  locationCity: string | null;
  locationRegion: string | null;
  locationCountry: string | null;
  locationCountryCode: string | null;
}

export function toLocationSummary(row: LocationColumns, includeCoords: boolean): LocationSummary | undefined {
  const hasAny =
    row.locationLat != null ||
    row.locationCity != null ||
    row.locationRegion != null ||
    row.locationCountry != null ||
    row.locationCountryCode != null;
  if (!hasAny) return undefined;

  return {
    city: row.locationCity ?? undefined,
    region: row.locationRegion ?? undefined,
    country: row.locationCountry ?? undefined,
    countryCode: row.locationCountryCode ?? undefined,
    ...(includeCoords && row.locationLat != null && row.locationLng != null
      ? { lat: row.locationLat, lng: row.locationLng }
      : {}),
  };
}

export interface LocationInput {
  locationLat?: number;
  locationLng?: number;
  locationCity?: string;
  locationRegion?: string;
  locationCountry?: string;
  locationCountryCode?: string;
}
