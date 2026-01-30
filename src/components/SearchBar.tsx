"use client";

import React, { useState, useMemo } from "react";
import { useApp } from "@/context/AppContext";

export default function SearchBar() {
  const { allStations, setSearchQuery, setSelectedStation, setMapCenter, setMapZoom, showAll, setShowAll, searchRadius, setSearchRadius } = useApp();
  const [input, setInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const suggestions = useMemo(() => {
    if (input.length < 2) return [];
    const q = input.toLowerCase();
    const seen = new Set<string>();
    const results: { label: string; type: string; station?: typeof allStations[0] }[] = [];

    for (const s of allStations) {
      if (results.length >= 8) break;

      if (s.name.toLowerCase().includes(q) && !seen.has(s.name)) {
        seen.add(s.name);
        results.push({ label: `${s.name} — ${s.city}, ${s.state}`, type: "station", station: s });
      } else if (s.city.toLowerCase().includes(q) && !seen.has(s.city)) {
        seen.add(s.city);
        results.push({ label: `${s.city}, ${s.state}`, type: "city" });
      } else if (s.postcode.includes(input) && !seen.has(s.postcode)) {
        seen.add(s.postcode);
        results.push({ label: `${s.postcode} — ${s.city}, ${s.state}`, type: "postcode" });
      }
    }
    return results;
  }, [input, allStations]);

  const handleSelect = (sug: typeof suggestions[0]) => {
    setInput(sug.label);
    setShowSuggestions(false);
    if (sug.station) {
      setSelectedStation(sug.station);
      setMapCenter([sug.station.lat, sug.station.lng]);
      setMapZoom(15);
    } else {
      setSearchQuery(sug.label.split(" — ")[0]);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1">
        <input
          type="text"
          placeholder="Search station, city, postcode..."
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setSearchQuery(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          className="text-sm"
        />
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 bg-white shadow-lg rounded-b-lg z-50 max-h-60 overflow-y-auto">
            {suggestions.map((sug, i) => (
              <button
                key={i}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 border-b border-gray-100"
                onMouseDown={() => handleSelect(sug)}
              >
                <span className="text-gray-400 text-xs mr-1">{sug.type}</span>
                {sug.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <label className="flex items-center gap-1 text-xs whitespace-nowrap">
        <input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} />
        Show All
      </label>

      <select
        value={searchRadius}
        onChange={(e) => setSearchRadius(Number(e.target.value))}
        className="w-20 text-xs"
      >
        {[5, 10, 25, 50, 100].map((r) => (
          <option key={r} value={r}>{r} km</option>
        ))}
      </select>
    </div>
  );
}
