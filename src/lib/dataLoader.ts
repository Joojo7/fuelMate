import { Station, WeeklyHours, CountryCode, BRAND_OPTIONS } from "./types";

// ─── State name normalization (cross-brand consistency) ──

const STATE_NORMALIZE: Record<string, string> = {
  "W.P. Kuala Lumpur": "Kuala Lumpur",
  "W.P. Labuan": "Labuan",
  "W.P. Putrajaya": "Putrajaya",
  "Pulau Pinang": "Penang",
  "Trengganu": "Terengganu",
  "Wilayah Persekutuan Kuala Lumpur": "Kuala Lumpur",
  "Wilayah Persekutuan Labuan": "Labuan",
  "Wilayah Persekutuan Putrajaya": "Putrajaya",
  "Selangor/KL/Negeri Sembilan": "Selangor",
  "Melaka/Negeri Sembilan": "Melaka",
  "Kelantan/Terengganu": "Kelantan",
  "Pahang/Terengganu": "Pahang",
  "Perak/Selangor": "Perak",
  "Perlis/Kedah": "Perlis",
};

function normalizeState(state: string): string {
  return STATE_NORMALIZE[state] || state;
}

// ─── BP CSV URLs (proxied via API route for caching) ──

const AU_CSV_URL = "/api/stations/bp?country=AU";
const NZ_CSV_URL = "/api/stations/bp?country=NZ";

// ─── BP fuel normalization ───────────────────────────

const BP_FUEL_MAP: Record<string, string> = {
  "Unlead": "Unleaded 91",
  "Unleaded 91": "Unleaded 91",
  "BP 91": "Unleaded 91",
  "Premium Unleaded": "Unleaded 95",
  "BP 95": "Unleaded 95",
  "Premium Unleaded 95": "Unleaded 95",
  "BP Ultimate Unleaded": "Unleaded 98",
  "Ultimate Unleaded 98": "Unleaded 98",
  "Unleaded with Ethanol (E10)": "E10",
  "e10": "E10",
  "Diesel": "Diesel",
  "BP Diesel": "Diesel",
  "BP Ultimate Diesel": "Premium Diesel",
  "Ultimate Diesel": "Premium Diesel",
  "BP Autogas": "LPG / Autogas",
  "LPG Automotive": "LPG / Autogas",
  "Adblue Packaged": "AdBlue",
  "Adblue Pumped": "AdBlue",
  "AdBlue Cannister": "AdBlue",
  "AdBlue Pump": "AdBlue",
  "LPG bottles": "LPG Bottles",
  "LPG Bottle Fill": "LPG Bottles",
};

const BP_AMENITY_MAP: Record<string, string> = {
  "bp pulse": "EV Charging",
  "EV Charging": "EV Charging",
  "bp charge": "EV Charging",
  "Truck Diesel": "High Flow Diesel",
  "ATM": "ATM",
  "Gift Card": "Convenience Store",
  "Food Offer Instore": "Food Store",
  "Takeaway Food Offer": "Fast Food",
  "Fast Food": "Fast Food",
  "Barista Coffee": "Cafe",
  "Wildbean Cafe": "Cafe",
  "Toilets": "Toilets",
  "Toilet": "Toilets",
  "Shower": "Shower",
  "Washing Machine": "Convenience Store",
  "Truck Driver Lounge": "Truck Parking",
  "Truck Parking": "Truck Parking",
  "Rigid Access": "Truck Parking",
  "B-double Access": "Truck Parking",
  "Road Train Access": "Truck Parking",
  "High Flow Diesel": "High Flow Diesel",
  "Ultra High Flow Diesel": "High Flow Diesel",
  "Weigh Bridge": "Truck Parking",
  "Hand Wash": "Hand Wash",
  "Car Wash": "Car Wash",
  "Trailer Hire": "Vehicle Rental",
  "BP Rewards": "Brand Loyalty",
  "Pump Rewards": "Brand Loyalty",
  "AA Smartfuel": "Brand Loyalty",
  "Bpme Enabled": "Mobile Payment",
  "Air/Water": "Air/Water",
  "Jet Wash": "Jet Wash",
  "Vacuum": "Vacuum",
  "Wifi": "WiFi",
  "WI-FI": "WiFi",
  "AdBlue": "AdBlue",
  "Unattended Site": "Unattended",
  "Truck Suitable Site": "Truck Parking",
  "Truck Only": "Truck Parking",
  "BPMePlus Participating Site": "Mobile Payment",
  "David Jones Food": "Food Store",
  "Couch Food": "Delivery",
  "Hungry As": "Fast Food",
  "Good Mood Food": "Fast Food",
  "Western Union": "Convenience Store",
  "National Diesel Offer": "Diesel",
  "BP Rewards – earn only": "Brand Loyalty",
  "BP Rewards Unlocked": "Brand Loyalty",
  "BP Rewards Unlocked Shop": "Brand Loyalty",
  "BP Rewards Fuel Offer": "Brand Loyalty",
  "BP Rewards Shop Offer": "Brand Loyalty",
  "LPG Bottle Swap": "LPG Bottles",
  "Recycling Facilities": "Disabled Access",
  "Disabled Facilities": "Disabled Access",
  "Motorway Site": "Motorway",
  "Uber Eats": "Delivery",
  "PAYBACK": "Brand Loyalty",
  "AHG": "Brand Loyalty",
};

