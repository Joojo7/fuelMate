"use client";

import {
  CARTO_ATTRIBUTION,
  CARTO_DARK_URL,
  CARTO_LIGHT_URL,
  GOOGLE_ATTRIBUTION,
} from "@/lib/constants";
import { useEffect, useState } from "react";
import { TileLayer } from "react-leaflet";

const GOOGLE_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || "";

export default function SmartTileLayer({ darkMode }: { darkMode: boolean }) {
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [googleFailed, setGoogleFailed] = useState(false);
  const [prevDarkMode, setPrevDarkMode] = useState(darkMode);

  if (darkMode !== prevDarkMode) {
    setPrevDarkMode(darkMode);
    setSessionToken(null);
  }

  useEffect(() => {
    if (!GOOGLE_KEY || googleFailed) return;
    const controller = new AbortController();
    const darkStyles = [{ stylers: [{ invert_lightness: true }, { saturation: -100 }, { lightness: -30 }] }];
    const body: Record<string, unknown> = { mapType: "roadmap", language: "en-AU", region: "AU" };
    if (darkMode) body.styles = darkStyles;

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

  if (!GOOGLE_KEY || !sessionToken || googleFailed) {
    return (
      <TileLayer
        key={darkMode ? "carto-dark" : "carto-light"}
        attribution={CARTO_ATTRIBUTION}
        url={darkMode ? CARTO_DARK_URL : CARTO_LIGHT_URL}
        subdomains="abcd"
        maxZoom={20}
      />
    );
  }

  return (
    <TileLayer
      key={`google-${darkMode ? "dark" : "light"}`}
      attribution={GOOGLE_ATTRIBUTION}
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
