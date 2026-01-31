import Papa from "papaparse";
import { Station, WeeklyHours } from "./types";

const AU_CSV_URL =
  "https://bp-prod-bparalretailapi-temp-downloads-prod.s3-eu-west-1.amazonaws.com/csvs/AU.csv";
const NZ_CSV_URL =
  "https://bp-prod-bparalretailapi-temp-downloads-prod.s3-eu-west-1.amazonaws.com/csvs/NZ.csv";


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
  const fuels = fuelCols.filter((c) => yesVal(row[c]));
  const amenities = AMENITY_COLUMNS.filter((c) => yesVal(row[c]))
    .map((a) => {
      // Normalize NZ-specific names
      if (a === "Toilet") return "Toilets";
      if (a === "WI-FI") return "Wifi";
      if (a === "bp charge") return "EV Charging";
      if (a === "Pump Rewards") return "BP Rewards";
      return a;
    });
  // Deduplicate amenities
  const uniqueAmenities = Array.from(new Set(amenities));

  const hours: WeeklyHours = {
    mon: (row["mon"] || "").trim(),
    tue: (row["tue"] || "").trim(),
    wed: (row["wed"] || "").trim(),
    thu: (row["thu"] || "").trim(),
    fri: (row["fri"] || "").trim(),
    sat: (row["sat"] || "").trim(),
    sun: (row["sun"] || "").trim(),
  };

  // NZ uses "Open 24 Hours" (capital H), AU uses "Open 24 hours"
  const open24 = yesVal(row["Open 24 hours"]) || yesVal(row["Open 24 Hours"]);

  return {
    id: row["Location Id2"]?.trim() || `${country}-station-${idx}`,
    name,
    shopUnitNo: (row["Shop Unit No"] || "").trim(),
    address: (row["Address"] || "").trim(),
    city: (row["City"] || "").trim(),
    state: (row["State"] || "").trim(),
    postcode: (row["Post code"] || "").trim(),
    country: country,
    lat,
    lng,
    telephone: (row["telephone"] || "").trim(),
    locationId: (row["Location Id2"] || "").trim(),
    bpmeEnabled: yesVal(row["Bpme Enabled"]) || yesVal(row["BPMePlus Participating Site"]),
    open24Hours: open24,
    hours,
    fuels,
    amenities: uniqueAmenities,
  };
}

function parseCSV(text: string, country: string): Promise<Station[]> {
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
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const text = await res.text();
    return await parseCSV(text, country);
  } catch {
    return [];
  }
}

export async function fetchStations(): Promise<Station[]> {
  const [auStations, nzStations] = await Promise.all([
    fetchAndParse(AU_CSV_URL, "AU"),
    fetchAndParse(NZ_CSV_URL, "NZ"),
  ]);

  // Deduplicate by id
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
