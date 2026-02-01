"use client";

import { fetchCountryStations } from "@/lib/dataLoader";
import { applyFilters, filterByRadius, getStationStatus, haversineDistance, searchStations, sortByDistance } from "@/lib/stationUtils";
import { COUNTRY_OPTIONS, CountryCode, Filters, Station, StationStatus } from "@/lib/types";
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";

export interface TripPoint {
  lat: number;
  lng: number;
  label: string;
}

interface AppState {
  allStations: Station[];
  filteredStations: Station[];
  selectedStation: Station | null;
  favourites: string[];
  filters: Filters;
  searchQuery: string;
  showAll: boolean;
  radiusEnabled: boolean;
  searchRadius: number;
  userLocation: { lat: number; lng: number } | null;
  loading: boolean;
  mapCenter: [number, number];
  mapZoom: number;
  activeCountry: CountryCode;
  tripPickMode: "origin" | "destination" | null;
  tripOrigin: TripPoint | null;
  tripDestination: TripPoint | null;
  searchCircle: { lat: number; lng: number; radius: number } | null;
  tripStops: Station[];
}

interface AppContextValue extends AppState {
  setSelectedStation: (s: Station | null) => void;
  toggleFavourite: (id: string) => void;
  setFilters: (f: Filters) => void;
  setSearchQuery: (q: string) => void;
  setShowAll: (v: boolean) => void;
  setRadiusEnabled: (v: boolean) => void;
  setSearchRadius: (r: number) => void;
  setUserLocation: (loc: { lat: number; lng: number } | null) => void;
  setMapCenter: (c: [number, number]) => void;
  setMapZoom: (z: number) => void;
  refreshStatus: () => void;
  setActiveCountry: (c: CountryCode) => void;
  setTripPickMode: (m: "origin" | "destination" | null) => void;
  setTripOrigin: (p: TripPoint | null) => void;
  setTripDestination: (p: TripPoint | null) => void;
  setSearchCircle: (c: { lat: number; lng: number; radius: number } | null) => void;
  setTripStops: (stops: Station[]) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

const EMPTY_FILTERS: Filters = {
  brand: [], region: [], fuels: [], ev: [], foodDrink: [], vehicleServices: [],
  truckAmenities: [], convenience: [], loyalty: [],
  siteType: [], accessibility: [],
};

function getInitialCountry(): CountryCode {
  if (typeof window === "undefined") return "AU";
  return (localStorage.getItem("pitstop-country") as CountryCode) || "AU";
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [activeCountry, setActiveCountryState] = useState<CountryCode>(getInitialCountry);
  const [allStations, setAllStations] = useState<Station[]>([]);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [favourites, setFavourites] = useState<string[]>([]);
  const [filters, setFiltersState] = useState<Filters>(EMPTY_FILTERS);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [radiusEnabled, setRadiusEnabled] = useState(true);
  const [searchRadius, setSearchRadius] = useState(25);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [mapCenter, setMapCenter] = useState<[number, number]>(() => {
    const opt = COUNTRY_OPTIONS.find((c) => c.code === getInitialCountry());
    return opt ? opt.center : [-25.2744, 133.7751];
  });
  const [mapZoom, setMapZoom] = useState(() => {
    const opt = COUNTRY_OPTIONS.find((c) => c.code === getInitialCountry());
    return opt ? opt.zoom : 5;
  });
  const [tripPickMode, setTripPickMode] = useState<"origin" | "destination" | null>(null);
  const [tripOrigin, setTripOrigin] = useState<TripPoint | null>(null);
  const [tripDestination, setTripDestination] = useState<TripPoint | null>(null);
  const [searchCircle, setSearchCircle] = useState<{ lat: number; lng: number; radius: number } | null>(null);
  const [tripStops, setTripStops] = useState<Station[]>([]);

  // Load favourites from localStorage (filters are NOT restored — they are country-specific)
  useEffect(() => {
    try {
      const savedFavs = localStorage.getItem("pitstop-favourites");
      if (savedFavs) setFavourites(JSON.parse(savedFavs));
    } catch {}
  }, []);

  // Load stations when country changes
  useEffect(() => {
    setLoading(true);
    setAllStations([]);
    setSelectedStation(null);
    fetchCountryStations(activeCountry).then((stations) => {
      const withStatus = stations.map((s) => ({
        ...s,
        status: getStationStatus(s) as StationStatus,
      }));
      setAllStations(withStatus);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [activeCountry]);

  const setActiveCountry = useCallback((c: CountryCode) => {
    setActiveCountryState(c);
    localStorage.setItem("pitstop-country", c);
    const opt = COUNTRY_OPTIONS.find((o) => o.code === c);
    if (opt) {
      setMapCenter(opt.center);
      setMapZoom(opt.zoom);
    }
    // Reset filters on country change
    setFiltersState(EMPTY_FILTERS);
    setSearchQuery("");
  }, []);

  // Detect user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setMapCenter([pos.coords.latitude, pos.coords.longitude]);
          setMapZoom(11);
        },
        () => {}
      );
    }
  }, []);

  const refreshStatus = useCallback(() => {
    setAllStations((prev) =>
      prev.map((s) => ({ ...s, status: getStationStatus(s) as StationStatus }))
    );
  }, []);

  // Refresh status every minute
  useEffect(() => {
    const interval = setInterval(refreshStatus, 60000);
    return () => clearInterval(interval);
  }, [refreshStatus]);

  const toggleFavourite = useCallback((id: string) => {
    setFavourites((prev) => {
      const next = prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id];
      localStorage.setItem("pitstop-favourites", JSON.stringify(next));
      return next;
    });
  }, []);

  const setFilters = useCallback((f: Filters) => {
    setFiltersState(f);
  }, []);

  // Compute filtered stations
  const filteredStations = useMemo(() => {
    let result = applyFilters(allStations, filters);
    result = searchStations(result, searchQuery);

    if (!showAll) {
      result = result.filter(
        (s) => s.status === "open" || s.status === "closing-soon"
      );
    }

    // Only apply radius filter if user is within reasonable distance of the country's center
    const countryCenter = COUNTRY_OPTIONS.find((c) => c.code === activeCountry)?.center;
    const userNearCountry = userLocation && countryCenter
      ? haversineDistance(userLocation.lat, userLocation.lng, countryCenter[0], countryCenter[1]) < 3000
      : false;

    if (userNearCountry && userLocation && radiusEnabled) {
      result = filterByRadius(
        result, userLocation.lat, userLocation.lng, searchRadius
      );
    } else if (userLocation) {
      result = sortByDistance(result, userLocation.lat, userLocation.lng);
    } else {
      result = sortByDistance(result, mapCenter[0], mapCenter[1]);
    }

    return result;
  }, [allStations, filters, searchQuery, showAll, radiusEnabled, userLocation, searchRadius, mapCenter, activeCountry]);

  return (
    <AppContext.Provider
      value={{
        allStations, filteredStations, selectedStation, favourites,
        filters, searchQuery, showAll, radiusEnabled, searchRadius, userLocation,
        loading, mapCenter, mapZoom, activeCountry,
        tripPickMode, tripOrigin, tripDestination, searchCircle, tripStops,
        setSelectedStation, toggleFavourite, setFilters,
        setSearchQuery, setShowAll, setRadiusEnabled, setSearchRadius,
        setUserLocation, setMapCenter, setMapZoom, refreshStatus,
        setActiveCountry,
        setTripPickMode, setTripOrigin, setTripDestination, setSearchCircle, setTripStops,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
