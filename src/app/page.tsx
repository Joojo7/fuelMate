"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import dynamic from "next/dynamic";
import SearchBar from "@/components/SearchBar";
import StationList from "@/components/StationList";
import StationDetail from "@/components/StationDetail";
import FilterPanel from "@/components/FilterPanel";
import TripPlanner from "@/components/TripPlanner";
import Favourites from "@/components/Favourites";

const MapView = dynamic(() => import("@/components/MapView"), { ssr: false });

type Tab = "map" | "list" | "trip" | "favourites";

export default function Home() {
  const { loading, selectedStation } = useApp();
  const [activeTab, setActiveTab] = useState<Tab>("map");
  const [showFilters, setShowFilters] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-bp-green border-t-transparent mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading BP stations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm z-50 px-4 py-2 flex items-center gap-3">
        <h1 className="text-lg font-bold text-bp-green whitespace-nowrap">⛽ FuelMate AU</h1>
        <div className="flex-1 max-w-md">
          <SearchBar />
        </div>
        <button className="btn btn-secondary text-xs" onClick={() => setShowFilters(!showFilters)}>
          Filters
        </button>
      </header>

      {/* Tab bar (mobile) */}
      <nav className="md:hidden flex border-b bg-white">
        {(["map", "list", "trip", "favourites"] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-xs font-semibold capitalize ${
              activeTab === tab ? "text-bp-green border-b-2 border-bp-green" : "text-gray-500"
            }`}
          >
            {tab === "favourites" ? "Favs" : tab}
          </button>
        ))}
      </nav>

      {/* Filter panel */}
      {showFilters && (
        <div className="absolute top-14 right-2 z-50 w-80 max-h-[70vh] overflow-y-auto panel">
          <FilterPanel onClose={() => setShowFilters(false)} />
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop sidebar */}
        <aside className="hidden md:flex flex-col w-96 border-r bg-white overflow-hidden">
          <nav className="flex border-b">
            {(["list", "trip", "favourites"] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 text-xs font-semibold capitalize ${
                  activeTab === tab || (activeTab === "map" && tab === "list")
                    ? "text-bp-green border-b-2 border-bp-green"
                    : "text-gray-500"
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
          <div className="flex-1 overflow-y-auto">
            {(activeTab === "list" || activeTab === "map") && <StationList />}
            {activeTab === "trip" && <TripPlanner />}
            {activeTab === "favourites" && <Favourites />}
          </div>
        </aside>

        {/* Map (always visible on desktop, tab on mobile) */}
        <div className={`flex-1 ${activeTab !== "map" ? "hidden md:block" : ""}`}>
          <MapView />
        </div>

        {/* Mobile-only panels */}
        <div className={`md:hidden flex-1 overflow-y-auto ${activeTab === "list" ? "" : "hidden"}`}>
          <StationList />
        </div>
        <div className={`md:hidden flex-1 overflow-y-auto ${activeTab === "trip" ? "" : "hidden"}`}>
          <TripPlanner />
        </div>
        <div className={`md:hidden flex-1 overflow-y-auto ${activeTab === "favourites" ? "" : "hidden"}`}>
          <Favourites />
        </div>
      </div>

      {/* Station detail overlay */}
      {selectedStation && (
        <div className="detail-overlay panel">
          <StationDetail />
        </div>
      )}
    </div>
  );
}