const FUEL_COLUMNS_AU = [
  "Unlead", "Premium Unleaded", "BP Ultimate Unleaded",
  "Unleaded with Ethanol (E10)", "Diesel", "BP Ultimate Diesel",
  "BP Autogas", "Adblue Packaged", "Adblue Pumped", "LPG bottles",
];

const FUEL_COLUMNS_NZ = [
  "BP 91", "BP 95", "BP Ultimate Unleaded", "e10",
  "BP Diesel", "Ultimate Diesel", "LPG Automotive",
  "AdBlue Cannister", "AdBlue Pump", "LPG Bottle Fill",
  "Unleaded 91", "Premium Unleaded 95", "Ultimate Unleaded 98",
];

const AMENITY_COLUMNS = [
  "bp pulse", "EV Charging", "bp charge", "Truck Diesel", "ATM", "Gift Card",
  "Food Offer Instore", "Takeaway Food Offer", "Fast Food",
  "Barista Coffee", "Wildbean Cafe", "Toilets", "Toilet", "Shower",
  "Washing Machine", "Truck Driver Lounge", "Truck Parking",
  "Rigid Access", "B-double Access", "Road Train Access",
  "High Flow Diesel", "Ultra High Flow Diesel", "Weigh Bridge",
  "Hand Wash", "Car Wash", "Trailer Hire", "BP Rewards", "Pump Rewards",
  "AA Smartfuel", "Bpme Enabled", "Air/Water", "Jet Wash",
  "Vacuum", "Wifi", "WI-FI", "AdBlue",
  "Unattended Site", "Truck Suitable Site", "Truck Only",
  "BPMePlus Participating Site",
  "David Jones Food", "Couch Food", "Hungry As", "Good Mood Food",
  "Western Union",
  "National Diesel Offer",
  "BP Rewards – earn only", "BP Rewards Unlocked", "BP Rewards Unlocked Shop",
  "BP Rewards Fuel Offer", "BP Rewards Shop Offer",
  "LPG Bottle Swap", "Recycling Facilities", "Disabled Facilities",
  "Motorway Site", "Uber Eats", "PAYBACK", "AHG",
];

