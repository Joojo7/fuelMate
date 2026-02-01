import { Station, StationStatus, Filters, STATE_TIMEZONES, COUNTRY_TIMEZONES } from "./types";

const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

function getNowInTimezone(tz: string): Date {
  const str = new Date().toLocaleString("en-US", { timeZone: tz });
  return new Date(str);
}

function getTimezone(station: Station): string {
  if (STATE_TIMEZONES[station.state]) return STATE_TIMEZONES[station.state];
  if (COUNTRY_TIMEZONES[station.country_code]) return COUNTRY_TIMEZONES[station.country_code];
  return "Australia/Sydney";
}

function parseTimeRange(range: string): { open: number; close: number } | null {
  if (!range || range.toLowerCase() === "closed") return null;
  const match = range.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
  if (!match) return null;
  const open = parseInt(match[1]) * 60 + parseInt(match[2]);
  const close = parseInt(match[3]) * 60 + parseInt(match[4]);
  return { open, close };
}

export function getStationStatus(station: Station): StationStatus {
  if (station.open24Hours) return "open";

  // Shell-style: use openStatusRaw + nextStatusChange
  if (station.openStatusRaw) {
    const raw = station.openStatusRaw;
    if (raw === "twenty_four_hour") return "open";
    if (raw === "closed") return "closed";
    if (raw === "open") {
      if (station.nextStatusChange) {
        const changeTime = new Date(station.nextStatusChange).getTime();
        const now = Date.now();
        const diffMin = (changeTime - now) / 60000;
        if (diffMin > 0 && diffMin <= 30) return "closing-soon";
      }
      return "open";
    }
    return "unknown";
  }

  // BP/Caltex-style: use weekly hours
  if (!station.hours) return "unknown";

  const tz = getTimezone(station);
  const now = getNowInTimezone(tz);
  const dayKey = DAY_KEYS[now.getDay()];
  const hoursStr = station.hours[dayKey];

  if (!hoursStr || hoursStr.trim() === "") return "unknown";

  const parsed = parseTimeRange(hoursStr);
  if (!parsed) return "closed";

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  let { open, close } = parsed;

  if (close <= open) close += 24 * 60;
  const adjustedCurrent = currentMinutes < open ? currentMinutes + 24 * 60 : currentMinutes;

  if (adjustedCurrent >= open && adjustedCurrent < close) {
    const minutesLeft = close - adjustedCurrent;
    return minutesLeft <= 30 ? "closing-soon" : "open";
  }
  return "closed";
}

export function getTimeUntilClose(station: Station): string | null {
  if (station.open24Hours) return "Open 24 hours";

  if (station.openStatusRaw) {
    if (station.openStatusRaw === "twenty_four_hour") return "Open 24 hours";
    if (station.openStatusRaw === "open" && station.nextStatusChange) {
      const diffMin = (new Date(station.nextStatusChange).getTime() - Date.now()) / 60000;
      if (diffMin > 0) {
        const h = Math.floor(diffMin / 60);
        const m = Math.round(diffMin % 60);
        return h > 0 ? `Closes in ${h}h ${m}m` : `Closes in ${m}m`;
      }
    }
    return null;
  }

  if (!station.hours) return null;

  const tz = getTimezone(station);
  const now = getNowInTimezone(tz);
  const dayKey = DAY_KEYS[now.getDay()];
  const hoursStr = station.hours[dayKey];
  const parsed = parseTimeRange(hoursStr);
  if (!parsed) return null;

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  let { close } = parsed;
  if (close <= parsed.open) close += 24 * 60;
  const adjustedCurrent = currentMinutes < parsed.open ? currentMinutes + 24 * 60 : currentMinutes;

  if (adjustedCurrent >= parsed.open && adjustedCurrent < close) {
    const left = close - adjustedCurrent;
    const h = Math.floor(left / 60);
    const m = left % 60;
    return h > 0 ? `Closes in ${h}h ${m}m` : `Closes in ${m}m`;
  }
  return null;
}

export function getNextOpenTime(station: Station): string | null {
  if (station.open24Hours) return null;
  if (!station.hours) return null;

  const tz = getTimezone(station);
  const now = getNowInTimezone(tz);

  for (let d = 0; d < 7; d++) {
    const dayIdx = (now.getDay() + d) % 7;
    const dayKey = DAY_KEYS[dayIdx];
    const hoursStr = station.hours[dayKey];
    const parsed = parseTimeRange(hoursStr);
    if (parsed) {
      const h = Math.floor(parsed.open / 60);
      const m = parsed.open % 60;
      const time = `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
      if (d === 0) {
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        if (parsed.open > currentMinutes) return `Opens at ${time} today`;
      }
      if (d === 1) return `Opens at ${time} tomorrow`;
      if (d > 0) {
        const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        return `Opens ${dayNames[dayIdx]} at ${time}`;
      }
    }
  }
  return "Hours unavailable — call to confirm";
}

export function haversineDistance(
  lat1: number, lon1: number, lat2: number, lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function sortByDistance(
  stations: Station[], lat: number, lng: number
): Station[] {
  return stations
    .map((s) => ({ ...s, distance: haversineDistance(lat, lng, s.lat, s.lng) }))
    .sort((a, b) => a.distance! - b.distance!);
}

export function filterByRadius(
  stations: Station[], lat: number, lng: number, radiusKm: number
): Station[] {
  return sortByDistance(stations, lat, lng).filter(
    (s) => s.distance! <= radiusKm
  );
}

export function applyFilters(stations: Station[], filters: Filters): Station[] {
  const brandSelected = filters.brand || [];
  const regionSelected = filters.region || [];
  const allSelected = [
    ...filters.fuels,
    ...filters.ev,
    ...filters.foodDrink,
    ...filters.vehicleServices,
    ...filters.truckAmenities,
    ...filters.convenience,
    ...filters.loyalty,
    ...(filters.siteType || []),
    ...(filters.accessibility || []),
  ];
  if (allSelected.length === 0 && regionSelected.length === 0 && brandSelected.length === 0) return stations;

  return stations.filter((s) => {
    if (brandSelected.length > 0 && !brandSelected.includes(s.brand)) {
      return false;
    }
    if (regionSelected.length > 0 && !regionSelected.includes(s.state)) {
      return false;
    }
    if (allSelected.length === 0) return true;
    const all = [...s.fuels, ...s.amenities];
    return allSelected.every((f) => all.includes(f));
  });
}

export function searchStations(stations: Station[], query: string): Station[] {
  const q = query.toLowerCase().trim();
  if (!q) return stations;
  return stations.filter(
    (s) =>
      s.name.toLowerCase().includes(q) ||
      s.city.toLowerCase().includes(q) ||
      s.postcode.includes(q) ||
      s.state.toLowerCase().includes(q) ||
      s.address.toLowerCase().includes(q) ||
      s.brand.toLowerCase().includes(q)
  );
}

export function isOpenAtTime(station: Station, date: Date): boolean {
  if (station.open24Hours) return true;
  if (!station.hours) return false;
  const dayKey = DAY_KEYS[date.getDay()];
  const hoursStr = station.hours[dayKey];
  const parsed = parseTimeRange(hoursStr);
  if (!parsed) return false;
  const mins = date.getHours() * 60 + date.getMinutes();
  let { open, close } = parsed;
  if (close <= open) close += 24 * 60;
  const adj = mins < open ? mins + 24 * 60 : mins;
  return adj >= open && adj < close;
}
