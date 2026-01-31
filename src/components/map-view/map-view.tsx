"use client";

import React, { useEffect, useRef, useMemo, useState, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, CircleMarker, Circle, useMapEvents } from "react-leaflet";
import { MoonIcon, SunIcon } from "@phosphor-icons/react";
import L from "leaflet";
import { useApp } from "@/context/AppContext";
import { Station } from "@/lib/types";
import { haversineDistance } from "@/lib/stationUtils";
import styles from "./index.module.scss";

// Phosphor GasPump bold SVG path (viewBox 0 0 256 256)
const GAS_PUMP_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#0a0a0a" viewBox="0 0 256 256"><path d="M241,69.66,221.66,50.34a8,8,0,0,0-11.32,11.32L229.66,81A8,8,0,0,1,232,86.63V168a8,8,0,0,1-16,0V128a24,24,0,0,0-24-24H176V56a24,24,0,0,0-24-24H72A24,24,0,0,0,48,56V208H32a8,8,0,0,0,0,16H192a8,8,0,0,0,0-16H176V120h16a8,8,0,0,1,8,8v40a24,24,0,0,0,48,0V86.63A23.85,23.85,0,0,0,241,69.66ZM64,56a8,8,0,0,1,8-8h80a8,8,0,0,1,8,8v72a8,8,0,0,1-8,8H72a8,8,0,0,1-8-8Z"/></svg>`;

function createStationIcon(color: string, size = 30) {
  const pinH = size + 10;
  return L.divIcon({
    className: "",
    html: `<div style="
      width:${size}px;height:${pinH}px;position:relative;
      display:flex;flex-direction:column;align-items:center;
    ">
      <div style="
        width:${size}px;height:${size}px;
        border-radius:50% 50% 50% 0;
        transform:rotate(-45deg);
        background:${color};
        border:2px solid rgba(255,255,255,0.3);
        box-shadow:0 0 12px ${color}88, 0 2px 6px rgba(0,0,0,0.5);
        display:flex;align-items:center;justify-content:center;
      ">
        <div style="transform:rotate(45deg);display:flex;">${GAS_PUMP_SVG}</div>
      </div>
      <div style="
        width:6px;height:6px;
        background:${color};
        border-radius:50%;
        margin-top:2px;
        box-shadow:0 0 4px ${color}88;
      "></div>
    </div>`,
    iconSize: [size, pinH],
    iconAnchor: [size / 2, pinH],
    popupAnchor: [0, -pinH],
  });
}

function createPinIcon(color: string, label: string) {
  return L.divIcon({
    className: "",
    html: `<div style="
      display:flex;align-items:center;justify-content:center;
      width:32px;height:32px;border-radius:50%;background:${color};
      border:3px solid rgba(255,255,255,0.3);box-shadow:0 2px 8px rgba(0,0,0,0.4);
      color:#0a0a0a;font-weight:bold;font-size:13px;
    ">${label}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
}

const icons: Record<string, L.DivIcon> = {
  open: createStationIcon("#00ff41"),
  "closing-soon": createStationIcon("#ffd700"),
  closed: createStationIcon("#ff0033"),
  unknown: createStationIcon("#666666"),
};

const originIcon = createPinIcon("#00cc33", "A");
const destinationIcon = createPinIcon("#ff3344", "B");

const GOOGLE_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || "";

const CARTO_DARK_URL = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
const CARTO_LIGHT_URL = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
const CARTO_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>';

function SmartTileLayer({ darkMode }: { darkMode: boolean }) {
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [googleFailed, setGoogleFailed] = useState(false);
  const [prevDarkMode, setPrevDarkMode] = useState(darkMode);

  // Reset session when dark mode toggles so we create a new session with the right style
  if (darkMode !== prevDarkMode) {
    setPrevDarkMode(darkMode);
    setSessionToken(null);
  }

  useEffect(() => {
    if (!GOOGLE_KEY || googleFailed) return;
    const controller = new AbortController();
    const styles = darkMode
      ? [{ stylers: [{ invert_lightness: true }, { saturation: -100 }, { lightness: -30 }] }]
      : undefined;
    const body: Record<string, unknown> = { mapType: "roadmap", language: "en-AU", region: "AU" };
    if (styles) body.styles = styles;

    fetch(`https://tile.googleapis.com/v1/createSession?key=${GOOGLE_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
      .then((r) => {
        if (!r.ok) { setGoogleFailed(true); return null; }
        return r.json();
      })
      .then((data) => { if (data?.session) setSessionToken(data.session); })
      .catch(() => setGoogleFailed(true));
    return () => controller.abort();
  }, [googleFailed, darkMode]);

  // Fall back to CARTO if Google is unavailable
  if (!GOOGLE_KEY || !sessionToken || googleFailed) {
    return (
      <TileLayer
        key={darkMode ? "carto-dark" : "carto-light"}
        attribution={CARTO_ATTR}
        url={darkMode ? CARTO_DARK_URL : CARTO_LIGHT_URL}
        subdomains="abcd"
        maxZoom={20}
      />
    );
  }

  return (
    <TileLayer
      key={`google-${darkMode ? "dark" : "light"}`}
      attribution="&copy; Google"
      url={`https://tile.googleapis.com/v1/2dtiles/{z}/{x}/{y}?session=${sessionToken}&key=${GOOGLE_KEY}`}
      maxZoom={22}
      eventHandlers={{
        tileerror: (() => {
          let count = 0;
          return () => {
            count++;
            if (count >= 3) setGoogleFailed(true);
          };
        })(),
      }}
    />
  );
}

