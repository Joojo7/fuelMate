"use client";

import { useApp } from "@/context/AppContext";
import { FAV_TITLE, FAV_EMPTY, FAV_BADGE, FAV_REMOVE, STATUS_LABELS } from "@/lib/constants";
import styles from "./index.module.scss";

export default function Favourites({ onSwitchToMap }: { onSwitchToMap?: () => void } = {}) {
  const { allStations, favourites, toggleFavourite, setSelectedStation, setMapCenter, setMapZoom } = useApp();

  const favStations = allStations.filter((s) => favourites.includes(s.id));

  return (
    <div className="p-3">
      <div className="tm-section-title">{FAV_TITLE}</div>
      {favStations.length === 0 ? (
        <div className={styles.empty}>{FAV_EMPTY}</div>
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
                onSwitchToMap?.();
              }}
            >
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <div className={styles["station-name"]}><span className={styles["tracked-badge"]}>{FAV_BADGE}</span> {s.name}</div>
                  <div className={styles["station-location"]}>{s.city}, {s.state}</div>
                  <span className={`tm-badge tm-badge-${s.status || "unknown"} mt-1`}>
                    {STATUS_LABELS[s.status || "unknown"] || "N/A"}
                  </span>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); toggleFavourite(s.id); }}
                  className={`btn-terminal btn-terminal-amber ${styles["untrack-btn"]}`}
                >
                  {FAV_REMOVE}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
