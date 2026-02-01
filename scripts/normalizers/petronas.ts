import { mapValue, parseOsmHours } from "./helpers";
import { BrandNormalizer, NormalizedStation } from "./types";

// ─── Raw type (OSM-sourced) ──────────────────────────

interface PetronasRaw {
  osm_id: number;
  osm_type: string;
  name: string;
  brand: string;
  operator: string;
  latitude: number;
  longitude: number;
  address: string;
  city: string;
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

// ─── Fuel mapping ────────────────────────────────────

const FUEL_MAP: Record<string, string> = {
  // From fuel_types array
  "Primax 95": "Unleaded 95",
  "Primax 97": "Unleaded 95",
  "RON 91": "Unleaded 91",
  "Dynamic Diesel": "Diesel",
  NGV: "LPG / Autogas",
  LPG: "LPG / Autogas",
  // From fuel:* tags
  octane_91: "Unleaded 91",
  ron_95: "Unleaded 95",
  octane_95: "Unleaded 95",
  ron_97: "Unleaded 95",
  octane_97: "Unleaded 95",
  octane_98: "Unleaded 98",
  octane_100: "Unleaded 98",
  petrol: "Unleaded 95",
  gasoline: "Unleaded 95",
  diesel: "Diesel",
  diesel_b7: "Diesel",
  diesel_b10: "Diesel",
  diesel_euro5: "Diesel",
  euro_5_diesel: "Diesel",
  diesel_plus: "Premium Diesel",
  GTL_diesel: "Premium Diesel",
  HGV_diesel: "High Flow Diesel",
  lpg: "LPG / Autogas",
  ngv: "LPG / Autogas",
  cng: "LPG / Autogas",
};

// ─── Amenity mapping ─────────────────────────────────

const AMENITY_MAP: Record<string, string> = {
  // From amenities array
  Air: "Air/Water",
  "Kedai Mesra": "Convenience Store",
  Toilet: "Toilets",
  "Car Wash": "Car Wash",
  ATM: "ATM",
  // From tags
  compressed_air: "Air/Water",
  shop: "Convenience Store",
  car_wash: "Car Wash",
  atm: "ATM",
  toilets: "Toilets",
};

// ─── State normalization ─────────────────────────────

function normalizeState(raw: string): string {
  if (!raw) return "";
  // OSM sometimes has compound states like "Selangor/KL/Negeri Sembilan" — take first
  const first = raw.split("/")[0].trim();
  const STATE_REMAP: Record<string, string> = {
    KL: "Kuala Lumpur",
    Dungun: "Terengganu",
  };
  return STATE_REMAP[first] || first;
}

// ─── Normalizer ──────────────────────────────────────

function normalizePetronas(raw: PetronasRaw): NormalizedStation | null {
  if (!raw.latitude || !raw.longitude) return null;

  const tags = raw._raw_tags || {};
  const fuelsSet = new Set<string>();

  // From fuel_types array
  for (const f of raw.fuel_types || []) {
    fuelsSet.add(mapValue(f, FUEL_MAP, "fuels"));
  }

  // From fuel:* tags
  for (const [key, val] of Object.entries(tags)) {
    if (key.startsWith("fuel:") && val === "yes") {
      const fuelKey = key.replace("fuel:", "");
      fuelsSet.add(mapValue(fuelKey, FUEL_MAP, "fuels"));
    }
  }

  const amenitiesSet = new Set<string>();

  // From amenities array
  for (const a of raw.amenities || []) {
    amenitiesSet.add(mapValue(a, AMENITY_MAP, "amenities"));
  }

  // From tags
  if (tags.compressed_air === "yes") amenitiesSet.add(mapValue("compressed_air", AMENITY_MAP, "amenities"));
  if (tags.shop && tags.shop !== "no") amenitiesSet.add(mapValue("shop", AMENITY_MAP, "amenities"));
  if (tags.car_wash === "yes") amenitiesSet.add(mapValue("car_wash", AMENITY_MAP, "amenities"));
  if (tags.atm === "yes") amenitiesSet.add(mapValue("atm", AMENITY_MAP, "amenities"));
  if (tags.toilets === "yes") amenitiesSet.add(mapValue("toilets", AMENITY_MAP, "amenities"));

  const { open24Hours, hours } = parseOsmHours(raw.opening_hours);

  return {
    id: `petronas-${raw.osm_id}`,
    name: raw.name || "Petronas",
    brand: "petronas",
    country_code: "MY",
    lat: raw.latitude,
    lng: raw.longitude,
    address: (raw.address || "").trim(),
    city: (raw.city || "").trim(),
    state: normalizeState(raw.state),
    postcode: raw.postcode || "",
    country: "Malaysia",
    telephone: raw.phone || "",
    fuels: Array.from(fuelsSet),
    amenities: Array.from(amenitiesSet),
    payments: [],
    open24Hours,
    hours,
    websiteUrl: raw.website || undefined,
  };
}

// ─── Exported normalizer config ──────────────────────

export const petronasMalaysia: BrandNormalizer = {
  brand: "petronas",
  label: "Petronas MY",
  rawFile: "petronas_osm_stations_malaysia_raw.json",
  outputBrand: "petronas",
  countryCode: "MY",
  normalize: normalizePetronas,
};
