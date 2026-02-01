"use client";

import { useApp } from "@/context/AppContext";
import { useEffect } from "react";
import { useMap } from "react-leaflet";

export default function PickModeCursor() {
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
