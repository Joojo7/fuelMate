"use client";

import { useApp } from "@/context/AppContext";
import { useEffect } from "react";
import { useMap } from "react-leaflet";

const CROSSHAIR_SVG = `<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32'><line x1='16' y1='0' x2='16' y2='12' stroke='%2300ff41' stroke-width='2.5'/><line x1='16' y1='20' x2='16' y2='32' stroke='%2300ff41' stroke-width='2.5'/><line x1='0' y1='16' x2='12' y2='16' stroke='%2300ff41' stroke-width='2.5'/><line x1='20' y1='16' x2='32' y2='16' stroke='%2300ff41' stroke-width='2.5'/><circle cx='16' cy='16' r='2' fill='%2300ff41'/></svg>`;
const CROSSHAIR_CURSOR = `url("data:image/svg+xml,${CROSSHAIR_SVG}") 16 16, crosshair`;

export default function PickModeCursor() {
  const { tripPickMode } = useApp();
  const map = useMap();

  useEffect(() => {
    const container = map.getContainer();
    if (tripPickMode) {
      container.style.cursor = CROSSHAIR_CURSOR;
    } else {
      container.style.cursor = "";
    }
    return () => { container.style.cursor = ""; };
  }, [map, tripPickMode]);

  return null;
}
