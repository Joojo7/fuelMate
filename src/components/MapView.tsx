"use client";

import React, { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, CircleMarker } from "react-leaflet";
import L from "leaflet";
import { useApp } from "@/context/AppContext";
import { Station } from "@/lib/types";

function createIcon(color: string) {
  return L.divIcon({
    className: "",
    html: `<div style="
      width:14px;height:14px;border-radius:50%;background:${color};
      border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}

const icons = {
  open: createIcon("#16a34a"),
  "closing-soon": createIcon("#d97706"),
  closed: createIcon("#dc2626"),
  unknown: createIcon("#6b7280"),
};

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

function RecenterMap({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, []); // only on mount
  return null;
}

function StationMarker({ station }: { station: Station }) {
  const { setSelectedStation } = useApp();
  const icon = icons[station.status || "unknown"];

  return (
    <Marker
      position={[station.lat, station.lng]}
      icon={icon}
      eventHandlers={{ click: () => setSelectedStation(station) }}
    >
      <Popup>
        <strong>{station.name}</strong>
        <br />
        {station.city}, {station.state} {station.postcode}
        <br />
        <span className={`status-${station.status}`}>
          {station.status === "open" ? "Open" :
           station.status === "closing-soon" ? "Closing Soon" :
           station.status === "closed" ? "Closed" : "Hours Unknown"}
        </span>
      </Popup>
    </Marker>
  );
}

export default function MapView() {
  const { filteredStations, mapCenter, mapZoom, userLocation } = useApp();

  // Limit markers to prevent performance issues
  const visibleStations = useMemo(() => {
    return filteredStations.slice(0, 500);
  }, [filteredStations]);

  return (
    <MapContainer
      center={mapCenter}
      zoom={mapZoom}
      className="h-full w-full"
      zoomControl={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapEvents />
      <RecenterMap center={mapCenter} zoom={mapZoom} />

      {userLocation && (
        <CircleMarker
          center={[userLocation.lat, userLocation.lng]}
          radius={8}
          pathOptions={{ color: "#3b82f6", fillColor: "#3b82f6", fillOpacity: 0.8 }}
        />
      )}

      {visibleStations.map((s) => (
        <StationMarker key={s.id} station={s} />
      ))}
    </MapContainer>
  );
}