// ─── NZ region lookup by lat/lng ─────────────────────
// NZ doesn't provide region names in CSV — only suburbs. Use bounding boxes to assign regions.
const NZ_REGIONS: { name: string; latMin: number; latMax: number; lngMin: number; lngMax: number }[] = [
  { name: "Northland",       latMin: -36.0,  latMax: -34.2,  lngMin: 173.0, lngMax: 175.0 },
  { name: "Auckland",        latMin: -37.1,  latMax: -36.0,  lngMin: 174.0, lngMax: 175.5 },
  { name: "Waikato",         latMin: -38.5,  latMax: -37.1,  lngMin: 174.5, lngMax: 176.5 },
  { name: "Bay of Plenty",   latMin: -38.5,  latMax: -37.3,  lngMin: 176.0, lngMax: 177.5 },
  { name: "Gisborne",        latMin: -39.0,  latMax: -37.8,  lngMin: 177.0, lngMax: 178.7 },
  { name: "Hawke's Bay",     latMin: -40.0,  latMax: -38.5,  lngMin: 176.0, lngMax: 178.0 },
  { name: "Taranaki",        latMin: -39.5,  latMax: -38.5,  lngMin: 173.5, lngMax: 175.0 },
  { name: "Manawatu-Whanganui", latMin: -40.5, latMax: -38.8, lngMin: 174.5, lngMax: 176.5 },
  { name: "Wellington",      latMin: -41.5,  latMax: -40.5,  lngMin: 174.5, lngMax: 176.5 },
  { name: "Nelson",          latMin: -42.0,  latMax: -41.0,  lngMin: 172.0, lngMax: 174.0 },
  { name: "Marlborough",     latMin: -42.5,  latMax: -41.0,  lngMin: 173.0, lngMax: 175.0 },
  { name: "West Coast",      latMin: -46.0,  latMax: -41.5,  lngMin: 168.0, lngMax: 172.0 },
  { name: "Canterbury",      latMin: -44.5,  latMax: -42.0,  lngMin: 170.5, lngMax: 173.5 },
  { name: "Otago",           latMin: -46.5,  latMax: -44.0,  lngMin: 168.0, lngMax: 172.0 },
  { name: "Southland",       latMin: -47.5,  latMax: -45.5,  lngMin: 166.0, lngMax: 169.5 },
];

function getNzRegion(lat: number, lng: number): string {
  for (const r of NZ_REGIONS) {
    if (lat >= r.latMin && lat <= r.latMax && lng >= r.lngMin && lng <= r.lngMax) {
      return r.name;
    }
  }
  return "Other NZ";
}

function yesVal(v: string | undefined): boolean {
  if (!v) return false;
  const s = v.toString().trim().toLowerCase();
  return s === "y" || s === "yes" || s === "true" || s === "1";
}

function parseRow(row: Record<string, string>, idx: number, country: string): Station | null {
  const lat = parseFloat(row["GPS Latitude"]);
  const lng = parseFloat(row["GPS Longitude"]);
  if (isNaN(lat) || isNaN(lng)) return null;

  const name = (row["Name"] || "").trim();
  if (!name) return null;

  const fuelCols = country === "NZ" ? FUEL_COLUMNS_NZ : FUEL_COLUMNS_AU;
  const rawFuels = fuelCols.filter((c) => yesVal(row[c]));
  const fuels = Array.from(new Set(rawFuels.map((f) => BP_FUEL_MAP[f] || f)));

  const rawAmenities = AMENITY_COLUMNS.filter((c) => yesVal(row[c]));
  const amenities = Array.from(new Set(rawAmenities.map((a) => BP_AMENITY_MAP[a] || a)));

  const hours: WeeklyHours = {
    mon: (row["mon"] || "").trim(),
    tue: (row["tue"] || "").trim(),
    wed: (row["wed"] || "").trim(),
    thu: (row["thu"] || "").trim(),
    fri: (row["fri"] || "").trim(),
    sat: (row["sat"] || "").trim(),
    sun: (row["sun"] || "").trim(),
  };

  const open24 = yesVal(row["Open 24 hours"]) || yesVal(row["Open 24 Hours"]);

  return {
    id: row["Location Id2"]?.trim() || `${country}-station-${idx}`,
    name,
    brand: "bp",
    country_code: country,
    address: (row["Address"] || "").trim(),
    city: (row["City"] || "").trim(),
    state: country === "NZ" ? getNzRegion(lat, lng) : (row["State"] || "").trim(),
    postcode: (row["Post code"] || "").trim(),
    country: country === "NZ" ? "New Zealand" : "Australia",
    lat,
    lng,
    telephone: (row["telephone"] || "").trim(),
    fuels,
    amenities,
    payments: [],
    open24Hours: open24,
    hours,
  };
}

