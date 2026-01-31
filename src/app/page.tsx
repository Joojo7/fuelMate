"use client";

import Favourites from "@/components/favourites";
import FilterPanel from "@/components/filter-panel";
import HudGlobe from "@/components/hud-globe/hud-globe";
import HudInsights from "@/components/hud-insights";
import HudStats from "@/components/hud-stats/hud-stats";
import HudStatusRing from "@/components/hud-status-ring";
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
  const { loading, selectedStation, filteredStations, mapCenter } = useApp();
  const [activeTab, setActiveTab] = useState<Tab>("map");
  const [showFilters, setShowFilters] = useState(false);
  const [showLeftDrawer, setShowLeftDrawer] = useState(false);
  const [showRightDrawer, setShowRightDrawer] = useState(false);
  const [showHud, setShowHud] = useState(false);

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
        {/* Tablet drawer toggle — left */}
        <button
          className={`btn-terminal d-none d-md-inline-block d-xl-none ${styles["tablet-toggle"]}`}
          onClick={() => { setShowLeftDrawer(!showLeftDrawer); setShowRightDrawer(false); }}
        >
          ☰
        </button>

        <h1 className={`mb-0 text-primary-green text-nowrap fw-bold ${styles.brand}`}>
          [P\TST/P]
        </h1>
        <div className={`flex-grow-1 ${styles["search-wrapper"]}`}>
          <SearchBar />
        </div>
        <div className={styles["hud-readout"]}>
          LAT: {mapCenter[0].toFixed(4)} | LNG: {mapCenter[1].toFixed(4)} | TARGETS: {filteredStations.length}
        </div>

        {/* Tablet drawer toggle — right (filters/detail) */}
        <button
          className={`btn-terminal d-none d-md-inline-block d-xl-none ${styles["tablet-toggle"]}`}
          onClick={() => { setShowRightDrawer(!showRightDrawer); setShowLeftDrawer(false); }}
        >
          {selectedStation ? "DETAIL" : "FILTERS"}
        </button>

        {/* Desktop filter button (mobile + tablet use drawers) */}
        <button
          className="btn-terminal d-md-none"
          onClick={() => setShowFilters(!showFilters)}
        >
          FILTERS
        </button>
        <button
          className="btn-terminal d-none d-xl-inline-block"
          onClick={() => setShowFilters(!showFilters)}
        >
          FILTERS
        </button>
      </header>

      {/* Tab bar (mobile only) */}
      <ul className="nav nav-tabs d-md-none">
        {(["map", "list", "trip", "favourites"] as Tab[]).map((tab) => (
          <li className="nav-item" key={tab}>
            <button
              className={`nav-link fs-8 ${activeTab === tab ? "active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === "map" ? "Radar" : tab === "list" ? "Targets" : tab === "trip" ? "Mission" : "Tracked"}
            </button>
          </li>
        ))}
      </ul>

      {/* Filter panel (mobile dropdown) */}
      {showFilters && (
        <div className={`tm-panel position-absolute d-xl-none ${styles["filter-dropdown"]}`}>
          <FilterPanel onClose={() => setShowFilters(false)} />
        </div>
      )}

      {/* ── Tablet drawers (md–xl only) ─────────────── */}
      {showLeftDrawer && (
        <>
          <div className={`d-none d-md-block d-xl-none ${styles["tablet-backdrop"]}`} onClick={() => setShowLeftDrawer(false)} />
          <aside className={`d-none d-md-flex d-xl-none flex-column bg-primary-bg tm-hud-grid ${styles["tablet-drawer-left"]}`}>
            <HudGlobe />
            <ul className="nav nav-tabs">
              {(["list", "trip", "favourites"] as Tab[]).map((tab) => (
                <li className="nav-item" key={tab}>
                  <button
                    className={`nav-link ${activeTab === tab || (activeTab === "map" && tab === "list") ? "active" : ""}`}
                    onClick={() => setActiveTab(tab)}
                  >
                    {tab === "list" ? "Targets" : tab === "trip" ? "Mission" : "Tracked"}
                  </button>
                </li>
              ))}
            </ul>
            <div className="flex-grow-1 overflow-auto">
              {(activeTab === "list" || activeTab === "map") && <StationList />}
              {activeTab === "trip" && <TripPlanner onSwitchToMap={() => { setActiveTab("map"); setShowLeftDrawer(false); }} />}
              {activeTab === "favourites" && <Favourites />}
            </div>
          </aside>
        </>
      )}

      {showRightDrawer && (
        <>
          <div className={`d-none d-md-block d-xl-none ${styles["tablet-backdrop"]}`} onClick={() => setShowRightDrawer(false)} />
          <aside className={`d-none d-md-flex d-xl-none flex-column bg-primary-bg tm-hud-grid ${styles["tablet-drawer-right"]}`}>
            <div className={`${styles["right-sidebar-section"]} ${showFilters ? styles["right-sidebar-section--expanded"] : ""}`}>
              <button
                className={`btn-terminal w-100 ${styles["filter-toggle"]}`}
                onClick={() => setShowFilters(!showFilters)}
              >
                {showFilters ? "▾ FILTERS" : "▸ FILTERS"}
              </button>
              {showFilters && (
                <div className="overflow-auto p-2">
                  <FilterPanel onClose={() => setShowFilters(false)} />
                </div>
              )}
            </div>
            <div className="flex-grow-1 overflow-auto">
              {selectedStation ? (
                <div className="p-3">
                  <StationDetail />
                </div>
              ) : (
                <div className="d-flex align-items-center justify-content-center h-100 text-sub fs-8">
                  Select a station to view details
                </div>
              )}
            </div>
          </aside>
        </>
      )}

      {/* Main content */}
      <div className="d-flex flex-grow-1 overflow-hidden">
        {/* Desktop left sidebar (xl+) */}
        <aside className={`d-none d-xl-flex flex-column overflow-hidden border-end border-divider bg-primary-bg tm-hud-grid ${styles.sidebar}`}>
          <HudGlobe />
          <ul className="nav nav-tabs">
            {(["list", "trip", "favourites"] as Tab[]).map((tab) => (
              <li className="nav-item" key={tab}>
                <button
                  className={`nav-link ${activeTab === tab || (activeTab === "map" && tab === "list") ? "active" : ""}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab === "list" ? "Targets" : tab === "trip" ? "Mission" : "Tracked"}
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

        {/* Map — always visible on md+, conditional on mobile */}
        <div className={`flex-grow-1 position-relative ${activeTab !== "map" ? "d-none d-md-block" : ""}`}>
          <MapView />

          {/* HUD overlays — desktop (xl+) always visible */}
          <div className="d-none d-xl-block">
            <HudStatusRing />
            <HudStats />
            <HudInsights />
          </div>

          {/* HUD overlays — mobile + tablet toggleable */}
          {showHud && (
            <div className={`d-xl-none ${styles["tablet-hud-panel"]}`}>
              <HudStatusRing />
              <HudStats />
              <HudInsights />
            </div>
          )}

          {/* HUD toggle button — mobile + tablet */}
          <button
            className={`d-flex d-xl-none ${styles["hud-toggle"]}`}
            onClick={() => setShowHud(!showHud)}
          >
            {showHud ? "✕ HUD" : "◈ HUD"}
          </button>
        </div>

        {/* Desktop right sidebar (xl+) */}
        <aside className={`d-none d-xl-flex flex-column overflow-hidden border-start border-divider bg-primary-bg tm-hud-grid ${styles["right-sidebar"]}`}>
          <div className={`${styles["right-sidebar-section"]} ${showFilters ? styles["right-sidebar-section--expanded"] : ""}`}>
            <button
              className={`btn-terminal w-100 ${styles["filter-toggle"]}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              {showFilters ? "▾ FILTERS" : "▸ FILTERS"}
            </button>
            {showFilters && (
              <div className="overflow-auto p-2">
                <FilterPanel onClose={() => setShowFilters(false)} />
              </div>
            )}
          </div>
          <div className="flex-grow-1 overflow-auto">
            {selectedStation ? (
              <div className="p-3">
                <StationDetail />
              </div>
            ) : (
              <div className="d-flex align-items-center justify-content-center h-100 text-sub fs-8">
                Select a station to view details
              </div>
            )}
          </div>
        </aside>

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

      {/* Station detail overlay (mobile + tablet) */}
      {selectedStation && (
        <div className="tm-detail-overlay d-xl-none">
          <StationDetail />
        </div>
      )}
    </div>
  );
}
