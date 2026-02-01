export type CountryCode = "AU" | "MY" | "GH" | "CI" | "BF" | "TG";

export interface Station {
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
  status?: StationStatus;
  distance?: number;
}

export interface WeeklyHours {
  mon: string;
  tue: string;
  wed: string;
  thu: string;
  fri: string;
  sat: string;
  sun: string;
}

export type StationStatus = "open" | "closing-soon" | "closed" | "unknown";

export interface Filters {
  brand: string[];
  region: string[];
  fuels: string[];
  ev: string[];
  foodDrink: string[];
  vehicleServices: string[];
  truckAmenities: string[];
  convenience: string[];
  loyalty: string[];
  siteType: string[];
  accessibility: string[];
}

export interface TripStop {
  station: Station;
  estimatedArrival: Date;
  distanceFromStart: number;
  isOpen: boolean;
}

// ─── Country / Brand config ─────────────────────────

export const COUNTRY_FLAGS: Record<CountryCode, string> = {
  AU: "🇦🇺", MY: "🇲🇾", GH: "🇬🇭", CI: "🇨🇮", BF: "🇧🇫", TG: "🇹🇬",
};

export const COUNTRY_OPTIONS: { code: CountryCode; label: string; center: [number, number]; zoom: number }[] = [
  { code: "AU", label: "Australia / NZ", center: [-25.2744, 133.7751], zoom: 5 },
  { code: "MY", label: "Malaysia", center: [4.2105, 101.9758], zoom: 7 },
  { code: "GH", label: "Ghana", center: [7.9465, -1.0232], zoom: 7 },
  { code: "CI", label: "Côte d'Ivoire", center: [7.54, -5.5471], zoom: 7 },
  { code: "BF", label: "Burkina Faso", center: [12.3714, -1.5197], zoom: 7 },
  { code: "TG", label: "Togo", center: [8.6195, 1.2080], zoom: 7 },
];

export const BRAND_OPTIONS: Record<CountryCode, string[]> = {
  AU: ["bp", "ampol"],
  MY: ["shell", "caltex", "caltex-workshop", "petronas"],
  GH: ["shell", "totalenergies", "goil", "staroil"],
  CI: ["shell"],
  BF: ["shell"],
  TG: ["totalenergies"],
};

// Brand display names (for filter labels)
export const BRAND_LABELS: Record<string, string> = {
  bp: "BP",
  shell: "Shell",
  caltex: "Caltex",
  "caltex-workshop": "Caltex Workshop",
  totalenergies: "TotalEnergies",
  goil: "GOIL",
  ampol: "Ampol",
  staroil: "Star Oil",
  petronas: "Petronas",
};

// Brand colors — primary, secondary, accent
export const BRAND_COLORS: Record<string, { primary: string; secondary: string; accent: string }> = {
  bp: { primary: "#00e253", secondary: "#ffcc00", accent: "#ffffff" },           // BP green, yellow shield
  shell: { primary: "#fbce07", secondary: "#dd1d21", accent: "#ffffff" },        // Shell yellow, red pecten
  caltex: { primary: "#00a5b5", secondary: "#e21836", accent: "#ffffff" },       // Caltex teal, red star
  "caltex-workshop": { primary: "#00a5b5", secondary: "#e21836", accent: "#f5a623" }, // Same + orange wrench accent
  totalenergies: { primary: "#ed1c24", secondary: "#002d72", accent: "#ffffff" },    // TotalEnergies red, navy
  goil: { primary: "#ff8c00", secondary: "#e30613", accent: "#ffd700" },             // GOIL bright orange, red, gold
  ampol: { primary: "#003ab9", secondary: "#e31837", accent: "#ffffff" },             // Ampol blue, red
  staroil: { primary: "#0091ff", secondary: "#003366", accent: "#ffffff" },             // Star Oil orange, navy
  petronas: { primary: "#00685e", secondary: "#003f5c", accent: "#ffffff" },             // Petronas dark green, dark blue
};

// ─── Per-country filter options ─────────────────────

export const REGION_OPTIONS_BY_COUNTRY: Record<CountryCode, string[]> = {
  AU: [
    "NSW", "VIC", "QLD", "SA", "WA", "TAS", "NT", "ACT",
    "Northland", "Auckland", "Waikato", "Bay of Plenty", "Gisborne",
    "Hawke's Bay", "Taranaki", "Manawatu-Whanganui", "Wellington",
    "Nelson", "Marlborough", "West Coast", "Canterbury", "Otago", "Southland",
  ],
  MY: [
    "Johor", "Kedah", "Kelantan", "Melaka", "Negeri Sembilan",
    "Pahang", "Perak", "Perlis", "Penang", "Sabah", "Sarawak",
    "Selangor", "Terengganu", "Kuala Lumpur", "Putrajaya", "Labuan",
  ],
  GH: [],
  CI: [],
  BF: [],
  TG: [],
};

