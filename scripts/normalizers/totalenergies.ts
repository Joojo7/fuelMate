import { mapValue, parseOsmHours } from "./helpers";
import { BrandNormalizer, NormalizedStation } from "./types";

// ─── Raw type (OSM-sourced) ──────────────────────────

interface TotalRaw {
  id: string;
  name: string;
  brand: string;
  lat: number;
  lon: number;
  address: string;
  city: string;
  region: string;
  postcode: string;
  phone: string;
  website: string;
  opening_hours: string;
  fuel_types: string[];
  amenities: string[];
}

// ─── Fuel mapping ────────────────────────────────────

const FUEL_MAP: Record<string, string> = {
  Petrol: "Unleaded 95",
  "Petrol 91/92": "Unleaded 91",
  "Super 95": "Unleaded 98",
  Diesel: "Diesel",
  LPG: "LPG / Autogas",
};

// ─── Amenity mapping ─────────────────────────────────

const AMENITY_MAP: Record<string, string> = {
  Air: "Air/Water",
  Shop: "Convenience Store",
  ATM: "ATM",
  "Car Wash": "Car Wash",
  Toilets: "Toilets",
};

// ─── Normalizer ──────────────────────────────────────

/** Ghana's eastern border with Togo (latitude-dependent longitude limit). */
function isInGhana(lat: number, lng: number): boolean {
  if (lng < -3.3 || lat < 4.5 || lat > 11.5) return false;
  const maxLng = 1.2 - (Math.max(lat, 6) - 6) * (1.03 / 5);
  return lng <= maxLng;
}

function normalizeTotal(raw: TotalRaw): NormalizedStation | null {
  if (!raw.lat || !raw.lon) return null;
  if (!isInGhana(raw.lat, raw.lon)) return null;

  const fuels = Array.from(new Set(
    (raw.fuel_types || []).map((f) => mapValue(f, FUEL_MAP, "fuels"))
  ));

  const amenities = Array.from(new Set(
    (raw.amenities || []).map((a) => mapValue(a, AMENITY_MAP, "amenities"))
  ));

  const { open24Hours, hours } = parseOsmHours(raw.opening_hours);

  return {
    id: `total-${raw.id}`,
    name: raw.name || "TotalEnergies",
    brand: "totalenergies",
    country_code: "GH",
    lat: raw.lat,
    lng: raw.lon,
    address: raw.address || "",
    city: (raw.city || "").trim(),
    state: (raw.region || "").trim(),
    postcode: raw.postcode || "",
    country: "Ghana",
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

export const totalenergiesGhana: BrandNormalizer = {
  brand: "totalenergies",
  label: "TotalEnergies GH",
  rawFile: "totalenergies_stations_ghana.json",
  outputBrand: "totalenergies",
  countryCode: "GH",
  normalize: normalizeTotal,
};
