import { mapValue, parseTimeRange } from "./helpers";
import { BrandNormalizer, NormalizedStation } from "./types";

// ─── Raw type ────────────────────────────────────────

interface CaltexRaw {
  id: string;
  name: string;
  latitude: string;
  longitude: string;
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  phoneNumber: string;
  operatingHours: string;
  fuelsName: string[] | null;
  amenitiesName: string[] | null;
  paymenttypeList: string[] | null;
}

// ─── Fuel mapping ────────────────────────────────────

const FUEL_MAP: Record<string, string> = {
  "Premium 95": "Unleaded 95",
  "Premium 97": "Unleaded 98",
  "Diesel Euro5 B10": "Diesel",
  "Power Diesel Euro5 B7": "Premium Diesel",
  "Havoline Engine Oil": "Engine Oil",
  "Delo Diesel Engine Oil": "Engine Oil",
  "Techron Concentrate Plus": "Fuel Additive",
};

// ─── Amenity mapping ─────────────────────────────────

const AMENITY_MAP: Record<string, string> = {
  Mart: "Convenience Store",
  ATM: "ATM",
  Cafe: "Cafe",
  "Car Wash": "Car Wash",
  "Lube Bay": "Lube Service",
  "22-pt Service Check": "Service Bay",
  "Inspection & Maintenance": "Service Bay",
  "Repairs & Brakes": "Service Bay",
  "Tires & Batteries": "Tyres & Batteries",
  Refreshroom: "Toilets",
  "Premium Lounge": "Premium Lounge",
  "Air con": "AC Lounge",
  "Free Refreshments": "AC Lounge",
};

// ─── Normalizer ──────────────────────────────────────

function normalizeCaltex(raw: CaltexRaw): NormalizedStation | null {
  const lat = parseFloat(raw.latitude);
  const lng = parseFloat(raw.longitude);
  if (isNaN(lat) || isNaN(lng)) return null;
  if (!raw.name) return null;

  const fuels = Array.from(new Set(
    (raw.fuelsName || []).map((f) => mapValue(f, FUEL_MAP, "fuels"))
  ));

  const amenities = Array.from(new Set(
    (raw.amenitiesName || []).map((a) => mapValue(a, AMENITY_MAP, "amenities"))
  ));

  const payments = raw.paymenttypeList || [];
  const { open24Hours, hours } = parseTimeRange(raw.operatingHours);

  return {
    id: `caltex-${raw.id}`,
    name: raw.name,
    brand: "caltex",
    country_code: "MY",
    lat,
    lng,
    address: raw.street || "",
    city: raw.city || "",
    state: raw.state || "",
    postcode: raw.postalCode || "",
    country: raw.country || "Malaysia",
    telephone: raw.phoneNumber || "",
    fuels,
    amenities,
    payments,
    open24Hours,
    hours,
    websiteUrl: undefined,
  };
}

// ─── Exported normalizer configs ─────────────────────

export const caltexB2C: BrandNormalizer = {
  brand: "caltex",
  label: "Caltex B2C",
  rawFile: "caltex_b2c.json",
  outputBrand: "caltex",
  countryCode: "MY",
  normalize: normalizeCaltex,
};

export const caltexB2B: BrandNormalizer = {
  brand: "caltex-workshop",
  label: "Caltex B2B",
  rawFile: "caltex_b2b.json",
  outputBrand: "caltex-workshop",
  countryCode: "MY",
  normalize(raw: CaltexRaw): NormalizedStation | null {
    const result = normalizeCaltex(raw);
    if (result) {
      result.id = `caltex-ws-${raw.id}`;
      result.brand = "caltex-workshop";
    }
    return result;
  },
};
