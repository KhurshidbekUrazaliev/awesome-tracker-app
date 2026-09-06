import apiClient from './apiClient';

/** A resolved geocoding result — always has coordinates. Returned by our own reverse/search geo endpoints. */
export interface GeoPlace {
  lat: number;
  lng: number;
  city?: string;
  region?: string;
  country?: string;
  countryCode?: string;
}

/**
 * How a user's/listing's location appears on `User`/`Listing` API responses.
 * Coordinates are only present when the viewer is the resource's own owner
 * (see the server's toPublicUser/toPublicListing) — for anyone else, only the
 * human-readable summary comes through, alongside a separate `distanceKm`.
 */
export interface LocationSummary {
  lat?: number;
  lng?: number;
  city?: string;
  region?: string;
  country?: string;
  countryCode?: string;
}

class GeoService {
  async reverseGeocode(lat: number, lng: number): Promise<GeoPlace> {
    const response = await apiClient.get<GeoPlace>('/geo/reverse', { params: { lat, lng } });
    return response.data;
  }

  async searchPlaces(q: string): Promise<GeoPlace[]> {
    const response = await apiClient.get<GeoPlace[]>('/geo/search', { params: { q } });
    return response.data;
  }
}

export default new GeoService();
