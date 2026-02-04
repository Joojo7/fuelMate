import type { CountryCode } from "./types";

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

// Map app country codes to Nominatim ISO 3166-1 alpha-2 codes
const COUNTRY_CODE_MAP: Record<CountryCode, string> = {
  AU: "au,nz",
  MY: "my",
  GH: "gh",
  CI: "ci",
  BF: "bf",
  TG: "tg",
};

export interface GeocodeSuggestion {
  label: string;
  lat: number;
  lng: number;
}

let lastRequestTime = 0;

export async function geocodeSearch(query: string, countryCode?: CountryCode): Promise<GeocodeSuggestion[]> {
  if (query.length < 3) return [];

  // Respect Nominatim 1 req/sec rate limit
  const now = Date.now();
  const wait = Math.max(0, 1000 - (now - lastRequestTime));
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastRequestTime = Date.now();

  const params = new URLSearchParams({
    q: query,
    format: "jsonv2",
    limit: "5",
    addressdetails: "0",
  });

  if (countryCode) {
    params.set("countrycodes", COUNTRY_CODE_MAP[countryCode]);
  }

  const res = await fetch(`${NOMINATIM_URL}?${params}`, {
    headers: { "User-Agent": "Pitstop-FuelFinder/1.0" },
  });

  if (!res.ok) return [];

  const data: { display_name: string; lat: string; lon: string }[] = await res.json();

  return data.map((item) => ({
    label: item.display_name,
    lat: parseFloat(item.lat),
    lng: parseFloat(item.lon),
  }));
}
