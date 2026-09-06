import { logger } from '../logger';

/** Great-circle distance between two points, in kilometers. Accurate enough for an in-person-pickup use case. */
export function haversineDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Max distance allowed between the two parties of a physical-handoff transaction. Defaults to 75km. */
export function getMaxTransactionDistanceKm(): number {
  const raw = process.env.MAX_TRANSACTION_DISTANCE_KM;
  const parsed = raw ? Number(raw) : 75;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 75;
}

function getNominatimUserAgent(): string {
  return process.env.NOMINATIM_USER_AGENT || 'TrY-App/1.0 (contact via GitHub repo)';
}

export interface GeoPlace {
  lat: number;
  lng: number;
  city?: string;
  region?: string;
  country?: string;
  countryCode?: string;
}

// Nominatim's usage policy caps absolute usage at ~1 request/second, server-wide
// -- not per client. The inbound express-rate-limit in index.ts only limits how
// often one client can hit *our* API; it does nothing to cap our own outbound
// calls to Nominatim, so this throttle is a separate, deliberate mechanism.
// Violating Nominatim's policy risks an IP ban of the whole Render instance.
let lastNominatimCallAt = 0;
async function throttle(): Promise<void> {
  const minIntervalMs = 1000;
  const elapsed = Date.now() - lastNominatimCallAt;
  if (elapsed < minIntervalMs) {
    await new Promise((resolve) => setTimeout(resolve, minIntervalMs - elapsed));
  }
  lastNominatimCallAt = Date.now();
}

// Cache-forever (until redeploy) -- a listing's location rarely changes, and this
// keeps repeated lookups of the same point/text from ever hitting Nominatim twice.
// Only the derived summary is cached, never Nominatim's full raw response.
const reverseCache = new Map<string, GeoPlace | null>();
const searchCache = new Map<string, GeoPlace[]>();

function toPlace(raw: any): GeoPlace | null {
  const lat = Number(raw?.lat);
  const lng = Number(raw?.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  const address = raw.address ?? {};
  return {
    lat,
    lng,
    city: address.city || address.town || address.village || address.county || undefined,
    region: address.state || undefined,
    country: address.country || undefined,
    countryCode: address.country_code ? String(address.country_code).toUpperCase() : undefined,
  };
}

async function callNominatim(path: string, params: Record<string, string>): Promise<any> {
  await throttle();
  const url = new URL(`https://nominatim.openstreetmap.org${path}`);
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('addressdetails', '1');
  // Without this, Nominatim returns place names in the local language (e.g.
  // Korean script for a Seoul result) rather than the app's English-only UI.
  url.searchParams.set('accept-language', 'en');
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);

  const response = await fetch(url.toString(), {
    headers: { 'User-Agent': getNominatimUserAgent(), Accept: 'application/json' },
  });
  if (!response.ok) throw new Error(`Nominatim request failed with status ${response.status}`);
  return response.json();
}

/**
 * Coordinates -> place name. Best-effort: returns null on any failure rather
 * than throwing, since geocoding is enrichment, never a hard dependency --
 * the raw lat/lng the caller already has is what actually matters.
 */
export async function reverseGeocode(lat: number, lng: number): Promise<GeoPlace | null> {
  const cacheKey = `${lat.toFixed(3)},${lng.toFixed(3)}`;
  if (reverseCache.has(cacheKey)) return reverseCache.get(cacheKey)!;

  try {
    const raw = await callNominatim('/reverse', { lat: String(lat), lon: String(lng) });
    const place = toPlace(raw) ?? { lat, lng };
    reverseCache.set(cacheKey, place);
    return place;
  } catch (err) {
    logger.warn({ err }, 'Reverse geocoding failed');
    reverseCache.set(cacheKey, null);
    return null;
  }
}

/** Place name/text -> up to 5 candidate coordinates, for the manual "type a city" fallback. */
export async function searchPlaces(query: string): Promise<GeoPlace[]> {
  const cacheKey = query.trim().toLowerCase();
  if (searchCache.has(cacheKey)) return searchCache.get(cacheKey)!;

  try {
    const raw = await callNominatim('/search', { q: query, limit: '5' });
    const places = Array.isArray(raw) ? raw.map(toPlace).filter((p): p is GeoPlace => p != null) : [];
    searchCache.set(cacheKey, places);
    return places;
  } catch (err) {
    logger.warn({ err }, 'Place search failed');
    return [];
  }
}
