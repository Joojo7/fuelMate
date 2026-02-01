"use client";

import React, { useDeferredValue } from "react";
import { useApp } from "@/context/AppContext";
import StationListSkeleton from "@/components/station-list-skeleton";
import { BRAND_LABELS, BRAND_COLORS } from "@/lib/types";
import { getTimeUntilClose, getNextOpenTime } from "@/lib/stationUtils";
import styles from "./index.module.scss";

const QUICK_FILTERS: { label: string; fuelKey?: string; evKey?: string }[] = [
  { label: "Unleaded", fuelKey: "Unleaded 91" },
  { label: "Diesel", fuelKey: "Diesel" },
  { label: "Premium", fuelKey: "Unleaded 98" },
  { label: "EV", evKey: "EV Charging" },
];

function getFuelClass(fuel: string): string {
  const f = fuel.toLowerCase();
  if (f.includes("diesel") || f.includes("ultimate diesel")) return "tm-fuel-diesel";
  if (f.includes("ev") || f.includes("pulse") || f.includes("charge")) return "tm-fuel-ev";
  if (f.includes("autogas") || f.includes("lpg")) return "tm-fuel-gas";
  if (f.includes("adblue")) return "tm-fuel-adblue";
  return "tm-fuel-unleaded";
}

function getFuelLabel(fuel: string): string {
  if (fuel === "Unleaded 91") return "ULP 91";
  if (fuel === "Unleaded 95") return "ULP 95";
  if (fuel === "Unleaded 98") return "ULP 98";
  if (fuel === "E10") return "E10";
  if (fuel === "Diesel") return "Diesel";
  if (fuel === "Premium Diesel") return "Prem. Diesel";
  if (fuel === "LPG / Autogas") return "LPG";
  if (fuel === "AdBlue") return "AdBlue";
  if (fuel === "LPG Bottles") return "LPG Bottles";
  if (fuel === "EV Charging") return "EV";
  if (fuel === "Kerosene") return "Kerosene";
  if (fuel === "Engine Oil") return "Oil";
  if (fuel === "Fuel Additive") return "Additive";
  return fuel;
}

const AMENITY_ICONS: Record<string, string> = {
  "Wifi": "WiFi",
  "Toilets": "WC",
  "ATM": "ATM",
  "Car Wash": "Wash",
  "EV Charging": "EV",
  "bp pulse": "EV",
  "Shower": "🚿",
  "Wildbean Cafe": "Café",
  "Fast Food": "Food",
};

export default function StationList({ onSwitchToMap }: { onSwitchToMap?: () => void } = {}) {
  const { filteredStations, loading, setSelectedStation, setMapCenter, setMapZoom, filters, setFilters } = useApp();
  const deferredStations = useDeferredValue(filteredStations);
  const isStale = deferredStations !== filteredStations;

  const handleClick = (station: typeof filteredStations[0]) => {
    setSelectedStation(station);
    setMapCenter([station.lat, station.lng]);
    setMapZoom(15);
    onSwitchToMap?.();
  };

  const toggleQuickFilter = (qf: typeof QUICK_FILTERS[0]) => {
    if (qf.evKey) {
      const active = filters.ev.includes(qf.evKey);
      setFilters({ ...filters, ev: active ? filters.ev.filter((e) => e !== qf.evKey) : [...filters.ev, qf.evKey] });
    } else if (qf.fuelKey) {
      const active = filters.fuels.includes(qf.fuelKey);
      setFilters({ ...filters, fuels: active ? filters.fuels.filter((f) => f !== qf.fuelKey) : [...filters.fuels, qf.fuelKey] });
    }
  };

  if (loading) return <StationListSkeleton />;

  return (
    <div>
      {/* Quick filters */}
      <div className={`px-3 py-2 d-flex gap-1 flex-wrap ${styles["quick-filters"]}`}>
        {QUICK_FILTERS.map((qf) => {
          const active = qf.evKey
            ? filters.ev.includes(qf.evKey)
            : qf.fuelKey ? filters.fuels.includes(qf.fuelKey) : false;
          return (
            <button
              key={qf.label}
              onClick={() => toggleQuickFilter(qf)}
              className={`tm-chip clickable ${active ? "tm-chip-active" : ""}`}
            >
              {qf.label}
            </button>
          );
        })}
      </div>

      <div className={`px-3 py-2 ${styles.header}`}>
        {filteredStations.length} stations found
        {isStale && <span className="tm-loading-spinner ms-2" style={{ width: 12, height: 12 }} />}
      </div>
      {deferredStations.slice(0, 100).map((s, idx) => {
        const timeInfo =
          s.status === "open" || s.status === "closing-soon"
            ? getTimeUntilClose(s)
            : getNextOpenTime(s);

        // Key amenities to show as icons
        const amenityTags = s.amenities
          .filter((a) => AMENITY_ICONS[a])
          .slice(0, 5)
          .map((a) => AMENITY_ICONS[a]);

        return (
          <div key={s.id} className="tm-list-item" onClick={() => handleClick(s)}>
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <div className={styles["station-name"]}>
                  <span className={styles["station-index"]}>STA-{String(idx + 1).padStart(3, "0")}</span>
                  {s.name}
                  <span
                    className={styles["brand-tag"]}
                    style={{
                      color: BRAND_COLORS[s.brand]?.primary || "#666",
                      borderColor: `${BRAND_COLORS[s.brand]?.primary || "#666"}44`,
                    }}
                  >
                    {BRAND_LABELS[s.brand] || s.brand}
                  </span>
                </div>
                <div className={styles["station-location"]}>
                  {s.city}, {s.state} {s.postcode}
                  {s.country === "NZ" && <span className={styles["country-tag"]}> NZ</span>}
                </div>
              </div>
              <div className="text-end">
                <div className="d-flex gap-1 justify-content-end">
                  <span className={`tm-badge tm-badge-${s.status || "unknown"}`}>
                    {s.status === "open" ? "Open" :
                     s.status === "closing-soon" ? "Closing Soon" :
                     s.status === "closed" ? "Closed" : "N/A"}
                  </span>
                  {s.open24Hours && <span className="tm-badge tm-badge-24h">24H</span>}
                </div>
                {s.distance !== undefined && (
                  <div className={styles["station-distance"]}>
                    {s.distance < 1 ? `${Math.round(s.distance * 1000)} m` : `${s.distance.toFixed(1)} km`}
                  </div>
                )}
              </div>
            </div>
            {timeInfo && <div className={styles["time-info"]}>{timeInfo}</div>}
            {s.fuels.length > 0 && (
              <div className="d-flex flex-wrap mt-1">
                {s.fuels.slice(0, 5).map((f) => (
                  <span key={f} className={`tm-chip ${styles["fuel-chip"]} ${getFuelClass(f)}`}>
                    {getFuelLabel(f)}
                  </span>
                ))}
                {s.fuels.length > 5 && <span className={`tm-chip ${styles["fuel-chip"]}`}>+{s.fuels.length - 5}</span>}
              </div>
            )}
            {amenityTags.length > 0 && (
              <div className={`d-flex flex-wrap mt-1 ${styles["amenity-row"]}`}>
                {amenityTags.map((tag, i) => (
                  <span key={i} className={styles["amenity-tag"]}>{tag}</span>
                ))}
              </div>
            )}
          </div>
        );
      })}
      {deferredStations.length > 100 && (
        <div className={`text-center py-3 ${styles.footer}`}>
          Showing 100 of {deferredStations.length} results
        </div>
      )}
    </div>
  );
}
