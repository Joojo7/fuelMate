"use client";

import CountryPicker from "@/components/country-picker";
import DataStatusBanner from "@/components/data-status-banner";
import DisclaimerSplash from "@/components/disclaimer-splash";
import FuelPickerSplash from "@/components/fuel-picker-splash";
import OnboardingTour from "@/components/onboarding-tour";
import Favourites from "@/components/favourites";
import FilterPanel from "@/components/filter-panel";
import MapSkeleton from "@/components/map-skeleton";
import HudBrandDist from "@/components/hud-brand-dist";
import HudInsights from "@/components/hud-insights";
import HudStats from "@/components/hud-stats/hud-stats";
import HudStatusRing from "@/components/hud-status-ring";
import RightSidebarContent from "@/components/right-sidebar-content";
import SearchBar from "@/components/search-bar";
import SidebarTabs from "@/components/sidebar-tabs";
import StationDetail from "@/components/station-detail";
import StationList from "@/components/station-list";
import TripPlanner from "@/components/trip-planner";
import { useApp } from "@/context/AppContext";
import {
  BRAND_NAME,
  DETAIL_LABEL,
  FILTERS_LABEL,
  HUD_CLOSE, HUD_OPEN,
  DISCLAIMER_STORAGE_KEY,
  FUEL_PREF_STORAGE_KEY,
  MENU_ICON,
  type Tab, TAB_LABELS,
} from "@/lib/constants";
import { COUNTRY_OPTIONS } from "@/lib/types";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import styles from "./page.module.scss";

const MapView = dynamic(() => import("@/components/map-view"), { ssr: false });

