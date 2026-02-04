"use client";

import { useApp } from "@/context/AppContext";
import { MAX_VISIBLE_STATIONS, USER_LOCATION_COLOR } from "@/lib/constants";
import { MoonIcon, SunIcon } from "@phosphor-icons/react";
import L from "leaflet";
import { useCallback, useMemo, useRef, useState } from "react";
import MarkerClusterGroup from "react-leaflet-cluster";
import { Circle, CircleMarker, MapContainer, Marker, Popup } from "react-leaflet";
import styles from "./index.module.scss";
import MapEvents from "./map-events";
import { createClusterIcon, destinationIcon, originIcon, searchPinIcon } from "./map-icons";
import PickModeCursor from "./pick-mode-cursor";
import RecenterMap from "./recenter-map";
import SmartTileLayer from "./smart-tile-layer";
import StationMarker from "./station-marker";
import TripPickHandler from "./trip-pick-handler";

const USER_LOCATION_PATH: L.CircleMarkerOptions = {
  color: USER_LOCATION_COLOR,
  fillColor: USER_LOCATION_COLOR,
  fillOpacity: 0.8,
};

const SEARCH_CIRCLE_PATH: L.PathOptions = {
  color: USER_LOCATION_COLOR,
  fillColor: USER_LOCATION_COLOR,
  fillOpacity: 0.08,
  weight: 2,
  dashArray: "6 4",
};

export default function MapView() {
  const { filteredStations, selectedStation, mapCenter, mapZoom, userLocation, tripPickMode, tripOrigin, tripDestination, searchCircle, searchPin, tripStops } = useApp();
  const mapKeyRef = useRef(`map-${Date.now()}`);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("pitstop-map-dark");
      if (saved !== null) return saved === "true";
    }
    return false;
  });
  const toggleDarkMode = useCallback(() => {
    setDarkMode((prev) => {
      const next = !prev;
      localStorage.setItem("pitstop-map-dark", String(next));
      return next;
    });
  }, []);

  const visibleStations = useMemo(() => {
    const sliced = filteredStations.slice(0, MAX_VISIBLE_STATIONS);
    if (selectedStation && !sliced.some((s) => s.id === selectedStation.id)) {
      sliced.push(selectedStation);
    }
    for (const stop of tripStops) {
      if (!sliced.some((s) => s.id === stop.id)) {
        sliced.push(stop);
      }
    }
    return sliced;
  }, [filteredStations, selectedStation, tripStops]);

  return (
    <div className={`h-100 w-100 position-relative ${styles["map-wrapper"]}`}>
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
            pathOptions={USER_LOCATION_PATH}
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
            pathOptions={SEARCH_CIRCLE_PATH}
          />
        )}

        {searchPin && (
          <Marker position={[searchPin.lat, searchPin.lng]} icon={searchPinIcon}>
            <Popup>{searchPin.label}</Popup>
          </Marker>
        )}

        <MarkerClusterGroup
          chunkedLoading
          maxClusterRadius={60}
          iconCreateFunction={createClusterIcon}
        >
          {visibleStations.map((s) => (
            <StationMarker key={s.id} station={s} />
          ))}
        </MarkerClusterGroup>
      </MapContainer>
    </div>
  );
}