async function parseCSV(text: string, country: string): Promise<Station[]> {
  const Papa = (await import("papaparse")).default;
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(text, {
      header: true,
      skipEmptyLines: true,
      complete(results) {
        const stations: Station[] = [];
        results.data.forEach((row, i) => {
          const s = parseRow(row, i, country);
          if (s) stations.push(s);
        });
        resolve(stations);
      },
      error(err: Error) {
        reject(err);
      },
    });
  });
}

async function fetchAndParse(url: string, country: string): Promise<Station[]> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${country} data (${res.status})`);
  const text = await res.text();
  return await parseCSV(text, country);
}

// ─── BP AU/NZ live fetch ─────────────────────────────

async function fetchBpStations(): Promise<Station[]> {
  const [auStations, nzStations] = await Promise.all([
    fetchAndParse(AU_CSV_URL, "AU"),
    fetchAndParse(NZ_CSV_URL, "NZ"),
  ]);

  const seen = new Set<string>();
  const all: Station[] = [];
  for (const s of [...auStations, ...nzStations]) {
    if (!seen.has(s.id)) {
      seen.add(s.id);
      all.push(s);
    }
  }
  return all;
}

async function fetchJsonBrand(country: CountryCode, brand: string): Promise<Station[]> {
  const res = await fetch(`/data/${country.toLowerCase()}/${brand}.json`);
  if (!res.ok) throw new Error(`Failed to fetch ${brand} data for ${country} (${res.status})`);
  return (await res.json()) as Station[];
}

// ─── Generic country loader ──────────────────────────

export async function fetchCountryStations(country: CountryCode): Promise<Station[]> {
  if (country === "AU") {
    // BP comes from live CSV; other AU brands from static JSON
    const otherBrands = BRAND_OPTIONS.AU.filter((b) => b !== "bp");
    const [bpStations, ...otherResults] = await Promise.all([
      fetchBpStations(),
      ...otherBrands.map((brand) => fetchJsonBrand("AU", brand)),
    ]);

    const seen = new Set<string>();
    const all: Station[] = [];
    for (const s of [bpStations, ...otherResults].flat()) {
      if (!seen.has(s.id)) {
        seen.add(s.id);
        s.state = normalizeState(s.state);
        all.push(s);
      }
    }
    return all;
  }

  const brands = BRAND_OPTIONS[country];
  const results = await Promise.all(
    brands.map(async (brand) => {
      const res = await fetch(`/data/${country.toLowerCase()}/${brand}.json`);
      if (!res.ok) throw new Error(`Failed to fetch ${brand} data for ${country} (${res.status})`);
      return (await res.json()) as Station[];
    })
  );

  const seen = new Set<string>();
  const all: Station[] = [];
  for (const s of results.flat()) {
    if (!seen.has(s.id)) {
      seen.add(s.id);
      s.state = normalizeState(s.state);
      all.push(s);
    }
  }
  return all;
}

// ─── Prefetch other countries in background ─────────

const prefetched = new Set<string>();

export function prefetchOtherCountries(current: CountryCode): void {
  const others = (Object.keys(BRAND_OPTIONS) as CountryCode[]).filter((c) => c !== current);

  for (const country of others) {
    if (prefetched.has(country)) continue;
    prefetched.add(country);

    if (country === "AU") {
      fetch(AU_CSV_URL, { priority: "low" } as RequestInit).catch(() => {});
      fetch(NZ_CSV_URL, { priority: "low" } as RequestInit).catch(() => {});
      for (const brand of BRAND_OPTIONS.AU.filter((b) => b !== "bp")) {
        fetch(`/data/au/${brand}.json`, { priority: "low" } as RequestInit).catch(() => {});
      }
    } else {
      const brands = BRAND_OPTIONS[country];
      for (const brand of brands) {
        fetch(`/data/${country.toLowerCase()}/${brand}.json`, { priority: "low" } as RequestInit).catch(() => {});
      }
    }
  }
}
