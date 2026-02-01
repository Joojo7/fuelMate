import { mapValue, parseOsmHours } from "./helpers";
import { BrandNormalizer, NormalizedStation } from "./types";

// ─── Raw type (OSM-sourced, pre-processed by scraper) ──

interface AmpolRaw {
  osm_id: number;
  osm_type: string;
  name: string;
  brand: string;
  operator: string;
  is_legacy_caltex: boolean;
  latitude: number;
  longitude: number;
  address: string;
  suburb: string;
  state: string;
  postcode: string;
  country: string;
  phone: string;
  website: string;
  opening_hours: string;
  fuel_types: string[];
  amenities: string[];
  _raw_tags: Record<string, string>;
}

// ─── Australian state lookup by lat/lng ─────────────

const AU_STATES: { name: string; latMin: number; latMax: number; lngMin: number; lngMax: number }[] = [
  { name: "WA",  latMin: -35.5, latMax: -13.5, lngMin: 112.0, lngMax: 129.0 },
  { name: "NT",  latMin: -26.5, latMax: -10.5, lngMin: 129.0, lngMax: 138.0 },
  { name: "SA",  latMin: -38.5, latMax: -26.0, lngMin: 129.0, lngMax: 141.0 },
  { name: "QLD", latMin: -29.5, latMax: -10.0, lngMin: 138.0, lngMax: 154.0 },
  { name: "NSW", latMin: -37.5, latMax: -28.0, lngMin: 141.0, lngMax: 154.0 },
  { name: "ACT", latMin: -35.95, latMax: -35.1, lngMin: 148.7, lngMax: 149.4 },
  { name: "VIC", latMin: -39.5, latMax: -34.0, lngMin: 141.0, lngMax: 150.5 },
  { name: "TAS", latMin: -44.0, latMax: -39.5, lngMin: 143.5, lngMax: 149.0 },
];

function getAuState(lat: number, lng: number): string {
  // ACT first (smaller, inside NSW)
  const act = AU_STATES.find((s) => s.name === "ACT")!;
  if (lat >= act.latMin && lat <= act.latMax && lng >= act.lngMin && lng <= act.lngMax) return "ACT";
  for (const s of AU_STATES) {
    if (s.name === "ACT") continue;
    if (lat >= s.latMin && lat <= s.latMax && lng >= s.lngMin && lng <= s.lngMax) return s.name;
  }
  return "";
}

// ─── Fuel mapping ────────────────────────────────────

const FUEL_MAP: Record<string, string> = {
  "Unleaded 91": "Unleaded 91",
  "Premium 95": "Unleaded 95",
  "Premium 98": "Unleaded 98",
  "E10": "E10",
  "E85": "E85",
  "Diesel": "Diesel",
  "Truck Diesel": "High Flow Diesel",
  "LPG": "LPG / Autogas",
  "AdBlue": "AdBlue",
  "CNG": "CNG",
};

// ─── Amenity mapping ─────────────────────────────────

const AMENITY_MAP: Record<string, string> = {
  "Air": "Air/Water",
  "Shop": "Convenience Store",
  "Toilets": "Toilets",
  "ATM": "ATM",
  "Car Wash": "Car Wash",
  "Food": "Fast Food",
  "EV Charging": "EV Charging",
};

// ─── Normalizer ──────────────────────────────────────

function normalizeAmpol(raw: AmpolRaw): NormalizedStation | null {
  if (!raw.latitude || !raw.longitude) return null;

  const fuels = Array.from(new Set(
    (raw.fuel_types || []).map((f) => mapValue(f, FUEL_MAP, "fuels"))
  ));

  const amenities = Array.from(new Set(
    (raw.amenities || []).map((a) => mapValue(a, AMENITY_MAP, "amenities"))
  ));

  const { open24Hours, hours } = parseOsmHours(raw.opening_hours);

  const state = raw.state || getAuState(raw.latitude, raw.longitude);

  return {
    id: `ampol-osm-${raw.osm_id}`,
    name: raw.name || "Ampol",
    brand: "ampol",
    country_code: "AU",
    lat: raw.latitude,
    lng: raw.longitude,
    address: raw.address || "",
    city: (raw.suburb || "").trim(),
    state,
    postcode: raw.postcode || "",
    country: "Australia",
    telephone: raw.phone || "",
    fuels,
    amenities,
    payments: [],
    open24Hours,
    hours,
    websiteUrl: raw.website || undefined,
  };
}

// ─── Exported normalizer config ──────────────────────

export const ampolAustralia: BrandNormalizer = {
  brand: "ampol",
  label: "Ampol AU",
  rawFile: "ampol_osm_stations_australia_raw.json",
  outputBrand: "ampol",
  countryCode: "AU",
  normalize: normalizeAmpol,
};
