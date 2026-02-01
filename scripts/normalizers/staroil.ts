import { mapValue, parseOsmHours } from "./helpers";
import { BrandNormalizer, NormalizedStation } from "./types";

// ─── Raw type (OSM-sourced) ──────────────────────────

interface StarOilRaw {
  osm_id: number;
  osm_type: string;
  name: string;
  brand: string;
  operator: string;
  latitude: number;
  longitude: number;
  address: string;
  suburb: string;
  region: string;
  postcode: string;
  country: string;
  phone: string;
  website: string;
  opening_hours: string;
  _raw_tags: Record<string, string>;
}

// ─── Fuel mapping (from OSM fuel:* tags) ─────────────

const FUEL_MAP: Record<string, string> = {
  diesel: "Diesel",
  octane_91: "Unleaded 91",
  octane_95: "Unleaded 95",
  kerosene: "Kerosene",
};

// ─── Amenity mapping (from OSM tags) ─────────────────

const AMENITY_MAP: Record<string, string> = {
  compressed_air: "Air/Water",
  shop: "Convenience Store",
};

// ─── Normalizer ──────────────────────────────────────

function normalizeStarOil(raw: StarOilRaw): NormalizedStation | null {
  if (!raw.latitude || !raw.longitude) return null;

  const tags = raw._raw_tags || {};

  // Extract fuels from fuel:* tags
  const fuels: string[] = [];
  for (const [key, val] of Object.entries(tags)) {
    if (key.startsWith("fuel:") && val === "yes") {
      const fuelKey = key.replace("fuel:", "");
      fuels.push(mapValue(fuelKey, FUEL_MAP, "fuels"));
    }
  }

  // Extract amenities from known tags
  const amenities: string[] = [];
  if (tags.compressed_air === "yes") {
    amenities.push(mapValue("compressed_air", AMENITY_MAP, "amenities"));
  }
  if (tags.shop === "yes") {
    amenities.push(mapValue("shop", AMENITY_MAP, "amenities"));
  }

  const { open24Hours, hours } = parseOsmHours(raw.opening_hours);

  // Build city from suburb or address
  const city = (raw.suburb || "").trim();
  const address = (raw.address || "").trim();

  // Use branch name from tags if available for a more specific name
  const branch = tags.branch;
  const name = branch
    ? `Star Oil – ${branch}`
    : raw.name || "Star Oil";

  return {
    id: `staroil-${raw.osm_id}`,
    name,
    brand: "staroil",
    country_code: "GH",
    lat: raw.latitude,
    lng: raw.longitude,
    address,
    city,
    state: (raw.region || "").trim(),
    postcode: raw.postcode || "",
    country: "Ghana",
    telephone: raw.phone || "",
    fuels: Array.from(new Set(fuels)),
    amenities: Array.from(new Set(amenities)),
    payments: [],
    open24Hours,
    hours,
    websiteUrl: raw.website || undefined,
  };
}

// ─── Exported normalizer config ──────────────────────

export const staroilGhana: BrandNormalizer = {
  brand: "staroil",
  label: "Star Oil GH",
  rawFile: "staroil_osm_stations_ghana_raw.json",
  outputBrand: "staroil",
  countryCode: "GH",
  normalize: normalizeStarOil,
};
