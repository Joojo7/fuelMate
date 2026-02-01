"use client";

import { useMemo } from "react";
import { useApp } from "@/context/AppContext";
import { BRAND_COLORS, BRAND_LABELS } from "@/lib/types";
import {
  HudPanel,
  HudDivider,
  HudStatLine,
} from "@/components/hud-primitives/hud-primitives";
import styles from "./index.module.scss";

export default function HudBrandDist() {
  const { filteredStations } = useApp();

  const brandData = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const s of filteredStations) {
      counts[s.brand] = (counts[s.brand] || 0) + 1;
    }
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return sorted.map(([brand, count]) => ({
      brand,
      label: BRAND_LABELS[brand] || brand,
      count,
      color: BRAND_COLORS[brand]?.primary || "#666666",
    }));
  }, [filteredStations]);

  const topBrand = brandData[0];
  const maxCount = topBrand?.count || 1;

  if (brandData.length === 0) return null;

  return (
    <HudPanel style={{ padding: "12px 14px" }}>
      <div className={styles["gauge-stack"]}>
        {brandData.map((b) => {
          const pct = (b.count / maxCount) * 100;
          const pctOfTotal = filteredStations.length
            ? ((b.count / filteredStations.length) * 100).toFixed(0)
            : "0";
          return (
            <div key={b.brand} className={styles["gauge-row"]}>
              <span className={styles["gauge-label"]} style={{ color: b.color }}>{b.label}</span>
              <div className={styles["gauge-track"]}>
                <div
                  className={styles["gauge-fill"]}
                  style={{
                    width: `${pct}%`,
                    background: b.color,
                    boxShadow: `0 0 10px ${b.color}, 0 0 20px ${b.color}88`,
                  }}
                />
                <div className={styles["gauge-scanline"]} />
              </div>
              <span className={styles["gauge-val"]}>{b.count}</span>
              <span className={styles["gauge-pct"]}>{pctOfTotal}%</span>
            </div>
          );
        })}
      </div>

      <HudDivider />

      <HudStatLine
        label="DOMINANT"
        value={topBrand?.label || "N/A"}
        dim={topBrand ? `${((topBrand.count / filteredStations.length) * 100).toFixed(0)}%` : undefined}
      />
      <HudStatLine
        label="BRANDS"
        value={brandData.length}
        dim="active"
      />
    </HudPanel>
  );
}
