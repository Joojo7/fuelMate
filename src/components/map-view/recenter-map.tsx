"use client";

import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";

export default function RecenterMap({ center, zoom }: { center: [number, number]; zoom: number }) {
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
