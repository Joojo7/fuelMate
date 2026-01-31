"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from "react";
import { Station, Filters, StationStatus } from "@/lib/types";
import { fetchStations } from "@/lib/parseCSV";
import { getStationStatus, applyFilters, searchStations, sortByDistance, filterByRadius } from "@/lib/stationUtils";

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
  searchRadius: number;
  userLocation: { lat: number; lng: number } | null;
  loading: boolean;
  mapCenter: [number, number];
  mapZoom: number;
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
  setSearchRadius: (r: number) => void;
  setUserLocation: (loc: { lat: number; lng: number } | null) => void;
  setMapCenter: (c: [number, number]) => void;
  setMapZoom: (z: number) => void;
  refreshStatus: () => void;
  setTripPickMode: (m: "origin" | "destination" | null) => void;
  setTripOrigin: (p: TripPoint | null) => void;
  setTripDestination: (p: TripPoint | null) => void;
  setSearchCircle: (c: { lat: number; lng: number; radius: number } | null) => void;
  setTripStops: (stops: Station[]) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

const EMPTY_FILTERS: Filters = {
  region: [], fuels: [], ev: [], foodDrink: [], vehicleServices: [],
  truckAmenities: [], convenience: [], loyalty: [],
  siteType: [], accessibility: [],
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [allStations, setAllStations] = useState<Station[]>([]);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [favourites, setFavourites] = useState<string[]>([]);
  const [filters, setFiltersState] = useState<Filters>(EMPTY_FILTERS);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [searchRadius, setSearchRadius] = useState(25);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [mapCenter, setMapCenter] = useState<[number, number]>([-25.2744, 133.7751]);
  const [mapZoom, setMapZoom] = useState(5);
  const [tripPickMode, setTripPickMode] = useState<"origin" | "destination" | null>(null);
  const [tripOrigin, setTripOrigin] = useState<TripPoint | null>(null);
  const [tripDestination, setTripDestination] = useState<TripPoint | null>(null);
  const [searchCircle, setSearchCircle] = useState<{ lat: number; lng: number; radius: number } | null>(null);
  const [tripStops, setTripStops] = useState<Station[]>([]);

  // Load favourites and filters from localStorage
  useEffect(() => {
    try {
      const savedFavs = localStorage.getItem("fuelmate-favourites");
      if (savedFavs) setFavourites(JSON.parse(savedFavs));
      const savedFilters = localStorage.getItem("fuelmate-filters");
      if (savedFilters) setFiltersState(JSON.parse(savedFilters));
    } catch {}
  }, []);

  // Load stations
  useEffect(() => {
    fetchStations().then((stations) => {
      const withStatus = stations.map((s) => ({
        ...s,
        status: getStationStatus(s) as StationStatus,
      }));
      setAllStations(withStatus);
      setLoading(false);
    }).catch(() => setLoading(false));
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
      localStorage.setItem("fuelmate-favourites", JSON.stringify(next));
      return next;
    });
  }, []);

  const setFilters = useCallback((f: Filters) => {
    setFiltersState(f);
    localStorage.setItem("fuelmate-filters", JSON.stringify(f));
  }, []);

  // Compute filtered stations (memoized to avoid unnecessary re-renders)
  const filteredStations = useMemo(() => {
    let result = applyFilters(allStations, filters);
    result = searchStations(result, searchQuery);

    if (!showAll) {
      result = result.filter(
        (s) => s.status === "open" || s.status === "closing-soon"
      );
    }

    if (userLocation && !showAll) {
      result = filterByRadius(
        result, userLocation.lat, userLocation.lng, searchRadius
      );
    } else if (userLocation) {
      result = sortByDistance(result, userLocation.lat, userLocation.lng);
    } else {
      result = sortByDistance(result, mapCenter[0], mapCenter[1]);
    }

    return result;
  }, [allStations, filters, searchQuery, showAll, userLocation, searchRadius, mapCenter]);

  return (
    <AppContext.Provider
      value={{
        allStations, filteredStations, selectedStation, favourites,
        filters, searchQuery, showAll, searchRadius, userLocation,
        loading, mapCenter, mapZoom,
        tripPickMode, tripOrigin, tripDestination, searchCircle, tripStops,
        setSelectedStation, toggleFavourite, setFilters,
        setSearchQuery, setShowAll, setSearchRadius,
        setUserLocation, setMapCenter, setMapZoom, refreshStatus,
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
