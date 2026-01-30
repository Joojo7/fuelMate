"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { Station, Filters, StationStatus } from "@/lib/types";
import { fetchStations } from "@/lib/parseCSV";
import { getStationStatus, applyFilters, searchStations, sortByDistance, filterByRadius } from "@/lib/stationUtils";

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
}

const AppContext = createContext<AppContextValue | null>(null);

const EMPTY_FILTERS: Filters = {
  fuels: [], ev: [], foodDrink: [], vehicleServices: [],
  truckAmenities: [], convenience: [], loyalty: [],
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

  // Compute filtered stations
  let filteredStations = allStations;
  filteredStations = applyFilters(filteredStations, filters);
  filteredStations = searchStations(filteredStations, searchQuery);

  if (!showAll) {
    filteredStations = filteredStations.filter(
      (s) => s.status === "open" || s.status === "closing-soon"
    );
  }

  if (userLocation) {
    filteredStations = filterByRadius(
      filteredStations, userLocation.lat, userLocation.lng, searchRadius
    );
  } else {
    filteredStations = sortByDistance(filteredStations, mapCenter[0], mapCenter[1]);
  }

  return (
    <AppContext.Provider
      value={{
        allStations, filteredStations, selectedStation, favourites,
        filters, searchQuery, showAll, searchRadius, userLocation,
        loading, mapCenter, mapZoom,
        setSelectedStation, toggleFavourite, setFilters,
        setSearchQuery, setShowAll, setSearchRadius,
        setUserLocation, setMapCenter, setMapZoom, refreshStatus,
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