function MapEvents() {
  const { setMapCenter, setMapZoom } = useApp();
  const map = useMap();

  useEffect(() => {
    const handler = () => {
      const c = map.getCenter();
      setMapCenter([c.lat, c.lng]);
      setMapZoom(map.getZoom());
    };
    map.on("moveend", handler);
    return () => { map.off("moveend", handler); };
  }, [map, setMapCenter, setMapZoom]);

  return null;
}

function TripPickHandler() {
  const { tripPickMode, setTripPickMode, setTripOrigin, setTripDestination, allStations } = useApp();

  useMapEvents({
    click(e) {
      if (!tripPickMode) return;
      const { lat, lng } = e.latlng;

      // Find nearest station to label the point
      let nearest = "";
      let nearestDist = Infinity;
      for (const s of allStations) {
        const d = haversineDistance(lat, lng, s.lat, s.lng);
        if (d < nearestDist) {
          nearestDist = d;
          nearest = `${s.city}, ${s.state}`;
        }
      }
      const label = nearestDist < 100 ? `Near ${nearest}` : `${lat.toFixed(2)}, ${lng.toFixed(2)}`;

      if (tripPickMode === "origin") {
        setTripOrigin({ lat, lng, label });
      } else {
        setTripDestination({ lat, lng, label });
      }
      setTripPickMode(null);
    },
  });

  return null;
}

function PickModeCursor() {
  const { tripPickMode } = useApp();
  const map = useMap();

  useEffect(() => {
    const container = map.getContainer();
    if (tripPickMode) {
      container.style.cursor = "crosshair";
    } else {
      container.style.cursor = "";
    }
    return () => { container.style.cursor = ""; };
  }, [map, tripPickMode]);

  return null;
}

