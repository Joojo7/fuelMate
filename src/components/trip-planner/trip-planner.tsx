"use client";

import React, { useState, useCallback } from "react";
import { useApp } from "@/context/AppContext";
import { Station } from "@/lib/types";
import { haversineDistance, isOpenAtTime, applyFilters } from "@/lib/stationUtils";
import styles from "./index.module.scss";

export default function TripPlanner({ onSwitchToMap }: { onSwitchToMap?: () => void }) {
  const {
    allStations, filters, setSelectedStation, setMapCenter, setMapZoom,
    tripPickMode, setTripPickMode, tripOrigin, tripDestination,
    setTripOrigin, setTripDestination, setTripStops,
  } = useApp();
  const [range, setRange] = useState(100);
  const [trip, setTrip] = useState<{
    stops: Station[];
    computed: boolean;
    totalDist: number;
  } | null>(null);
  const [error, setError] = useState("");

  const startPick = (mode: "origin" | "destination") => {
    setTripPickMode(mode);
    // Only switch to map tab on mobile (below md breakpoint) where the map is a separate tab
    if (onSwitchToMap && window.innerWidth < 768) onSwitchToMap();
  };

  const planTrip = useCallback(() => {
    setError("");
    if (!tripOrigin) { setError("Please set a starting point on the map."); return; }
    if (!tripDestination) { setError("Please set a destination on the map."); return; }

    const { lat: sLat, lng: sLng } = tripOrigin;
    const { lat: eLat, lng: eLng } = tripDestination;
    const totalDist = haversineDistance(sLat, sLng, eLat, eLng);

    const eligible = applyFilters(
      allStations.filter((s) => s.status !== "closed"),
      filters
    );

    const stops: Station[] = [];

    // Place stops at regular intervals along the route
    const numSegments = Math.max(1, Math.ceil(totalDist / range));
    for (let i = 1; i < numSegments + 1; i++) {
      const fraction = i / (numSegments + 1);
      if (fraction >= 1) break;

      const targetLat = sLat + (eLat - sLat) * fraction;
      const targetLng = sLng + (eLng - sLng) * fraction;

      let best: Station | null = null;
      let bestDist = Infinity;
      for (const s of eligible) {
        if (stops.some((st) => st.id === s.id)) continue;
        const d = haversineDistance(targetLat, targetLng, s.lat, s.lng);
        if (d < bestDist && d < 50) {
          bestDist = d;
          best = s;
        }
      }
      if (best) {
        const distFromStart = haversineDistance(sLat, sLng, best.lat, best.lng);
        stops.push({ ...best, distance: distFromStart });
      }
    }

    setTrip({ stops, computed: true, totalDist });
    setTripStops(stops);
  }, [tripOrigin, tripDestination, range, allStations, filters, setTripStops]);

  const removeStop = (idx: number) => {
    if (!trip) return;
    const newStops = [...trip.stops];
    newStops.splice(idx, 1);
    setTrip({ ...trip, stops: newStops });
    setTripStops(newStops);
  };

  const clearTrip = () => {
    setTripOrigin(null);
    setTripDestination(null);
    setTrip(null);
    setTripStops([]);
    setError("");
  };

  return (
    <div className="p-3">
      <div className="tm-section-title">Trip Planner</div>

      <div className="d-flex flex-column gap-2 mb-3">
        {/* Origin picker */}
        <div className={styles["point-row"]}>
          <span className={styles["point-label"]}>From:</span>
          {tripOrigin ? (
            <span className={styles["point-value"]}>{tripOrigin.label}</span>
          ) : (
            <span className={styles["point-placeholder"]}>Not set</span>
          )}
          <button
            onClick={() => startPick("origin")}
            className={`btn-terminal ${styles["pick-btn"]} ${tripPickMode === "origin" ? styles["pick-active"] : ""}`}
          >
            {tripPickMode === "origin" ? "Picking..." : "Set on Map"}
          </button>
        </div>

        {/* Destination picker */}
        <div className={styles["point-row"]}>
          <span className={styles["point-label"]}>To:</span>
          {tripDestination ? (
            <span className={styles["point-value"]}>{tripDestination.label}</span>
          ) : (
            <span className={styles["point-placeholder"]}>Not set</span>
          )}
          <button
            onClick={() => startPick("destination")}
            className={`btn-terminal ${styles["pick-btn"]} ${tripPickMode === "destination" ? styles["pick-active"] : ""}`}
          >
            {tripPickMode === "destination" ? "Picking..." : "Set on Map"}
          </button>
        </div>

        <div className="d-flex align-items-center gap-2">
          <span className={styles["range-label"]}>Range (km):</span>
          <input
            type="number"
            className={`form-control form-control-sm ${styles["range-input"]}`}
            value={range}
            onChange={(e) => setRange(Number(e.target.value))}
            min={50}
            max={1500}
          />
        </div>
        <div className="d-flex gap-2">
          <button onClick={planTrip} className="btn-terminal btn-terminal-filled flex-grow-1">
            Plan Trip
          </button>
          {(tripOrigin || tripDestination || trip) && (
            <button onClick={clearTrip} className="btn-terminal btn-terminal-danger">
              Clear
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className={styles.error}>{error}</div>
      )}

      {trip?.computed && (
        <div>
          <div className={styles["route-summary"]}>
            {tripOrigin?.label} → {tripDestination?.label} — {trip.totalDist.toFixed(0)} km (straight line)
          </div>

          {trip.stops.length === 0 ? (
            <div className={styles["no-stops"]}>
              No stations found along this route
            </div>
          ) : (
            <div className="d-flex flex-column gap-2">
              <div className={styles["waypoint-count"]}>{trip.stops.length} stop{trip.stops.length !== 1 ? "s" : ""} along route</div>
              {trip.stops.map((stop, i) => {
                const arrivalHours = (stop.distance || 0) / 90;
                const arrivalTime = new Date(Date.now() + arrivalHours * 3600000);
                const openAtArrival = isOpenAtTime(stop, arrivalTime);

                return (
                  <div
                    key={stop.id}
                    className={`tm-list-item ${styles["waypoint-card"]}`}
                    onClick={() => {
                      setSelectedStation(stop);
                      setMapCenter([stop.lat, stop.lng]);
                      setMapZoom(14);
                    }}
                  >
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <div className={styles["wp-name"]}>
                          Stop {i + 1}: {stop.name}
                        </div>
                        <div className={styles["wp-location"]}>{stop.city}, {stop.state}</div>
                        <div className={styles["wp-eta"]}>
                          ~{stop.distance?.toFixed(0)} km — ETA: {arrivalTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </div>
                        <span className={openAtArrival ? styles["wp-status-online"] : styles["wp-status-offline"]}>
                          {openAtArrival ? "Open at arrival" : "May be closed at arrival"}
                        </span>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); removeStop(i); }}
                        className={`btn-terminal btn-terminal-danger ${styles["drop-btn"]}`}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
