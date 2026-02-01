"use client";

import { useApp } from "@/context/AppContext";
import { haversineDistance } from "@/lib/stationUtils";
import { useMapEvents } from "react-leaflet";

export default function TripPickHandler() {
  const { tripPickMode, setTripPickMode, setTripOrigin, setTripDestination, allStations } = useApp();

  useMapEvents({
    click(e) {
      if (!tripPickMode) return;
      const { lat, lng } = e.latlng;

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
