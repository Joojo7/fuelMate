"use client";

import Favourites from "@/components/favourites";
import FilterPanel from "@/components/filter-panel";
import SearchBar from "@/components/search-bar";
import StationDetail from "@/components/station-detail";
import StationList from "@/components/station-list";
import TripPlanner from "@/components/trip-planner";
import { useApp } from "@/context/AppContext";
import dynamic from "next/dynamic";
import { useState } from "react";
import styles from "./page.module.scss";

const MapView = dynamic(() => import("@/components/map-view"), { ssr: false });

type Tab = "map" | "list" | "trip" | "favourites";

export default function Home() {
  const { loading, selectedStation } = useApp();
  const [activeTab, setActiveTab] = useState<Tab>("map");
  const [showFilters, setShowFilters] = useState(false);

  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center vh-100">
        <div className="text-center">
          <div className="tm-loading-spinner mx-auto mb-3" />
          <div className="text-primary-green fs-5">
            Loading stations<span className="tm-blink">...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex flex-column vh-100">
      {/* Header */}
      <header className="tm-navbar d-flex align-items-center gap-3 tm-scanline">
        <h1 className={`mb-0 text-primary-green text-nowrap fw-bold ${styles.brand}`}>
          [PITTSTOP]
        </h1>
        <div className={`flex-grow-1 ${styles["search-wrapper"]}`}>
          <SearchBar />
        </div>
        <button
          className="btn-terminal"
          onClick={() => setShowFilters(!showFilters)}
        >
          FILTERS
        </button>
      </header>

      {/* Tab bar (mobile) */}
      <ul className="nav nav-tabs d-md-none">
        {(["map", "list", "trip", "favourites"] as Tab[]).map((tab) => (
          <li className="nav-item" key={tab}>
            <button
              className={`nav-link fs-8 ${activeTab === tab ? "active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === "map" ? "Map" : tab === "list" ? "Stations" : tab === "trip" ? "Trip Planner" : "Favourites"}
            </button>
          </li>
        ))}
      </ul>

      {/* Filter panel */}
      {showFilters && (
        <div className={`tm-panel position-absolute ${styles["filter-dropdown"]}`}>
          <FilterPanel onClose={() => setShowFilters(false)} />
        </div>
      )}

      {/* Main content */}
      <div className="d-flex flex-grow-1 overflow-hidden">
        {/* Desktop sidebar */}
        <aside className={`d-none d-md-flex flex-column overflow-hidden border-end border-divider bg-primary-bg ${styles.sidebar}`}>
          <ul className="nav nav-tabs">
            {(["list", "trip", "favourites"] as Tab[]).map((tab) => (
              <li className="nav-item" key={tab}>
                <button
                  className={`nav-link ${activeTab === tab || (activeTab === "map" && tab === "list") ? "active" : ""}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab === "list" ? "Stations" : tab === "trip" ? "Trip Planner" : "Favourites"}
                </button>
              </li>
            ))}
          </ul>
          <div className="flex-grow-1 overflow-auto">
            {(activeTab === "list" || activeTab === "map") && <StationList />}
            {activeTab === "trip" && <TripPlanner onSwitchToMap={() => setActiveTab("map")} />}
            {activeTab === "favourites" && <Favourites />}
          </div>
        </aside>

        {/* Map */}
        <div className={`flex-grow-1 ${activeTab !== "map" ? "d-none d-md-block" : ""}`}>
          <MapView />
        </div>

        {/* Mobile-only panels */}
        <div className={`d-md-none flex-grow-1 overflow-auto ${activeTab === "list" ? "" : "d-none"}`}>
          <StationList />
        </div>
        <div className={`d-md-none flex-grow-1 overflow-auto ${activeTab === "trip" ? "" : "d-none"}`}>
          <TripPlanner onSwitchToMap={() => setActiveTab("map")} />
        </div>
        <div className={`d-md-none flex-grow-1 overflow-auto ${activeTab === "favourites" ? "" : "d-none"}`}>
          <Favourites />
        </div>
      </div>

      {/* Station detail overlay */}
      {selectedStation && (
        <div className="tm-detail-overlay">
          <StationDetail />
        </div>
      )}
    </div>
  );
}
