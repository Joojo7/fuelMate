"use client";

import React, { useState, useCallback } from "react";
import { useApp } from "@/context/AppContext";
import { Station } from "@/lib/types";
import { haversineDistance, isOpenAtTime, applyFilters } from "@/lib/stationUtils";

interface TripState {
  startLat: number; startLng: number; startLabel: string;
  endLat: number; endLng: number; endLabel: string;
  range: number;
  stops: Station[];
  computed: boolean;
}

const PRESET_LOCATIONS: Record<string, [number, number]> = {
  "Sydney": [-33.8688, 151.2093],
  "Melbourne": [-37.8136, 144.9631],
  "Brisbane": [-27.4698, 153.0251],
  "Perth": [-31.9505, 115.8605],
  "Adelaide": [-34.9285, 138.6007],
  "Hobart": [-42.8821, 147.3272],
  "Darwin": [-12.4634, 130.8456],
  "Canberra": [-35.2809, 149.1300],
  "Gold Coast": [-28.0167, 153.4000],
  "Cairns": [-16.9186, 145.7781],
};

export default function TripPlanner() {
  const { allStations, filters, setSelectedStation, setMapCenter, setMapZoom } = useApp();
  const [startCity, setStartCity] = useState("");
  const [endCity, setEndCity] = useState("");
  const [range, setRange] = useState(500);
  const [trip, setTrip] = useState<TripState | null>(null);
  const [error, setError] = useState("");

  const resolveCity = (name: string): [number, number] | null => {
    const key = Object.keys(PRESET_LOCATIONS).find(
      (k) => k.toLowerCase() === name.toLowerCase().trim()
    );
    if (key) return PRESET_LOCATIONS[key];
    // Try matching a station city
    const station = allStations.find(
      (s) => s.city.toLowerCase() === name.toLowerCase().trim()
    );
    if (station) return [station.lat, station.lng];
    return null;
  };

  const planTrip = useCallback(() => {
    setError("");
    const startCoord = resolveCity(startCity);
    const endCoord = resolveCity(endCity);
    if (!startCoord) { setError(`Could not find "${startCity}". Try a major city name.`); return; }
    if (!endCoord) { setError(`Could not find "${endCity}". Try a major city name.`); return; }

    const [sLat, sLng] = startCoord;
    const [eLat, eLng] = endCoord;
    const totalDist = haversineDistance(sLat, sLng, eLat, eLng);
    const numStops = Math.max(0, Math.floor(totalDist / range) - 1);

    // Filter eligible stations
    const eligible = applyFilters(
      allStations.filter((s) => s.status !== "closed"),
      filters
    );

    const stops: Station[] = [];
    const avgSpeed = 90; // km/h

    for (let i = 1; i <= numStops + 1; i++) {
      const fraction = (i * range) / totalDist;
      if (fraction >= 1) break;

      const targetLat = sLat + (eLat - sLat) * fraction;
      const targetLng = sLng + (eLng - sLng) * fraction;

      // Find closest eligible station to target point
      let best: Station | null = null;
      let bestDist = Infinity;
      for (const s of eligible) {
        if (stops.some((st) => st.id === s.id)) continue;
        const d = haversineDistance(targetLat, targetLng, s.lat, s.lng);
        if (d < bestDist && d < 50) { // within 50km of route point
          bestDist = d;
          best = s;
        }
      }
      if (best) {
        // Estimate arrival time
        const distFromStart = haversineDistance(sLat, sLng, best.lat, best.lng);
        const hoursTravel = distFromStart / avgSpeed;
        const arrivalTime = new Date(Date.now() + hoursTravel * 3600000);
        const openAtArrival = isOpenAtTime(best, arrivalTime);
        stops.push({ ...best, distance: distFromStart });
      }
    }

    setTrip({
      startLat: sLat, startLng: sLng, startLabel: startCity,
      endLat: eLat, endLng: eLng, endLabel: endCity,
      range, stops, computed: true,
    });

    // Center map between start and end
    setMapCenter([(sLat + eLat) / 2, (sLng + eLng) / 2]);
    setMapZoom(6);
  }, [startCity, endCity, range, allStations, filters, setMapCenter, setMapZoom]);

  const removeStop = (idx: number) => {
    if (!trip) return;
    const newStops = [...trip.stops];
    newStops.splice(idx, 1);
    setTrip({ ...trip, stops: newStops });
  };

  return (
    <div className="p-4">
      <h3 className="font-bold mb-3">Trip Planner</h3>

      <div className="space-y-2 mb-3">
        <input
          placeholder="Start (e.g. Sydney)"
          value={startCity}
          onChange={(e) => setStartCity(e.target.value)}
        />
        <input
          placeholder="Destination (e.g. Melbourne)"
          value={endCity}
          onChange={(e) => setEndCity(e.target.value)}
        />
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500 whitespace-nowrap">Range (km):</label>
          <input
            type="number"
            value={range}
            onChange={(e) => setRange(Number(e.target.value))}
            min={50}
            max={1500}
            className="w-24"
          />
        </div>
        <button onClick={planTrip} className="btn btn-primary w-full">
          Plan Trip
        </button>
      </div>

      {error && <p className="text-red-500 text-sm mb-2">{error}</p>}

      {trip?.computed && (
        <div>
          <div className="text-sm text-gray-600 mb-2">
            {trip.startLabel} → {trip.endLabel} • {
              haversineDistance(trip.startLat, trip.startLng, trip.endLat, trip.endLng).toFixed(0)
            } km (straight line)
          </div>

          {trip.stops.length === 0 ? (
            <p className="text-sm text-gray-500">No fuel stops needed — within vehicle range.</p>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-gray-500">{trip.stops.length} suggested stop(s)</p>
              {trip.stops.map((stop, i) => {
                const arrivalHours = (stop.distance || 0) / 90;
                const arrivalTime = new Date(Date.now() + arrivalHours * 3600000);
                const openAtArrival = isOpenAtTime(stop, arrivalTime);

                return (
                  <div
                    key={stop.id}
                    className="p-3 bg-gray-50 rounded-lg border cursor-pointer"
                    onClick={() => {
                      setSelectedStation(stop);
                      setMapCenter([stop.lat, stop.lng]);
                      setMapZoom(14);
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-sm">Stop {i + 1}: {stop.name}</p>
                        <p className="text-xs text-gray-500">{stop.city}, {stop.state}</p>
                        <p className="text-xs text-gray-400">
                          ~{stop.distance?.toFixed(0)} km from start •
                          ETA: {arrivalTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                        <span className={`text-xs ${openAtArrival ? "text-green-600" : "text-red-500"}`}>
                          {openAtArrival ? "Open at arrival" : "May be closed at arrival"}
                        </span>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); removeStop(i); }}
                        className="text-red-400 text-xs"
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
