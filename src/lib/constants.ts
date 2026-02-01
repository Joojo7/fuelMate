export type Tab = "map" | "list" | "trip" | "favourites";

export const TAB_LABELS: Record<Tab, string> = {
  map: "Map",
  list: "Stations",
  trip: "Trip planner",
  favourites: "Favourites",
};

export const BRAND_NAME = "[P\\TST/P]";
export const LOADING_TEXT = "Loading stations";
export const MENU_ICON = "☰";
export const DETAIL_LABEL = "DETAIL";
export const FILTERS_LABEL = "FILTERS";
export const FILTERS_OPEN = "▾ FILTERS";
export const FILTERS_CLOSED = "▸ FILTERS";
export const HUD_CLOSE = "✕ HUD";
export const HUD_OPEN = "◈ HUD";
export const EMPTY_DETAIL = "Select a station to view details";

// Favourites
export const FAV_TITLE = "Tracked Targets";
export const FAV_EMPTY = 'No targets tracked. Tap "Save" on a station to begin tracking.';
export const FAV_BADGE = "[TRACKED]";
export const FAV_REMOVE = "Remove";

// Status labels
export const STATUS_LABELS: Record<string, string> = {
  open: "Open",
  "closing-soon": "Closing Soon",
  closed: "Closed",
  unknown: "N/A",
};

// Filter panel
export const FILTER_TITLE = "Filters";
export const FILTER_CLEAR = "Clear All";
export const FILTER_OPEN_NOW = "STORES OPENED NOW";
export const FILTER_ON = "ON";
export const FILTER_OFF = "OFF";
export const FILTER_BRAND = "BRAND";
export const FILTER_GROUP_TITLES: Record<string, string> = {
  region: "REGION",
  fuels: "FUEL TYPE",
  ev: "EV",
  foodDrink: "FOOD & DRINK",
  vehicleServices: "VEHICLE SERVICES",
  truckAmenities: "TRUCK AMENITIES",
  convenience: "CONVENIENCE",
  loyalty: "LOYALTY & PAYMENTS",
  siteType: "SITE TYPE",
  accessibility: "ACCESSIBILITY",
};

// Colors
export const HUD_GREEN = "#00ff41";
export const STATUS_COLOR_CLOSED = "#ff0033";
export const STATUS_COLOR_CLOSING_SOON = "#ffd700";
export const STATUS_COLOR_UNKNOWN = "#666666";
export const USER_LOCATION_COLOR = "#00aaff";
export const ORIGIN_PIN_COLOR = "#00cc33";
export const DESTINATION_PIN_COLOR = "#ff3344";

// Map tile config
export const CARTO_DARK_URL = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
export const CARTO_LIGHT_URL = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
export const CARTO_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>';
export const GOOGLE_ATTRIBUTION = "&copy; Google";
export const MAX_VISIBLE_STATIONS = 2000;

// Onboarding tour
export const TOUR_STORAGE_KEY = "pitstop-tour-done";
export const TOUR_STEPS = {
  welcome: {
    title: "Welcome to Pitstop",
    content: "Your terminal-style fuel station finder. Let\u2019s take a quick tour of the key features.",
  },
  search: {
    title: "Search",
    content: "Search for stations by name, city, or postcode. Results update the map in real time.",
  },
  country: {
    title: "Country Picker",
    content: "Switch between countries to explore fuel stations in different regions.",
  },
  map: {
    title: "Map",
    content: "Stations appear as markers on the map. Click any marker to see its details, fuel types, and amenities.",
  },
  filters: {
    title: "Filters",
    content: "Narrow results by brand, fuel type, amenities, and more.",
  },
  tabs: {
    title: "Navigation",
    content: "Switch between the station list, trip planner, and your tracked favourites.",
  },
  hud: {
    title: "HUD Analytics",
    content: "View live stats and coverage analytics about stations in your current area.",
  },
};

// HUD Insights
export const INSIGHTS_BY_REGION = "By Region";
export const INSIGHTS_AMENITIES = "Amenities";
export const INSIGHTS_COVERAGE = "COVERAGE";
export const INSIGHTS_RADIUS = "radius";

// Data status
export const FETCH_ERROR_TEXT = "SIGNAL LOST — Unable to load station data";
export const RETRY_LABEL = "RETRY";
export const SYNCED_LABEL = "SYNCED";
export const DISCLAIMER_STORAGE_KEY = "pitstop-disclaimer-accepted";

// Fuel preference onboarding
export const FUEL_PREF_STORAGE_KEY = "pitstop-fuel-pref";
export const FUEL_PREF_HEADING = "What fuel do you use?";
export const FUEL_PREF_SUBHEADING = "Select one or more to personalise your results";
export const FUEL_PREF_CONTINUE = "CONTINUE";
export const FUEL_PREF_SKIP = "SKIP — SHOW ALL STATIONS";
export const FUEL_PREF_OPTIONS = [
  "Unleaded 91",
  "Unleaded 95",
  "Unleaded 98",
  "Diesel",
  "Premium Diesel",
  "LPG / Autogas",
  "EV Charging",
];
