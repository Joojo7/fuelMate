"use client";

import React, { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { MagnifyingGlassIcon, XIcon, MapPinIcon, BuildingsIcon, HashIcon, GlobeIcon, SpinnerIcon } from "@phosphor-icons/react";
import { useApp } from "@/context/AppContext";
import { geocodeSearch, type GeocodeSuggestion } from "@/lib/geocode";
import styles from "./index.module.scss";

const RADIUS_OPTIONS = [5, 10, 25, 50, 100] as const;
const GEOCODE_DEBOUNCE_MS = 400;

const TYPE_ICON: Record<string, React.ReactNode> = {
  station: <MapPinIcon size={12} weight="bold" />,
  city: <BuildingsIcon size={12} weight="bold" />,
  postcode: <HashIcon size={12} weight="bold" />,
  place: <GlobeIcon size={12} weight="bold" />,
};

export default function SearchBar({ trailing }: { trailing?: React.ReactNode } = {}) {
  const {
    allStations, setSearchQuery, setSelectedStation,
    setMapCenter, setMapZoom, showAll, setShowAll,
    searchRadius, setSearchRadius, setSearchCircle, setSearchPin,
    radiusEnabled, setRadiusEnabled, activeCountry, setUserLocation,
  } = useApp();

  const [input, setInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [geoResults, setGeoResults] = useState<GeocodeSuggestion[]>([]);
  const [geoLoading, setGeoLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced geocode search, bounded by active country
  useEffect(() => {
    if (input.length < 3) { setGeoResults([]); setGeoLoading(false); return; }
    setGeoLoading(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      geocodeSearch(input, activeCountry)
        .then(setGeoResults)
        .catch(() => setGeoResults([]))
        .finally(() => setGeoLoading(false));
    }, GEOCODE_DEBOUNCE_MS);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [input, activeCountry]);

  const suggestions = useMemo(() => {
    if (input.length < 2) return [];
    const q = input.toLowerCase();
    const seen = new Set<string>();
    const results: { label: string; type: string; station?: typeof allStations[0]; lat?: number; lng?: number }[] = [];

    for (const s of allStations) {
      if (results.length >= 6) break;
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

    // Append geocoded place results (avoid duplicates with station results)
    for (const geo of geoResults) {
      if (results.length >= 10) break;
      results.push({ label: geo.label, type: "place", lat: geo.lat, lng: geo.lng });
    }

    return results;
  }, [input, allStations, geoResults]);

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
      setSearchPin(null);
    } else if (sug.type === "place" && sug.lat != null && sug.lng != null) {
      setSearchQuery("");
      setSelectedStation(null);
      setMapCenter([sug.lat, sug.lng]);
      setMapZoom(13);
      setSearchCircle({ lat: sug.lat, lng: sug.lng, radius: searchRadius * 1000 });
      setSearchPin({ lat: sug.lat, lng: sug.lng, label: sug.label });
      setRadiusEnabled(true);
      setUserLocation({ lat: sug.lat, lng: sug.lng });
    } else if (sug.type === "city") {
      const cityName = sug.label.split(",")[0].trim();
      setSearchQuery(cityName);
      setSearchCircle(null);

      const matching = allStations.filter((s) => s.city.toLowerCase() === cityName.toLowerCase());
      if (matching.length > 0) {
        const avgLat = matching.reduce((sum, s) => sum + s.lat, 0) / matching.length;
        const avgLng = matching.reduce((sum, s) => sum + s.lng, 0) / matching.length;
        setMapCenter([avgLat, avgLng]);
        setMapZoom(12);
        setSearchPin({ lat: avgLat, lng: avgLng, label: sug.label });
      }
    } else {
      // Postcode — show radius circle
      const postcode = sug.label.split(" — ")[0].trim();
      setSearchQuery(postcode);
      setSearchPin(null);

      const matching = allStations.filter((s) => s.postcode === postcode);
      if (matching.length > 0) {
        const avgLat = matching.reduce((sum, s) => sum + s.lat, 0) / matching.length;
        const avgLng = matching.reduce((sum, s) => sum + s.lng, 0) / matching.length;
        setMapCenter([avgLat, avgLng]);
        setMapZoom(12);
        setSearchCircle({ lat: avgLat, lng: avgLng, radius: searchRadius * 1000 });
      }
    }
  }, [setSelectedStation, setMapCenter, setMapZoom, setSearchQuery, setSearchCircle, setSearchPin, setRadiusEnabled, setUserLocation, allStations, searchRadius]);

  const handleClear = () => {
    setInput("");
    setSearchQuery("");
    setShowSuggestions(false);
    setActiveIndex(-1);
    setSearchCircle(null);
    setSearchPin(null);
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
        {geoLoading
          ? <SpinnerIcon size={14} weight="bold" className={`${styles.searchIcon} ${styles.spinner}`} />
          : <MagnifyingGlassIcon size={14} weight="bold" className={styles.searchIcon} />
        }
        <input
          ref={inputRef}
          type="text"
          className={styles.searchInput}
          placeholder="Search station, city, postcode, or place..."
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

        {/* Radius toggle + selector */}
        <button
          className={`${styles.toggleBtn} ${radiusEnabled ? styles.toggleBtnActive : ""}`}
          onClick={() => setRadiusEnabled(!radiusEnabled)}
          title={radiusEnabled ? "Disable radius filter" : "Enable radius filter"}
        >
          APPLY RADIUS
        </button>
        <div className={`${styles.radiusGroup} ${!radiusEnabled ? styles.radiusGroupDisabled : ""}`}>
          {RADIUS_OPTIONS.map((r) => (
            <button
              key={r}
              className={`${styles.radiusBtn} ${searchRadius === r && radiusEnabled ? styles.radiusBtnActive : ""}`}
              onClick={() => { setSearchRadius(r); setRadiusEnabled(true); }}
            >
              {r}
            </button>
          ))}
          <span className={styles.radiusUnit}>km</span>
        </div>
        {trailing}
      </div>
    </div>
  );
}
