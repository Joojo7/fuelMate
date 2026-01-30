import Papa from "papaparse";
import { Station, WeeklyHours } from "./types";

const CSV_URL =
  "https://bp-prod-bparalretailapi-temp-downloads-prod.s3-eu-west-1.amazonaws.com/csvs/AU.csv";

const FUEL_COLUMNS = [
  "Unlead", "Premium Unleaded", "BP Ultimate Unleaded",
  "Unleaded with Ethanol (E10)", "Diesel", "BP Ultimate Diesel",
  "BP Autogas", "Adblue Packaged", "Adblue Pumped", "LPG bottles",
];

const AMENITY_COLUMNS = [
  "bp pulse", "EV Charging", "Truck Diesel", "ATM", "Gift Card",
  "Food Offer Instore", "Takeaway Food Offer", "Fast Food",
  "Barista Coffee", "Wildbean Cafe", "Toilets", "Shower",
  "Washing Machine", "Truck Driver Lounge", "Truck Parking",
  "Rigid Access", "B-double Access", "Road Train Access",
  "High Flow Diesel", "Ultra High Flow Diesel", "Weigh Bridge",
  "Hand Wash", "Car Wash", "Trailer Hire", "BP Rewards",
  "AA Smartfuel", "Bpme Enabled", "Air/Water", "Jet Wash",
  "Vacuum", "Wifi", "AdBlue",
];

function yesVal(v: string | undefined): boolean {
  if (!v) return false;
  const s = v.toString().trim().toLowerCase();
  return s === "y" || s === "yes" || s === "true" || s === "1";
}

function parseRow(row: Record<string, string>, idx: number): Station | null {
  const lat = parseFloat(row["GPS Latitude"]);
  const lng = parseFloat(row["GPS Longitude"]);
  if (isNaN(lat) || isNaN(lng)) return null;

  const name = (row["Name"] || "").trim();
  if (!name) return null;

  const fuels = FUEL_COLUMNS.filter((c) => yesVal(row[c]));
  const amenities = AMENITY_COLUMNS.filter((c) => yesVal(row[c]));

  const hours: WeeklyHours = {
    mon: (row["mon"] || "").trim(),
    tue: (row["tue"] || "").trim(),
    wed: (row["wed"] || "").trim(),
    thu: (row["thu"] || "").trim(),
    fri: (row["fri"] || "").trim(),
    sat: (row["sat"] || "").trim(),
    sun: (row["sun"] || "").trim(),
  };

  return {
    id: row["Location Id2"]?.trim() || `station-${idx}`,
    name,
    shopUnitNo: (row["Shop Unit No"] || "").trim(),
    address: (row["Address"] || "").trim(),
    city: (row["City"] || "").trim(),
    state: (row["State"] || "").trim(),
    postcode: (row["Post code"] || "").trim(),
    country: (row["Country"] || "").trim(),
    lat,
    lng,
    telephone: (row["telephone"] || "").trim(),
    locationId: (row["Location Id2"] || "").trim(),
    bpmeEnabled: yesVal(row["Bpme Enabled"]),
    open24Hours: yesVal(row["Open 24 hours"]),
    hours,
    fuels,
    amenities,
  };
}

export async function fetchStations(): Promise<Station[]> {
  const res = await fetch(CSV_URL);
  const text = await res.text();

  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(text, {
      header: true,
      skipEmptyLines: true,
      complete(results) {
        const stations: Station[] = [];
        results.data.forEach((row, i) => {
          const s = parseRow(row, i);
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
