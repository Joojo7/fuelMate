"use client";

import React, { useDeferredValue } from "react";
import { useApp } from "@/context/AppContext";
import { getTimeUntilClose, getNextOpenTime } from "@/lib/stationUtils";
import styles from "./index.module.scss";

const QUICK_FILTERS: { label: string; fuelKey?: string; evKey?: string }[] = [
  { label: "Unleaded", fuelKey: "Unleaded" },
  { label: "Diesel", fuelKey: "Diesel" },
  { label: "Premium", fuelKey: "Premium Unleaded" },
  { label: "EV", evKey: "bp pulse" },
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
  if (fuel === "Unlead" || fuel === "Unleaded 91" || fuel === "BP 91") return "ULP";
  if (fuel === "Premium Unleaded" || fuel === "Premium Unleaded 95" || fuel === "BP 95") return "Premium";
  if (fuel === "BP Ultimate Unleaded" || fuel === "Ultimate Unleaded 98") return "Ultimate";
  if (fuel === "Unleaded with Ethanol (E10)" || fuel === "e10") return "E10";
  if (fuel === "Diesel" || fuel === "BP Diesel") return "Diesel";
  if (fuel === "BP Ultimate Diesel" || fuel === "Ultimate Diesel") return "Ult. Diesel";
  if (fuel === "BP Autogas" || fuel === "LPG Automotive") return "LPG";
  if (fuel.includes("Adblue") || fuel.includes("AdBlue")) return "AdBlue";
  if (fuel === "LPG bottles" || fuel === "LPG Bottle Fill") return "LPG Bottles";
  if (fuel === "bp pulse") return "EV";
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

export default function StationList() {
  const { filteredStations, setSelectedStation, setMapCenter, setMapZoom, filters, setFilters } = useApp();
  const deferredStations = useDeferredValue(filteredStations);
  const isStale = deferredStations !== filteredStations;

  const handleClick = (station: typeof filteredStations[0]) => {
    setSelectedStation(station);
    setMapCenter([station.lat, station.lng]);
    setMapZoom(15);
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
      {deferredStations.slice(0, 100).map((s) => {
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
                <div className={styles["station-name"]}>{s.name}</div>
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