function RecenterMap({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  const prevRef = useRef<{ lat: number; lng: number; zoom: number } | null>(null);
  useEffect(() => {
    const prev = prevRef.current;
    if (prev && prev.lat === center[0] && prev.lng === center[1] && prev.zoom === zoom) return;
    map.flyTo(center, zoom, { duration: prev ? 1 : 0 });
    prevRef.current = { lat: center[0], lng: center[1], zoom };
  }, [map, center[0], center[1], zoom]);
  return null;
}

function StationMarker({ station }: { station: Station }) {
  const { setSelectedStation } = useApp();
  const icon = icons[station.status || "unknown"];

  const statusClass =
    station.status === "open" ? styles["status-open"] :
    station.status === "closing-soon" ? styles["status-closing-soon"] :
    station.status === "closed" ? styles["status-closed"] : styles["status-unknown"];

  return (
    <Marker
      position={[station.lat, station.lng]}
      icon={icon}
      eventHandlers={{ click: () => setSelectedStation(station) }}
    >
      <Popup>
        <strong className={styles["popup-name"]}>{station.name}</strong>
        <br />
        <span className={styles["popup-location"]}>
          {station.city}, {station.state} {station.postcode}
        </span>
        <br />
        <span className={`${styles["popup-status"]} ${statusClass}`}>
          {station.status === "open" ? "Open" :
           station.status === "closing-soon" ? "Closing Soon" :
           station.status === "closed" ? "Closed" : "Unknown"}
        </span>
      </Popup>
    </Marker>
  );
}

export default function MapView() {
  const { filteredStations, selectedStation, mapCenter, mapZoom, userLocation, tripPickMode, tripOrigin, tripDestination, searchCircle, tripStops } = useApp();
  const mapKeyRef = useRef(`map-${Date.now()}`);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("fuelmate-map-dark");
      if (saved !== null) return saved === "true";
    }
    return false;
  });
  const toggleDarkMode = useCallback(() => {
    setDarkMode((prev) => {
      const next = !prev;
      localStorage.setItem("fuelmate-map-dark", String(next));
      return next;
    });
  }, []);

  const visibleStations = useMemo(() => {
    const sliced = filteredStations.slice(0, 500);
    // Ensure the selected station is always visible on the map
    if (selectedStation && !sliced.some((s) => s.id === selectedStation.id)) {
      sliced.push(selectedStation);
    }
    // Ensure trip stops are always visible on the map
    for (const stop of tripStops) {
      if (!sliced.some((s) => s.id === stop.id)) {
        sliced.push(stop);
      }
    }
    return sliced;
  }, [filteredStations, selectedStation, tripStops]);

  return (
    <div className={`h-100 w-100 position-relative ${styles["map-wrapper"]}`}>
      {/* HUD overlays */}
      <div className={styles.crosshair} />
      <div className={styles["coord-readout"]}>
        LAT {mapCenter[0].toFixed(4)} | LNG {mapCenter[1].toFixed(4)}
      </div>

      {tripPickMode && (
        <div className={styles["pick-banner"]}>
          Click the map to set your {tripPickMode === "origin" ? "starting point" : "destination"}
        </div>
      )}
      <button
        className={styles["dark-toggle"]}
        onClick={toggleDarkMode}
        title={darkMode ? "Switch to light map" : "Switch to dark map"}
      >
        {darkMode ? <SunIcon size={16} weight="bold" /> : <MoonIcon size={16} weight="bold" />}
      </button>
      <MapContainer
        key={mapKeyRef.current}
        center={mapCenter}
        zoom={mapZoom}
        className="h-100 w-100"
        zoomControl={true}
      >
        <SmartTileLayer darkMode={darkMode} />
        <MapEvents />
        <TripPickHandler />
        <PickModeCursor />
        <RecenterMap center={mapCenter} zoom={mapZoom} />

        {userLocation && (
          <CircleMarker
            center={[userLocation.lat, userLocation.lng]}
            radius={8}
            pathOptions={{ color: "#00aaff", fillColor: "#00aaff", fillOpacity: 0.8 }}
          />
        )}

        {tripOrigin && (
          <Marker position={[tripOrigin.lat, tripOrigin.lng]} icon={originIcon}>
            <Popup>Start: {tripOrigin.label}</Popup>
          </Marker>
        )}
        {tripDestination && (
          <Marker position={[tripDestination.lat, tripDestination.lng]} icon={destinationIcon}>
            <Popup>Destination: {tripDestination.label}</Popup>
          </Marker>
        )}

        {searchCircle && (
          <Circle
            center={[searchCircle.lat, searchCircle.lng]}
            radius={searchCircle.radius}
            pathOptions={{
              color: "#00aaff",
              fillColor: "#00aaff",
              fillOpacity: 0.08,
              weight: 2,
              dashArray: "6 4",
            }}
          />
        )}

        {visibleStations.map((s) => (
          <StationMarker key={s.id} station={s} />
        ))}
      </MapContainer>
    </div>
  );
}
