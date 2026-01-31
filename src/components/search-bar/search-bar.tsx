"use client";

import React, { useState, useMemo, useRef, useCallback } from "react";
import { MagnifyingGlassIcon, XIcon, MapPinIcon, BuildingsIcon, HashIcon } from "@phosphor-icons/react";
import { useApp } from "@/context/AppContext";
import styles from "./index.module.scss";

const RADIUS_OPTIONS = [5, 10, 25, 50, 100] as const;

const TYPE_ICON: Record<string, React.ReactNode> = {
  station: <MapPinIcon size={12} weight="bold" />,
  city: <BuildingsIcon size={12} weight="bold" />,
  postcode: <HashIcon size={12} weight="bold" />,
};

export default function SearchBar() {
  const {
    allStations, setSearchQuery, setSelectedStation,
    setMapCenter, setMapZoom, showAll, setShowAll,
    searchRadius, setSearchRadius, setSearchCircle,
  } = useApp();

  const [input, setInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

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

  const handleSelect = useCallback((sug: typeof suggestions[0]) => {
    setInput(sug.label);
    setShowSuggestions(false);
    setActiveIndex(-1);
    if (sug.station) {
      setSearchQuery("");
      setSelectedStation(sug.station);
      setMapCenter([sug.station.lat, sug.station.lng]);
      setMapZoom(15);
      setSearchCircle(null);
    } else {
      // Extract just the city name or postcode for searching
      const cityOrPostcode = sug.type === "city"
        ? sug.label.split(",")[0].trim()
        : sug.label.split(" — ")[0].trim();
      setSearchQuery(cityOrPostcode);

      // Find center of the city/postcode by averaging matching station coords
      const matching = allStations.filter((s) =>
        sug.type === "city"
          ? s.city.toLowerCase() === cityOrPostcode.toLowerCase()
          : s.postcode === cityOrPostcode
      );
      if (matching.length > 0) {
        const avgLat = matching.reduce((sum, s) => sum + s.lat, 0) / matching.length;
        const avgLng = matching.reduce((sum, s) => sum + s.lng, 0) / matching.length;
        setMapCenter([avgLat, avgLng]);
        setMapZoom(12);
        setSearchCircle({ lat: avgLat, lng: avgLng, radius: searchRadius * 1000 });
      }
    }
  }, [setSelectedStation, setMapCenter, setMapZoom, setSearchQuery, setSearchCircle, allStations, searchRadius]);

  const handleClear = () => {
    setInput("");
    setSearchQuery("");
    setShowSuggestions(false);
    setActiveIndex(-1);
    setSearchCircle(null);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      handleSelect(suggestions[activeIndex]);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
      setActiveIndex(-1);
    }
  };

  return (
    <div className={styles.searchBar}>
      {/* Search input */}
      <div className={styles.inputGroup}>
        <MagnifyingGlassIcon size={14} weight="bold" className={styles.searchIcon} />
        <input
          ref={inputRef}
          type="text"
          className={styles.searchInput}
          placeholder="Search station, city, or postcode..."
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setSearchQuery(e.target.value);
            setShowSuggestions(true);
            setActiveIndex(-1);
          }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          onKeyDown={handleKeyDown}
        />
        {input && (
          <button className={styles.clearBtn} onMouseDown={handleClear} tabIndex={-1}>
            <XIcon size={12} weight="bold" />
          </button>
        )}

        {/* Suggestions dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className={styles.dropdown}>
            {suggestions.map((sug, i) => (
              <button
                key={i}
                type="button"
                onMouseDown={() => handleSelect(sug)}
                className={`${styles.dropdownItem} ${i === activeIndex ? styles.dropdownItemActive : ""}`}
              >
                <span className={`${styles.typeTag} ${styles[`typeTag--${sug.type}`]}`}>
                  {TYPE_ICON[sug.type]}
                  <span>{sug.type}</span>
                </span>
                <span className={styles.itemLabel}>{sug.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Controls row */}
      <div className={styles.controls}>
        {/* Show all toggle */}
        <button
          className={`${styles.toggleBtn} ${showAll ? styles.toggleBtnActive : ""}`}
          onClick={() => setShowAll(!showAll)}
          title="Show all stations"
        >
          ALL
        </button>

        {/* Radius selector */}
        <div className={styles.radiusGroup}>
          {RADIUS_OPTIONS.map((r) => (
            <button
              key={r}
              className={`${styles.radiusBtn} ${searchRadius === r ? styles.radiusBtnActive : ""}`}
              onClick={() => setSearchRadius(r)}
            >
              {r}
            </button>
          ))}
          <span className={styles.radiusUnit}>km</span>
        </div>
      </div>
    </div>
  );
}
