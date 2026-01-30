"use client";

import React from "react";
import { useApp } from "@/context/AppContext";
import { getTimeUntilClose, getNextOpenTime } from "@/lib/stationUtils";

export default function StationList() {
  const { filteredStations, setSelectedStation, setMapCenter, setMapZoom } = useApp();

  const handleClick = (station: typeof filteredStations[0]) => {
    setSelectedStation(station);
    setMapCenter([station.lat, station.lng]);
    setMapZoom(15);
  };

  return (
    <div>
      <div className="px-3 py-2 border-b bg-gray-50">
        <p className="text-xs text-gray-500">{filteredStations.length} stations found</p>
      </div>
      {filteredStations.slice(0, 100).map((s) => {
        const timeInfo =
          s.status === "open" || s.status === "closing-soon"
            ? getTimeUntilClose(s)
            : getNextOpenTime(s);

        return (
          <div key={s.id} className="station-list-item" onClick={() => handleClick(s)}>
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold text-sm">{s.name}</p>
                <p className="text-xs text-gray-500">{s.city}, {s.state} {s.postcode}</p>
              </div>
              <div className="text-right">
                <span className={`badge badge-${s.status || "unknown"} text-[0.65rem]`}>
                  {s.status === "open" ? "Open" :
                   s.status === "closing-soon" ? "Closing Soon" :
                   s.status === "closed" ? "Closed" : "?"}
                </span>
                {s.distance !== undefined && (
                  <p className="text-xs text-gray-400 mt-1">
                    {s.distance < 1 ? `${Math.round(s.distance * 1000)} m` : `${s.distance.toFixed(1)} km`}
                  </p>
                )}
              </div>
            </div>
            {timeInfo && <p className="text-xs text-gray-400 mt-1">{timeInfo}</p>}
            {s.fuels.length > 0 && (
              <div className="flex flex-wrap mt-1">
                {s.fuels.slice(0, 4).map((f) => (
                  <span key={f} className="chip text-[0.6rem]">{f === "Unlead" ? "Unleaded" : f}</span>
                ))}
                {s.fuels.length > 4 && <span className="chip text-[0.6rem]">+{s.fuels.length - 4}</span>}
              </div>
            )}
          </div>
        );
      })}
      {filteredStations.length > 100 && (
        <p className="text-center text-xs text-gray-400 py-3">Showing first 100 of {filteredStations.length}</p>
      )}
    </div>
  );
}
