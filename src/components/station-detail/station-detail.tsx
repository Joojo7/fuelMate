"use client";

import React from "react";
import { useApp } from "@/context/AppContext";
import { getTimeUntilClose, getNextOpenTime } from "@/lib/stationUtils";
import styles from "./index.module.scss";

const DAY_LABELS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"] as const;
const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

export default function StationDetail() {
  const { selectedStation: station, setSelectedStation, toggleFavourite, favourites } = useApp();
  if (!station) return null;

  const isFav = favourites.includes(station.id);
  const statusLabel =
    station.status === "open" ? "Open" :
    station.status === "closing-soon" ? "Closing Soon" :
    station.status === "closed" ? "Closed" : "Unknown";

  const timeInfo =
    station.status === "open" || station.status === "closing-soon"
      ? getTimeUntilClose(station)
      : getNextOpenTime(station);

  return (
    <div>
      <div className="d-flex justify-content-between align-items-start mb-3">
        <div>
          <h5 className={styles["station-name"]}>{station.name}</h5>
          <div className={styles["station-address"]}>{station.address}, {station.city}, {station.state} {station.postcode}</div>
        </div>
        <button onClick={() => setSelectedStation(null)} className={styles["close-btn"]}>
          &times;
        </button>
      </div>

      <div className="d-flex align-items-center gap-2 mb-3">
        {station.status === "open" && <span className="tm-pulse-dot" />}
        <span className={`tm-badge tm-badge-${station.status || "unknown"}`}>{statusLabel}</span>
        {station.open24Hours && <span className="tm-badge tm-badge-24h">24H</span>}
        {timeInfo && <span className={styles["time-info"]}>{timeInfo}</span>}
      </div>

      {station.telephone && (
        <div className={styles.telephone}>
          Phone: <a href={`tel:${station.telephone}`} className={styles["tel-link"]}>{station.telephone}</a>
        </div>
      )}

      {/* Weekly hours */}
      <div className="mb-3">
        <div className="tm-section-title">Opening Hours</div>
        <table className={`table table-sm table-borderless ${styles["hours-table"]}`}>
          <tbody>
            {DAY_LABELS.map((label, i) => {
              const val = station.hours[DAY_KEYS[i]];
              return (
                <tr key={label}>
                  <td className={styles["day-label"]}>{label}</td>
                  <td className={styles["day-value"]}>{val || "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!station.hours.mon && !station.open24Hours && (
          <div className={styles["hours-warning"]}>
            Hours not available — please call to confirm
          </div>
        )}
      </div>

      {/* Fuels */}
      {station.fuels.length > 0 && (
        <div className="mb-3">
          <div className="tm-section-title">Fuel Types</div>
          <div className="d-flex flex-wrap">
            {station.fuels.map((f) => (
              <span key={f} className="tm-chip">{f === "Unlead" ? "ULP" : f}</span>
            ))}
          </div>
        </div>
      )}

      {/* Amenities */}
      {station.amenities.length > 0 && (
        <div className="mb-3">
          <div className="tm-section-title">Amenities</div>
          <div className="d-flex flex-wrap">
            {station.amenities.map((a) => (
              <span key={a} className="tm-chip">{a}</span>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="d-flex gap-2 flex-wrap">
        <a
          href={`https://www.google.com/maps/dir/?api=1&destination=${station.lat},${station.lng}`}
          target="_blank"
          rel="noopener noreferrer"
          className={`btn-terminal btn-terminal-filled ${styles["nav-link"]}`}
        >
          Get Directions
        </a>
        {station.telephone && (
          <a href={`tel:${station.telephone}`} className={`btn-terminal ${styles["nav-link"]}`}>
            Call Station
          </a>
        )}
        <button onClick={() => toggleFavourite(station.id)} className={`btn-terminal ${isFav ? "btn-terminal-amber" : ""}`}>
          {isFav ? "Saved" : "Save"}
        </button>
      </div>

      {station.distance !== undefined && (
        <div className={styles["range-info"]}>
          Distance: {station.distance < 1
            ? `${Math.round(station.distance * 1000)} m`
            : `${station.distance.toFixed(1)} km`}
        </div>
      )}
    </div>
  );
}
