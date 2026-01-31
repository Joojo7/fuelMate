/**
 * Normalize script: reads raw Shell/Caltex JSON and outputs unified Station[] JSON.
 *
 * Usage:  npx ts-node scripts/normalize.ts
 * Output: public/data/my/shell.json, public/data/my/caltex.json, public/data/my/unmapped.json
 */

/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require("fs") as typeof import("fs");
const path = require("path") as typeof import("path");

// ─── Shared helpers ──────────────────────────────────

function titleCase(s: string): string {
  return s
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

interface UnmappedReport {
  fuels: Record<string, string>;
  amenities: Record<string, string>;
}

const unmapped: UnmappedReport = { fuels: {}, amenities: {} };

function mapValue(
  raw: string,
  table: Record<string, string>,
  field: "fuels" | "amenities"
): string {
  if (table[raw]) return table[raw];
  const auto = titleCase(raw);
  unmapped[field][raw] = auto;
  return auto;
}

// ─── Fuel mapping tables ─────────────────────────────

const SHELL_FUEL_MAP: Record<string, string> = {
  low_octane_gasoline: "Unleaded 91",
  fuelsave_midgrade_gasoline: "Unleaded 95",
  midgrade_gasoline: "Unleaded 95",
  premium_gasoline: "Unleaded 98",
  super_premium_gasoline: "Unleaded 98",
  fuelsave_98: "Unleaded 98",
  unleaded_super: "Unleaded 98",
  fuelsave_regular_diesel: "Diesel",
  shell_regular_diesel: "Diesel",
  premium_diesel: "Premium Diesel",
  kerosene: "Kerosene",
  shell_recharge: "EV Charging",
  adblue_car: "AdBlue",
  adblue_pack: "AdBlue",
};

const CALTEX_FUEL_MAP: Record<string, string> = {
  "Premium 95": "Unleaded 95",
  "Premium 97": "Unleaded 98",
  "Diesel Euro5 B10": "Diesel",
  "Power Diesel Euro5 B7": "Premium Diesel",
  "Havoline Engine Oil": "Engine Oil",
  "Delo Diesel Engine Oil": "Engine Oil",
  "Techron Concentrate Plus": "Fuel Additive",
};

// ─── Amenity mapping tables ──────────────────────────

const SHELL_AMENITY_MAP: Record<string, string> = {
  // Vehicle services
  carwash: "Car Wash",
  conveyor: "Car Wash",
  conveyor_and_jet: "Car Wash",
  rollover: "Car Wash",
  touchless_pay: "Car Wash",
  manual: "Hand Wash",
  air_and_water: "Air/Water",
  jet: "Jet Wash",
  vacuum: "Vacuum",
  quick_lubes: "Lube Service",
  helix_oil_change: "Lube Service",
  four_w_lube_bay_shell: "Lube Service",
  two_w_lube_bay_shell: "Lube Service",
  service_bay: "Service Bay",
  helix_service_centre: "Service Bay",
  moto_care_express: "Service Bay",
  shell_advance: "Service Bay",
  // Food & drink
  cafe: "Cafe",
  shell_cafe: "Cafe",
  costa_express: "Cafe",
  tbc_cafe: "Cafe",
  deli_cafe: "Cafe",
  deli2go: "Cafe",
  fast_food: "Fast Food",
  hot_food: "Fast Food",
  sandwich: "Fast Food",
  snack_food: "Fast Food",
  burger: "Fast Food",
  bakery_shop: "Fast Food",
  food_offerings: "Food Store",
  stop_and_shop: "Food Store",
  uber_eats: "Delivery",
  deliveroo: "Delivery",
  foodpanda: "Delivery",
  // Convenience
  atm: "ATM",
  atm_in: "ATM",
  atm_out: "ATM",
  cash_deposit_machine: "ATM",
  selectshop: "Convenience Store",
  shop: "Convenience Store",
  standard_toilet: "Toilets",
  childs_toilet: "Toilets",
  wheelchair_accessible_toilet: "Toilets",
  wifi: "WiFi",
  parking_lanes: "Parking",
  guarded_car_park: "Parking",
  type_of_parking: "Parking",
  disabled_facilities: "Disabled Access",
  shell_disabled_access: "Disabled Access",
  disability_assistance: "Disabled Access",
  ramp_availability: "Disabled Access",
  in_store_assistance: "Disabled Access",
  // Truck
  truck_parking: "Truck Parking",
  high_speed_diesel_pump: "High Flow Diesel",
  // Loyalty / payment (extracted to payments, but kept as amenity too)
  loyalty_program: "Brand Loyalty",
  loyalty_cards: "Brand Loyalty",
  bonuslink: "Brand Loyalty",
  go_plus: "Brand Loyalty",
  airmiles: "Brand Loyalty",
  clubsmart_card: "Brand Loyalty",
  partner_loyalty_accepted: "Brand Loyalty",
  partner_card: "Brand Loyalty",
  other_loyalty_cards: "Brand Loyalty",
  pay_at_pump: "Pay at Pump",
  self_service: "Self Service",
  full_service: "Full Service",
  manned: "Full Service",
  unmanned: "Unattended",
  mobile_payment: "Mobile Payment",
  mobile_loyalty: "Mobile Payment",
  credit_card: "Credit Card",
  credit_card_general: "Credit Card",
  credit_card_american_express: "Credit Card",
  credit_card_mastercard: "Credit Card",
  credit_card_visa: "Credit Card",
  credit_card_diners_club: "Credit Card",
  fleet_card_general: "Fleet Card",
  fleet_card_dkv: "Fleet Card",
  fleet_card_eni: "Fleet Card",
  fleet_card_esso: "Fleet Card",
  fleet_card_uta: "Fleet Card",
  shell_card: "Fleet Card",
  fuel_card: "Fleet Card",
  // Site type
  twenty_four_hour: "24 Hour",
  twenty_four_hour_ev_service: "24 Hour EV",
  motorway_service: "Motorway",
  local_community_use: "Local Community",
  // Misc
  others: "Other",
  tbd: "Other",
  other_third_party_rental: "Vehicle Rental",
  adblue_pack: "AdBlue",
  adblue_car: "AdBlue",
};

const CALTEX_AMENITY_MAP: Record<string, string> = {
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

// ─── Shell payment extraction ────────────────────────

const SHELL_PAYMENT_AMENITIES = new Set([
  "credit_card", "credit_card_general", "credit_card_american_express",
  "credit_card_mastercard", "credit_card_visa", "credit_card_diners_club",
  "fleet_card_general", "fleet_card_dkv", "fleet_card_eni", "fleet_card_esso",
  "fleet_card_uta", "shell_card", "fuel_card",
  "mobile_payment", "mobile_loyalty", "pay_at_pump",
]);

function extractShellPayments(amenities: string[]): string[] {
  const payments = new Set<string>();
  for (const a of amenities) {
    if (a.startsWith("credit_card")) payments.add("Credit Card");
    else if (a === "shell_card" || a === "fuel_card" || a.startsWith("fleet_card")) payments.add("Fleet Card");
    else if (a === "mobile_payment" || a === "mobile_loyalty") payments.add("Mobile Payment");
    else if (a === "pay_at_pump") payments.add("Pay at Pump");
  }
  return Array.from(payments);
}

// ─── Caltex hours parsing ────────────────────────────

interface WeeklyHours {
  mon: string; tue: string; wed: string; thu: string; fri: string; sat: string; sun: string;
}

function parseCaltexHours(raw: string | null | undefined): { open24Hours: boolean; hours: WeeklyHours | null } {
  if (!raw || raw.trim() === "") return { open24Hours: false, hours: null };
  const s = raw.trim().toLowerCase();
  if (s === "24 hours" || s === "24hours" || s === "24 hrs") {
    return { open24Hours: true, hours: null };
  }
  // Try to parse "6.30am - 11.00pm" or "6:30am - 11:00pm" style
  const match = s.match(/(\d{1,2})[.:]?(\d{2})?\s*(am|pm)\s*[-–]\s*(\d{1,2})[.:]?(\d{2})?\s*(am|pm)/i);
  if (!match) return { open24Hours: false, hours: null };

  const toTime = (h: string, m: string | undefined, period: string): string => {
    let hour = parseInt(h);
    const min = parseInt(m || "0");
    if (period.toLowerCase() === "pm" && hour !== 12) hour += 12;
    if (period.toLowerCase() === "am" && hour === 12) hour = 0;
    return `${hour.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}`;
  };

  const open = toTime(match[1], match[2], match[3]);
  const close = toTime(match[4], match[5], match[6]);
  const timeStr = `${open} - ${close}`;

  return {
    open24Hours: false,
    hours: { mon: timeStr, tue: timeStr, wed: timeStr, thu: timeStr, fri: timeStr, sat: timeStr, sun: timeStr },
  };
}

// ─── Station output type ─────────────────────────────

interface NormalizedStation {
  id: string;
  name: string;
  brand: string;
  country_code: string;
  lat: number;
  lng: number;
  address: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  telephone: string;
  fuels: string[];
  amenities: string[];
  payments: string[];
  open24Hours: boolean;
  hours: WeeklyHours | null;
  openStatusRaw?: string;
  nextStatusChange?: string;
  websiteUrl?: string;
}

// ─── Shell normalizer ────────────────────────────────

interface ShellRaw {
  id: string;
  name: string;
  lat: number;
  lng: number;
  brand: string;
  inactive: boolean;
  country_code: string;
  address: string;
  city: string;
  state: string;
  postcode: string;
  telephone: string;
  country: string;
  amenities: string[];
  fuels: string[];
  open_status: string;
  next_open_status_change: string | null;
  website_url: string;
}

function normalizeShell(raw: ShellRaw): NormalizedStation | null {
  if (raw.inactive) return null;
  if (!raw.lat || !raw.lng) return null;

  const fuels = Array.from(new Set(
    (raw.fuels || []).map((f) => mapValue(f, SHELL_FUEL_MAP, "fuels"))
  ));

  const amenityValues = (raw.amenities || []).filter((a) => !SHELL_PAYMENT_AMENITIES.has(a));
  const amenities = Array.from(new Set(
    amenityValues.map((a) => mapValue(a, SHELL_AMENITY_MAP, "amenities"))
  ));

  const payments = extractShellPayments(raw.amenities || []);

  const is24 = raw.open_status === "twenty_four_hour" ||
    (raw.amenities || []).includes("twenty_four_hour");

  return {
    id: `shell-${raw.id}`,
    name: raw.name,
    brand: "shell",
    country_code: raw.country_code || "MY",
    lat: raw.lat,
    lng: raw.lng,
    address: raw.address || "",
    city: raw.city || "",
    state: raw.state || "",
    postcode: raw.postcode || "",
    country: raw.country || "Malaysia",
    telephone: raw.telephone || "",
    fuels,
    amenities,
    payments,
    open24Hours: is24,
    hours: null,
    openStatusRaw: raw.open_status,
    nextStatusChange: raw.next_open_status_change || undefined,
    websiteUrl: raw.website_url || undefined,
  };
}

// ─── Caltex normalizer ───────────────────────────────

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

function normalizeCaltex(raw: CaltexRaw): NormalizedStation | null {
  const lat = parseFloat(raw.latitude);
  const lng = parseFloat(raw.longitude);
  if (isNaN(lat) || isNaN(lng)) return null;
  if (!raw.name) return null;

  const fuels = Array.from(new Set(
    (raw.fuelsName || []).map((f) => mapValue(f, CALTEX_FUEL_MAP, "fuels"))
  ));

  const amenities = Array.from(new Set(
    (raw.amenitiesName || []).map((a) => mapValue(a, CALTEX_AMENITY_MAP, "amenities"))
  ));

  const payments = raw.paymenttypeList || [];

  const { open24Hours, hours } = parseCaltexHours(raw.operatingHours);

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

// ─── Main ────────────────────────────────────────────

function main() {
  const root = path.resolve(__dirname, "..");
  const outDir = path.join(root, "public", "data", "my");
  fs.mkdirSync(outDir, { recursive: true });

  const rawDir = path.join(root, "src", "raw-data");

  // Shell
  const shellPath = path.join(rawDir, "shell_stations_malaysia.json");
  if (fs.existsSync(shellPath)) {
    const shellRaw: ShellRaw[] = JSON.parse(fs.readFileSync(shellPath, "utf-8"));
    const shellStations = shellRaw.map(normalizeShell).filter(Boolean) as NormalizedStation[];
    fs.writeFileSync(path.join(outDir, "shell.json"), JSON.stringify(shellStations));
    console.log(`Shell: ${shellStations.length} stations (from ${shellRaw.length} raw)`);
  } else {
    console.log(`Shell: ${shellPath} not found, skipping`);
  }

  // Caltex B2C (fuel stations)
  const caltexPath = path.join(rawDir, "caltex_b2c.json");
  if (fs.existsSync(caltexPath)) {
    const caltexRaw: CaltexRaw[] = JSON.parse(fs.readFileSync(caltexPath, "utf-8"));
    const caltexStations = caltexRaw.map(normalizeCaltex).filter(Boolean) as NormalizedStation[];
    fs.writeFileSync(path.join(outDir, "caltex.json"), JSON.stringify(caltexStations));
    console.log(`Caltex B2C: ${caltexStations.length} stations (from ${caltexRaw.length} raw)`);
  } else {
    console.log(`Caltex B2C: ${caltexPath} not found, skipping`);
  }

  // Caltex B2B (workshops)
  const caltexB2bPath = path.join(rawDir, "caltex_b2b.json");
  if (fs.existsSync(caltexB2bPath)) {
    const b2bRaw: CaltexRaw[] = JSON.parse(fs.readFileSync(caltexB2bPath, "utf-8"));
    const b2bStations = b2bRaw.map((raw) => {
      const result = normalizeCaltex(raw);
      if (result) {
        result.id = `caltex-ws-${raw.id}`;
        result.brand = "caltex-workshop";
      }
      return result;
    }).filter(Boolean) as NormalizedStation[];
    fs.writeFileSync(path.join(outDir, "caltex-workshop.json"), JSON.stringify(b2bStations));
    console.log(`Caltex B2B: ${b2bStations.length} workshops (from ${b2bRaw.length} raw)`);
  } else {
    console.log(`Caltex B2B: ${caltexB2bPath} not found, skipping`);
  }

  // Unmapped report
  const hasUnmapped = Object.keys(unmapped.fuels).length > 0 || Object.keys(unmapped.amenities).length > 0;
  if (hasUnmapped) {
    fs.writeFileSync(path.join(outDir, "unmapped.json"), JSON.stringify(unmapped, null, 2));
    console.log("\n⚠ Unmapped values found:");
    if (Object.keys(unmapped.fuels).length > 0) {
      console.log("  Fuels:");
      for (const [raw, auto] of Object.entries(unmapped.fuels)) {
        console.log(`    "${raw}" → "${auto}"`);
      }
    }
    if (Object.keys(unmapped.amenities).length > 0) {
      console.log("  Amenities:");
      for (const [raw, auto] of Object.entries(unmapped.amenities)) {
        console.log(`    "${raw}" → "${auto}"`);
      }
    }
    console.log(`\nReport written to: ${path.join(outDir, "unmapped.json")}`);
  } else {
    console.log("\n✓ All values mapped successfully");
  }
}

main();
