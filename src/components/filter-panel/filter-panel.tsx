"use client";

import React, { useState } from "react";
import { CaretDown } from "@phosphor-icons/react";
import { useApp } from "@/context/AppContext";
import {
  Filters, FUEL_OPTIONS, EV_OPTIONS, FOOD_DRINK_OPTIONS,
  VEHICLE_SERVICE_OPTIONS, TRUCK_OPTIONS, CONVENIENCE_OPTIONS, LOYALTY_OPTIONS,
  SITE_TYPE_OPTIONS, ACCESSIBILITY_OPTIONS, REGION_OPTIONS_BY_COUNTRY, BRAND_OPTIONS,
  BRAND_LABELS, BRAND_COLORS,
} from "@/lib/types";
import styles from "./index.module.scss";

function FilterGroup({
  title, options, selected, onChange, defaultOpen = false,
}: {
  title: string; options: string[]; selected: string[];
  onChange: (selected: string[]) => void;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const toggle = (opt: string) => {
    onChange(
      selected.includes(opt) ? selected.filter((s) => s !== opt) : [...selected, opt]
    );
  };

  return (
    <div className="mb-2">
      <button
        className={styles["group-header"]}
        onClick={() => setOpen(!open)}
      >
        <span>
          {title}
          {selected.length > 0 && (
            <span className={styles["group-count"]}>{selected.length}</span>
          )}
        </span>
        <CaretDown
          size={14}
          className={`${styles["group-chevron"]} ${open ? styles["group-chevron-open"] : ""}`}
        />
      </button>
      {open && (
        <div className="d-flex flex-wrap gap-1 pt-1 pb-1">
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => toggle(opt)}
              className={`tm-chip clickable ${selected.includes(opt) ? "tm-chip-active" : ""}`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function FilterPanel({ onClose }: { onClose: () => void }) {
  const { filters, setFilters, showAll, setShowAll, activeCountry, allStations } = useApp();

  const update = (key: keyof Filters, val: string[]) => {
    setFilters({ ...filters, [key]: val });
  };

  const clearAll = () => {
    setFilters({
      brand: [], region: [], fuels: [], ev: [], foodDrink: [], vehicleServices: [],
      truckAmenities: [], convenience: [], loyalty: [],
      siteType: [], accessibility: [],
    });
  };

  const brandOptions = BRAND_OPTIONS[activeCountry] || [];
  // Build region options: hardcoded list + extra regions from current country's data only
  const baseRegions = REGION_OPTIONS_BY_COUNTRY[activeCountry] || [];
  const countryStations = allStations.filter((s) => s.country_code === activeCountry || (activeCountry === "AU" && (s.country_code === "AU" || s.country_code === "NZ")));
  const dataRegions = Array.from(new Set(countryStations.map((s) => s.state).filter(Boolean)));
  const regionOptions: string[] = [...baseRegions, ...dataRegions.filter((r) => !baseRegions.includes(r))];

  return (
    <div className={styles["filter-container"]}>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <span className="tm-section-title mb-0 border-0 pb-0">Filters</span>
        <div className="d-flex gap-2">
          <button onClick={clearAll} className={`btn-terminal btn-terminal-danger ${styles["clear-btn"]}`}>
            Clear All
          </button>
          <button onClick={onClose} className={styles["close-btn"]}>&times;</button>
        </div>
      </div>

      <div className={styles["filter-scroll"]}>
        <div className={`d-flex align-items-center justify-content-between mb-2 pb-2 ${styles["open-now-row"]}`}>
          <span className={styles["open-now-label"]}>OPEN NOW</span>
          <button
            className={`btn-terminal ${!showAll ? "btn-terminal-filled" : ""} ${styles["open-now-btn"]}`}
            onClick={() => setShowAll(!showAll)}
          >
            {!showAll ? "ON" : "OFF"}
          </button>
        </div>
        {brandOptions.length > 1 && (
          <div className="mb-2">
            <div className={styles["group-header"]} style={{ cursor: "default" }}>
              <span>BRAND{(filters.brand || []).length > 0 && (
                <span className={styles["group-count"]}>{(filters.brand || []).length}</span>
              )}</span>
            </div>
            <div className="d-flex flex-wrap gap-1 pt-1 pb-1">
              {brandOptions.map((b) => {
                const isActive = (filters.brand || []).includes(b);
                const bc = BRAND_COLORS[b];
                return (
                  <button
                    key={b}
                    onClick={() => {
                      const cur = filters.brand || [];
                      update("brand", cur.includes(b) ? cur.filter((x) => x !== b) : [...cur, b]);
                    }}
                    className="tm-chip clickable"
                    style={isActive && bc ? {
                      background: `${bc.primary}22`,
                      color: bc.primary,
                      borderColor: `${bc.primary}66`,
                      boxShadow: `0 0 6px ${bc.primary}33`,
                    } : undefined}
                  >
                    {BRAND_LABELS[b] || b}
                  </button>
                );
              })}
            </div>
          </div>
        )}
        <FilterGroup title="REGION" options={regionOptions} selected={filters.region || []} onChange={(v) => update("region", v)} defaultOpen />
        <FilterGroup title="FUEL TYPE" options={FUEL_OPTIONS} selected={filters.fuels} onChange={(v) => update("fuels", v)} />
        <FilterGroup title="EV" options={EV_OPTIONS} selected={filters.ev} onChange={(v) => update("ev", v)} />
        <FilterGroup title="FOOD & DRINK" options={FOOD_DRINK_OPTIONS} selected={filters.foodDrink} onChange={(v) => update("foodDrink", v)} />
        <FilterGroup title="VEHICLE SERVICES" options={VEHICLE_SERVICE_OPTIONS} selected={filters.vehicleServices} onChange={(v) => update("vehicleServices", v)} />
        <FilterGroup title="TRUCK AMENITIES" options={TRUCK_OPTIONS} selected={filters.truckAmenities} onChange={(v) => update("truckAmenities", v)} />
        <FilterGroup title="CONVENIENCE" options={CONVENIENCE_OPTIONS} selected={filters.convenience} onChange={(v) => update("convenience", v)} />
        <FilterGroup title="LOYALTY & PAYMENTS" options={LOYALTY_OPTIONS} selected={filters.loyalty} onChange={(v) => update("loyalty", v)} />
        <FilterGroup title="SITE TYPE" options={SITE_TYPE_OPTIONS} selected={filters.siteType || []} onChange={(v) => update("siteType", v)} />
        <FilterGroup title="ACCESSIBILITY" options={ACCESSIBILITY_OPTIONS} selected={filters.accessibility || []} onChange={(v) => update("accessibility", v)} />
      </div>
    </div>
  );
}
