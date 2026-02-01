"use client";

import { useApp } from "@/context/AppContext";
import { useEffect } from "react";
import { useMap } from "react-leaflet";

export default function MapEvents() {
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
