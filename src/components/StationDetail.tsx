"use client";

import React from "react";
import { useApp } from "@/context/AppContext";
import { getTimeUntilClose, getNextOpenTime } from "@/lib/stationUtils";

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

export default function StationDetail() {
  const { selectedStation: station, setSelectedStation, toggleFavourite, favourites } = useApp();
  if (!station) return null;

  const isFav = favourites.includes(station.id);
  const statusBadge = `badge badge-${station.status || "unknown"}`;
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
      <div className="flex justify-between items-start mb-3">
        <div>
          <h2 className="font-bold text-lg">{station.name}</h2>
          <p className="text-gray-500 text-sm">{station.address}, {station.city}, {station.state} {station.postcode}</p>
        </div>
        <button onClick={() => setSelectedStation(null)} className="text-gray-400 text-xl leading-none">&times;</button>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <span className={statusBadge}>{statusLabel}</span>
        {station.open24Hours && <span className="chip">24 Hours</span>}
        {timeInfo && <span className="text-xs text-gray-500">{timeInfo}</span>}
      </div>

      {station.telephone && (
        <p className="text-sm text-gray-600 mb-3">📞 {station.telephone}</p>
      )}

      {/* Weekly hours */}
      <div className="mb-4">
        <h3 className="text-sm font-semibold mb-1">Opening Hours</h3>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
          {DAY_LABELS.map((label, i) => {
            const val = station.hours[DAY_KEYS[i]];
            return (
              <div key={label} className="flex justify-between">
                <span className="font-medium">{label}</span>
                <span className="text-gray-500">{val || "—"}</span>
              </div>
            );
          })}
        </div>
        {!station.hours.mon && !station.open24Hours && (
          <p className="text-xs text-amber-600 mt-1">Hours unavailable — call to confirm.</p>
        )}
      </div>

      {/* Fuels */}
      {station.fuels.length > 0 && (
        <div className="mb-3">
          <h3 className="text-sm font-semibold mb-1">Fuel Types</h3>
          <div className="flex flex-wrap">
            {station.fuels.map((f) => (
              <span key={f} className="chip">{f === "Unlead" ? "Unleaded" : f}</span>
            ))}
          </div>
        </div>
      )}

      {/* Amenities */}
      {station.amenities.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-semibold mb-1">Amenities</h3>
          <div className="flex flex-wrap">
            {station.amenities.map((a) => (
              <span key={a} className="chip">{a}</span>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 flex-wrap">
        <a
          href={`https://www.google.com/maps/dir/?api=1&destination=${station.lat},${station.lng}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-primary text-xs"
        >
          Get Directions
        </a>
        {station.telephone && (
          <a href={`tel:${station.telephone}`} className="btn btn-secondary text-xs">
            Call Station
          </a>
        )}
        <button onClick={() => toggleFavourite(station.id)} className="btn btn-secondary text-xs">
          {isFav ? "★ Favourited" : "☆ Add Favourite"}
        </button>
      </div>

      {station.distance !== undefined && (
        <p className="text-xs text-gray-400 mt-3">
          {station.distance < 1
            ? `${Math.round(station.distance * 1000)} m away`
            : `${station.distance.toFixed(1)} km away`}
        </p>
      )}
    </div>
  );
}