export default function Home() {
  const { loading, selectedStation, filteredStations, mapCenter, activeCountry, setActiveCountry, lastFetchTime, fetchError, retryFetch, filters, setFilters } = useApp();
  const [activeTab, setActiveTab] = useState<Tab>("map");
  const [showFilters, setShowFilters] = useState(false);
  const [showLeftDrawer, setShowLeftDrawer] = useState(false);
  const [showRightDrawer, setShowRightDrawer] = useState(false);
  const [showHud, setShowHud] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [disclaimerState, setDisclaimerState] = useState<"pending" | "accepted" | "not_accepted">("pending");
  const [fuelPrefState, setFuelPrefState] = useState<"pending" | "done" | "not_done">("pending");

  useEffect(() => {
    setDisclaimerState(
      localStorage.getItem(DISCLAIMER_STORAGE_KEY) === "true" ? "accepted" : "not_accepted"
    );
    setFuelPrefState(
      localStorage.getItem(FUEL_PREF_STORAGE_KEY) ? "done" : "not_done"
    );
    if (window.innerWidth >= 1200) setShowFilters(true);
  }, []);

  const handleAcceptDisclaimer = useCallback(() => {
    localStorage.setItem(DISCLAIMER_STORAGE_KEY, "true");
    setDisclaimerState("accepted");
  }, []);

  const handleFuelPrefComplete = useCallback((selectedFuels: string[]) => {
    localStorage.setItem(FUEL_PREF_STORAGE_KEY, JSON.stringify(selectedFuels));
    if (selectedFuels.length > 0) {
      setFilters({ ...filters, fuels: selectedFuels });
    }
    setFuelPrefState("done");
  }, [filters, setFilters]);

  const activeCountryLabel = COUNTRY_OPTIONS.find((c) => c.code === activeCountry)?.label ?? activeCountry;

  const countryPickerProps = {
    activeCountry,
    activeCountryLabel,
    showCountryPicker,
    setShowCountryPicker,
    setActiveCountry,
  };

  const showOverlay = disclaimerState === "pending" || disclaimerState === "not_accepted" || fuelPrefState === "not_done";

  return (
    <div className="d-flex flex-column vh-100">
      {disclaimerState === "pending" && (
        <div className="d-flex align-items-center justify-content-center vh-100" style={{ position: "fixed", inset: 0, zIndex: 9999, background: "#0a0a0a" }}>
          <div className="tm-loading-spinner mx-auto" />
        </div>
      )}

      {disclaimerState === "not_accepted" && (
        <DisclaimerSplash onAccept={handleAcceptDisclaimer} />
      )}

      {disclaimerState === "accepted" && fuelPrefState === "not_done" && (
        <FuelPickerSplash onComplete={handleFuelPrefComplete} />
      )}


      {!showOverlay && <OnboardingTour />}
      {/* Header — mobile: stacked brand + search row; md+: single row */}
      <header className={`tm-navbar tm-scanline ${styles["header"]}`}>
        {/* Mobile: brand + country picker row */}
        <div className={`d-md-none ${styles["mobile-brand-row"]}`}>
          <h1 className={`mb-0 text-primary-green text-nowrap fw-bold ${styles.brand}`}>
            {BRAND_NAME}
          </h1>
          <CountryPicker {...countryPickerProps} />
        </div>

        {/* Mobile: search row */}
        <div className={`d-md-none ${styles["mobile-search-row"]}`}>
          <SearchBar
            trailing={
              <button
                className={`btn-terminal ${styles["mobile-menu-toggle"]}`}
                onClick={() => setShowMobileMenu(!showMobileMenu)}
              >
                {MENU_ICON}
              </button>
            }
          />
        </div>

        {/* Tablet/Desktop: single row (hidden on mobile) */}
        <div className={`d-none d-md-flex align-items-center gap-3 ${styles["desktop-row"]}`}>
          <button
            className={`btn-terminal d-md-inline-block d-xl-none ${styles["tablet-toggle"]}`}
            onClick={() => { setShowLeftDrawer(!showLeftDrawer); setShowRightDrawer(false); }}
          >
            {MENU_ICON}
          </button>

          <h1 className={`mb-0 text-primary-green text-nowrap fw-bold ${styles.brand}`} data-tour="brand">
            {BRAND_NAME}
          </h1>

          <div data-tour="country">
            <CountryPicker {...countryPickerProps} />
          </div>

          <div className={`flex-grow-1 ${styles["search-wrapper"]}`} data-tour="search">
            <SearchBar />
          </div>

          <div className={styles["hud-readout"]}>
            LAT: {mapCenter[0].toFixed(4)} | LNG: {mapCenter[1].toFixed(4)} | TARGETS: {filteredStations.length} | <Link href="/privacy" className={styles["legal-link"]}>LEGAL</Link>
          </div>

          <button
            className={`btn-terminal d-md-inline-block d-xl-none ${styles["tablet-toggle"]}`}
            onClick={() => { setShowRightDrawer(!showRightDrawer); setShowLeftDrawer(false); }}
          >
            {selectedStation ? DETAIL_LABEL : FILTERS_LABEL}
          </button>

          <button
            className="btn-terminal d-none d-xl-inline-block"
            onClick={() => setShowFilters(!showFilters)}
            data-tour="filters"
          >
            {FILTERS_LABEL}
          </button>
        </div>
      </header>

      <DataStatusBanner fetchError={fetchError} retryFetch={retryFetch} lastFetchTime={lastFetchTime} />

      {/* Mobile dropdown menu */}
      {showMobileMenu && (
        <div className={`d-md-none ${styles["mobile-menu"]}`}>
          <div className={styles["mobile-menu-row"]}>
            <span className={styles["mobile-menu-label"]}>COORDS</span>
            <span className={styles["mobile-menu-readout"]}>
              LAT: {mapCenter[0].toFixed(4)} | LNG: {mapCenter[1].toFixed(4)}
            </span>
          </div>
          <div className={styles["mobile-menu-row"]}>
            <span className={styles["mobile-menu-label"]}>TARGETS</span>
            <span className={styles["mobile-menu-readout"]}>{filteredStations.length}</span>
          </div>
          <div className="d-flex gap-2 pt-1">
            <button
              className="btn-terminal flex-grow-1"
              onClick={() => { setShowFilters(!showFilters); setShowMobileMenu(false); }}
            >
              {FILTERS_LABEL}
            </button>
          </div>
        </div>
      )}

      {/* Tab bar (mobile only) */}
      <ul className="nav nav-tabs d-md-none">
        {(["map", "list", "trip", "favourites"] as Tab[]).map((tab) => (
          <li className="nav-item" key={tab}>
            <button
              className={`nav-link fs-8 ${activeTab === tab ? "active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {TAB_LABELS[tab]}
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
            <SidebarTabs
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              onSwitchToMap={() => { setActiveTab("map"); setShowLeftDrawer(false); }}
            />
          </aside>
        </>
      )}

      {showRightDrawer && (
        <>
          <div className={`d-none d-md-block d-xl-none ${styles["tablet-backdrop"]}`} onClick={() => setShowRightDrawer(false)} />
          <aside className={`d-none d-md-flex d-xl-none flex-column bg-primary-bg tm-hud-grid ${styles["tablet-drawer-right"]}`}>
            <RightSidebarContent showFilters={showFilters} setShowFilters={setShowFilters} selectedStation={selectedStation} />
          </aside>
        </>
      )}

      {/* Main content */}
      <div className="d-flex flex-grow-1 overflow-hidden">
        {/* Desktop left sidebar (xl+) */}
        <aside className={`d-none d-xl-flex flex-column overflow-hidden border-end border-divider bg-primary-bg tm-hud-grid ${styles.sidebar}`} data-tour="tabs">
          <SidebarTabs
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onSwitchToMap={() => setActiveTab("map")}
          />
        </aside>

        {/* Map — always visible on md+, conditional on mobile */}
        <div className={`flex-grow-1 position-relative ${activeTab !== "map" ? "d-none d-md-block" : ""}`} data-tour="map">
          {loading && <MapSkeleton />}
          <MapView />

          {/* HUD status ring — desktop, docked to right beside sidebar */}
          <div className={`d-none d-xl-block ${styles["hud-status-dock"]}`}>
            <HudStatusRing />
          </div>

          {/* HUD overlays — desktop (xl+) */}
          <div className={`d-none d-xl-flex ${styles["hud-overlay"]}`} data-tour="hud">
            <div className="row g-2">
              <div className="col-4">
                <HudBrandDist />
              </div>
            </div>
            <div className="row g-2">
              <div className="col-xl-6">
                <HudStats />
              </div>
              <div className="col-xl-6">
                <HudInsights />
              </div>
            </div>
          </div>

          {/* HUD overlays — mobile + tablet toggleable */}
          {showHud && (
            <div className={`d-xl-none ${styles["hud-overlay"]}`}>
              <div className="row g-2">
                <div className="col-12">
                  <HudStatusRing />
                </div>
                <div className="col-12">
                  <HudBrandDist />
                </div>
                <div className="col-12">
                  <HudStats />
                </div>
                <div className="col-12">
                  <HudInsights />
                </div>
              </div>
            </div>
          )}

          {/* HUD toggle button — mobile + tablet */}
          <button
            className={`d-flex d-xl-none ${styles["hud-toggle"]}`}
            onClick={() => setShowHud(!showHud)}
          >
            {showHud ? HUD_CLOSE : HUD_OPEN}
          </button>
        </div>

        {/* Desktop right sidebar (xl+) */}
        <aside className={`d-none d-xl-flex flex-column overflow-hidden border-start border-divider bg-primary-bg tm-hud-grid ${styles["right-sidebar"]}`}>
          <RightSidebarContent showFilters={showFilters} setShowFilters={setShowFilters} selectedStation={selectedStation} />
        </aside>

        {/* Mobile-only panels */}
        <div className={`d-md-none flex-grow-1 overflow-auto ${activeTab === "list" ? "" : "d-none"}`}>
          <StationList onSwitchToMap={() => setActiveTab("map")} />
        </div>
        <div className={`d-md-none flex-grow-1 overflow-auto ${activeTab === "trip" ? "" : "d-none"}`}>
          <TripPlanner onSwitchToMap={() => setActiveTab("map")} />
        </div>
        <div className={`d-md-none flex-grow-1 overflow-auto ${activeTab === "favourites" ? "" : "d-none"}`}>
          <Favourites onSwitchToMap={() => setActiveTab("map")} />
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
