import { mapValue } from "./helpers";
import { BrandNormalizer, NormalizedStation } from "./types";

// ─── Raw type ────────────────────────────────────────

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

// ─── Fuel mapping ────────────────────────────────────

const FUEL_MAP: Record<string, string> = {
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
  diesel_fit: "Diesel",
  cng: "CNG",
  autogas_lpg: "LPG / Autogas",
  truck_diesel: "High Flow Diesel",
  shell_recharge: "EV Charging",
  adblue_car: "AdBlue",
  adblue_pack: "AdBlue",
};

// ─── Amenity mapping ─────────────────────────────────

const AMENITY_MAP: Record<string, string> = {
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
  truck_parking: "Truck Parking",
  high_speed_diesel_pump: "High Flow Diesel",
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
  twenty_four_hour: "24 Hour",
  twenty_four_hour_ev_service: "24 Hour EV",
  motorway_service: "Motorway",
  local_community_use: "Local Community",
  restaurant: "Fast Food",
  pizza: "Fast Food",
  pizza_hut_express: "Fast Food",
  pizza_hut: "Fast Food",
  kfc: "Fast Food",
  bottled_gas: "Convenience Store",
  free_toilet: "Toilets",
  money_transfer_services: "Convenience Store",
  phone_shop: "Convenience Store",
  pharmacy: "Convenience Store",
  laundrette: "Convenience Store",
  water_refills: "Convenience Store",
  baby_change_facilities: "Toilets",
  alcoholic_beverages_beer: "Convenience Store",
  alcoholic_beverages_spirits: "Convenience Store",
  alcoholic_beverages_wine: "Convenience Store",
  solar_panels: "Other",
  other_oil_change: "Lube Service",
  tyre_centre: "Tyres & Batteries",
  diagnostics: "Service Bay",
  car_wash_hydrajet: "Car Wash",
  car_wash_soft_cloth: "Car Wash",
  forecourt: "Self Service",
  hgv_lane: "Truck Parking",
  mobile_payment_cartes_bancaires: "Mobile Payment",
  mobile_payment_mastercard: "Mobile Payment",
  mobile_payment_visa: "Mobile Payment",
  others: "Other",
  tbd: "Other",
  other_third_party_rental: "Vehicle Rental",
  adblue_pack: "AdBlue",
  adblue_car: "AdBlue",
};

// ─── Payment extraction ──────────────────────────────

const PAYMENT_AMENITIES = new Set([
  "credit_card", "credit_card_general", "credit_card_american_express",
  "credit_card_mastercard", "credit_card_visa", "credit_card_diners_club",
  "fleet_card_general", "fleet_card_dkv", "fleet_card_eni", "fleet_card_esso",
  "fleet_card_uta", "shell_card", "fuel_card",
  "mobile_payment", "mobile_loyalty", "pay_at_pump",
]);

function extractPayments(amenities: string[]): string[] {
  const payments = new Set<string>();
  for (const a of amenities) {
    if (a.startsWith("credit_card")) payments.add("Credit Card");
    else if (a === "shell_card" || a === "fuel_card" || a.startsWith("fleet_card")) payments.add("Fleet Card");
    else if (a === "mobile_payment" || a === "mobile_loyalty") payments.add("Mobile Payment");
    else if (a === "pay_at_pump") payments.add("Pay at Pump");
  }
  return Array.from(payments);
}

// ─── Normalizer ──────────────────────────────────────

function normalizeShell(raw: ShellRaw): NormalizedStation | null {
  if (raw.inactive) return null;
  if (!raw.lat || !raw.lng) return null;

  const fuels = Array.from(new Set(
    (raw.fuels || []).map((f) => mapValue(f, FUEL_MAP, "fuels"))
  ));

  const amenityValues = (raw.amenities || []).filter((a) => !PAYMENT_AMENITIES.has(a));
  const amenities = Array.from(new Set(
    amenityValues.map((a) => mapValue(a, AMENITY_MAP, "amenities"))
  ));

  const payments = extractPayments(raw.amenities || []);

  const is24 = raw.open_status === "twenty_four_hour" ||
    (raw.amenities || []).includes("twenty_four_hour");

  return {
    id: `shell-${raw.id}`,
    name: raw.name.trim(),
    brand: "shell",
    country_code: raw.country_code || "MY",
    lat: raw.lat,
    lng: raw.lng,
    address: raw.address || "",
    city: (raw.city || "").trim(),
    state: (raw.state || "").trim(),
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

// ─── Exported normalizer configs ─────────────────────

export const shellMalaysia: BrandNormalizer = {
  brand: "shell",
  label: "Shell MY",
  rawFile: "shell_stations_malaysia.json",
  outputBrand: "shell",
  countryCode: "MY",
  normalize: normalizeShell,
};

export const shellWestAfrica: BrandNormalizer = {
  brand: "shell",
  label: "Shell West Africa",
  rawFile: "shell_stations_ghana.json",
  outputBrand: "shell",
  countryCode: "auto",
  splitByCountry: true,
  normalize: normalizeShell,
};
