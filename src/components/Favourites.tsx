"use client";

import React from "react";
import { useApp } from "@/context/AppContext";

export default function Favourites() {
  const { allStations, favourites, toggleFavourite, setSelectedStation, setMapCenter, setMapZoom } = useApp();

  const favStations = allStations.filter((s) => favourites.includes(s.id));

  return (
    <div className="p-4">
      <h3 className="font-bold mb-3">Favourite Stations</h3>
      {favStations.length === 0 ? (
        <p className="text-sm text-gray-500">No favourites yet. Tap ☆ on a station to add it.</p>
      ) : (
        <div className="space-y-2">
          {favStations.map((s) => (
            <div
              key={s.id}
              className="p-3 bg-gray-50 rounded-lg border cursor-pointer"
              onClick={() => {
                setSelectedStation(s);
                setMapCenter([s.lat, s.lng]);
                setMapZoom(15);
              }}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-sm">{s.name}</p>
                  <p className="text-xs text-gray-500">{s.city}, {s.state}</p>
                  <span className={`badge badge-${s.status || "unknown"} text-[0.65rem] mt-1`}>
                    {s.status === "open" ? "Open" :
                     s.status === "closing-soon" ? "Closing Soon" :
                     s.status === "closed" ? "Closed" : "?"}
                  </span>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); toggleFavourite(s.id); }}
                  className="text-yellow-500"
                >
                  ★
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
