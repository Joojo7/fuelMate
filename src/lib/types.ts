export interface Station {
  id: string;
  name: string;
  shopUnitNo: string;
  address: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  lat: number;
  lng: number;
  telephone: string;
  locationId: string;
  bpmeEnabled: boolean;
  open24Hours: boolean;
  hours: WeeklyHours;
  fuels: string[];
  amenities: string[];
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
  fuels: string[];
  ev: string[];
  foodDrink: string[];
  vehicleServices: string[];
  truckAmenities: string[];
  convenience: string[];
  loyalty: string[];
}

export interface TripStop {
  station: Station;
  estimatedArrival: Date;
  distanceFromStart: number;
  isOpen: boolean;
}

export const FUEL_OPTIONS = [
  "Unleaded", "Premium Unleaded", "BP Ultimate Unleaded",
  "Unleaded with Ethanol (E10)", "Diesel", "BP Ultimate Diesel",
  "BP Autogas", "Adblue Packaged", "Adblue Pumped", "LPG bottles",
];

export const EV_OPTIONS = ["bp pulse", "EV Charging"];

export const FOOD_DRINK_OPTIONS = [
  "Wildbean Cafe", "Barista Coffee", "Fast Food",
  "Takeaway Food Offer", "Food Offer Instore",
];

export const VEHICLE_SERVICE_OPTIONS = [
  "Car Wash", "Hand Wash", "Air/Water", "Jet Wash", "Vacuum", "Trailer Hire",
];

export const TRUCK_OPTIONS = [
  "Truck Parking", "Truck Driver Lounge", "Rigid Access",
  "B-double Access", "Road Train Access", "High Flow Diesel",
  "Ultra High Flow Diesel", "Weigh Bridge",
];

export const CONVENIENCE_OPTIONS = [
  "ATM", "Gift Card", "Toilets", "Shower", "Washing Machine", "Wifi",
];

export const LOYALTY_OPTIONS = ["BP Rewards", "AA Smartfuel", "Bpme Enabled"];

export const SEARCH_RADIUS_OPTIONS = [5, 10, 25, 50, 100];

export const STATE_TIMEZONES: Record<string, string> = {
  NSW: "Australia/Sydney",
  VIC: "Australia/Melbourne",
  QLD: "Australia/Brisbane",
  SA: "Australia/Adelaide",
  WA: "Australia/Perth",
  TAS: "Australia/Hobart",
  NT: "Australia/Darwin",
  ACT: "Australia/Sydney",
};

export const ALL_AMENITY_COLUMNS = [
  "Unlead", "Premium Unleaded", "BP Ultimate Unleaded",
  "Unleaded with Ethanol (E10)", "Diesel", "BP Ultimate Diesel",
  "BP Autogas", "Adblue Packaged", "Adblue Pumped", "LPG bottles",
  "bp pulse", "AdBlue", "AA Smartfuel", "EV Charging", "Truck Diesel",
  "ATM", "Gift Card", "Food Offer Instore", "Takeaway Food Offer",
  "Fast Food", "Barista Coffee", "Wildbean Cafe", "Toilets", "Shower",
  "Washing Machine", "Truck Driver Lounge", "Truck Parking",
  "Rigid Access", "B-double Access", "Road Train Access",
  "High Flow Diesel", "Ultra High Flow Diesel", "Weigh Bridge",
  "Hand Wash", "Car Wash", "Trailer Hire", "BP Rewards",
  "Bpme Enabled", "Air/Water", "Jet Wash", "Vacuum", "Wifi",
];