// Generic fuel options (used in filter UI — shown for all countries)
export const FUEL_OPTIONS = [
  "Unleaded 91", "Unleaded 95", "Unleaded 98", "E10",
  "Diesel", "Premium Diesel",
  "LPG / Autogas", "AdBlue", "LPG Bottles",
  "EV Charging", "Kerosene", "Engine Oil", "Fuel Additive",
];

export const EV_OPTIONS = ["EV Charging"];

export const FOOD_DRINK_OPTIONS = [
  "Cafe", "Fast Food", "Food Store", "Delivery",
];

export const VEHICLE_SERVICE_OPTIONS = [
  "Car Wash", "Hand Wash", "Air/Water", "Jet Wash", "Vacuum",
  "Lube Service", "Service Bay", "Tyres & Batteries",
];

export const TRUCK_OPTIONS = [
  "Truck Parking", "High Flow Diesel",
];

export const CONVENIENCE_OPTIONS = [
  "ATM", "Convenience Store", "Toilets", "Shower", "WiFi",
  "Parking", "Disabled Access", "Premium Lounge", "AC Lounge",
];

export const LOYALTY_OPTIONS = [
  "Brand Loyalty", "Pay at Pump", "Self Service", "Full Service",
  "Mobile Payment", "Credit Card", "Fleet Card",
];

export const SITE_TYPE_OPTIONS = [
  "24 Hour", "Motorway", "Unattended",
];

export const ACCESSIBILITY_OPTIONS = [
  "Disabled Access",
];

export const SEARCH_RADIUS_OPTIONS = [5, 10, 25, 50, 100];

export const STATE_TIMEZONES: Record<string, string> = {
  // Australia
  NSW: "Australia/Sydney",
  VIC: "Australia/Melbourne",
  QLD: "Australia/Brisbane",
  SA: "Australia/Adelaide",
  WA: "Australia/Perth",
  TAS: "Australia/Hobart",
  NT: "Australia/Darwin",
  ACT: "Australia/Sydney",
  // NZ
  Auckland: "Pacific/Auckland",
  Wellington: "Pacific/Auckland",
  Canterbury: "Pacific/Auckland",
  Waikato: "Pacific/Auckland",
  "Bay of Plenty": "Pacific/Auckland",
  Otago: "Pacific/Auckland",
  "Hawke's Bay": "Pacific/Auckland",
  Manawatu: "Pacific/Auckland",
  "Manawatu-Whanganui": "Pacific/Auckland",
  "Other NZ": "Pacific/Auckland",
  Taranaki: "Pacific/Auckland",
  Northland: "Pacific/Auckland",
  Southland: "Pacific/Auckland",
  Nelson: "Pacific/Auckland",
  Marlborough: "Pacific/Auckland",
  Gisborne: "Pacific/Auckland",
  "West Coast": "Pacific/Auckland",
  Tasman: "Pacific/Auckland",
  Linwood: "Pacific/Auckland",
  Ilam: "Pacific/Auckland",
  "New Brighton": "Pacific/Auckland",
  Albany: "Pacific/Auckland",
  Harewood: "Pacific/Auckland",
  // Malaysia
  Johor: "Asia/Kuala_Lumpur",
  Kedah: "Asia/Kuala_Lumpur",
  Kelantan: "Asia/Kuala_Lumpur",
  Melaka: "Asia/Kuala_Lumpur",
  "Negeri Sembilan": "Asia/Kuala_Lumpur",
  Pahang: "Asia/Kuala_Lumpur",
  Perak: "Asia/Kuala_Lumpur",
  Perlis: "Asia/Kuala_Lumpur",
  Penang: "Asia/Kuala_Lumpur",
  Sabah: "Asia/Kuala_Lumpur",
  Sarawak: "Asia/Kuala_Lumpur",
  Selangor: "Asia/Kuala_Lumpur",
  Terengganu: "Asia/Kuala_Lumpur",
  "Kuala Lumpur": "Asia/Kuala_Lumpur",
  Putrajaya: "Asia/Kuala_Lumpur",
  Labuan: "Asia/Kuala_Lumpur",
};

export const COUNTRY_TIMEZONES: Record<string, string> = {
  AU: "Australia/Sydney",
  NZ: "Pacific/Auckland",
  MY: "Asia/Kuala_Lumpur",
  GH: "Africa/Accra",
  CI: "Africa/Abidjan",
  BF: "Africa/Ouagadougou",
};

export const ALL_AMENITY_COLUMNS = [
  ...FUEL_OPTIONS,
  ...FOOD_DRINK_OPTIONS,
  ...VEHICLE_SERVICE_OPTIONS,
  ...TRUCK_OPTIONS,
  ...CONVENIENCE_OPTIONS,
  ...LOYALTY_OPTIONS,
  ...SITE_TYPE_OPTIONS,
];
