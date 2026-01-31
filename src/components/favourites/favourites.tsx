"use client";

import React from "react";
import { useApp } from "@/context/AppContext";
import styles from "./index.module.scss";

export default function Favourites() {
  const { allStations, favourites, toggleFavourite, setSelectedStation, setMapCenter, setMapZoom } = useApp();

  const favStations = allStations.filter((s) => favourites.includes(s.id));

  return (
    <div className="p-3">
      <div className="tm-section-title">Tracked Targets</div>
      {favStations.length === 0 ? (
        <div className={styles.empty}>
          No targets tracked. Tap &quot;Save&quot; on a station to begin tracking.
        </div>
      ) : (
        <div className="d-flex flex-column gap-2">
          {favStations.map((s) => (
            <div
              key={s.id}
              className={`tm-list-item ${styles["fav-card"]}`}
              onClick={() => {
                setSelectedStation(s);
                setMapCenter([s.lat, s.lng]);
                setMapZoom(15);
              }}
            >
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <div className={styles["station-name"]}><span className={styles["tracked-badge"]}>[TRACKED]</span> {s.name}</div>
                  <div className={styles["station-location"]}>{s.city}, {s.state}</div>
                  <span className={`tm-badge tm-badge-${s.status || "unknown"} mt-1`}>
                    {s.status === "open" ? "Open" :
                     s.status === "closing-soon" ? "Closing Soon" :
                     s.status === "closed" ? "Closed" : "N/A"}
                  </span>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); toggleFavourite(s.id); }}
                  className={`btn-terminal btn-terminal-amber ${styles["untrack-btn"]}`}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
