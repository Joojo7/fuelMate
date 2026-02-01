"use client";

import { useApp } from "@/context/AppContext";
import { STATUS_LABELS } from "@/lib/constants";
import { BRAND_COLORS, BRAND_LABELS, Station } from "@/lib/types";
import { Marker, Popup } from "react-leaflet";
import styles from "./index.module.scss";
import { getStationIcon } from "./map-icons";

const STATUS_STYLE_MAP: Record<string, string> = {
  open: styles["status-open"],
  "closing-soon": styles["status-closing-soon"],
  closed: styles["status-closed"],
};

export default function StationMarker({ station }: { station: Station }) {
  const { selectedStation, setSelectedStation } = useApp();
  const isSelected = selectedStation?.id === station.id;
  const icon = getStationIcon(station.brand, station.status || "unknown", isSelected);
  const statusClass = STATUS_STYLE_MAP[station.status || ""] || styles["status-unknown"];
  const brandColor = BRAND_COLORS[station.brand]?.primary || "#666";

  return (
    <Marker
      position={[station.lat, station.lng]}
      icon={icon}
      zIndexOffset={isSelected ? 1000 : 0}
      eventHandlers={{ click: () => setSelectedStation(station) }}
    >
      <Popup>
        <strong className={styles["popup-name"]}>{station.name}</strong>
        <span className={styles["popup-brand"]} style={{ color: brandColor }}>
          {BRAND_LABELS[station.brand] || station.brand}
        </span>
        <br />
        <span className={styles["popup-location"]}>
          {station.city}, {station.state} {station.postcode}
        </span>
        <br />
        <span className={`${styles["popup-status"]} ${statusClass}`}>
          {STATUS_LABELS[station.status || "unknown"] || "Unknown"}
        </span>
      </Popup>
    </Marker>
  );
}
