"use client";

import { useMemo } from "react";
import { useApp } from "@/context/AppContext";
import { BRAND_COLORS, BRAND_LABELS } from "@/lib/types";
import {
  HudPanel,
  HudDivider,
  HudStatLine,
  hudBaseChartOptions,
} from "@/components/hud-primitives/hud-primitives";
import {
  Chart as ChartJS,
  RadialLinearScale,
  ArcElement,
  Tooltip,
} from "chart.js";
import { PolarArea } from "react-chartjs-2";
import styles from "./index.module.scss";

ChartJS.register(RadialLinearScale, ArcElement, Tooltip);

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

  const chartData = useMemo(() => ({
    labels: brandData.map((b) => b.label),
    datasets: [{
      data: brandData.map((b) => b.count),
      backgroundColor: brandData.map((b) => `${b.color}99`),
      borderColor: brandData.map((b) => b.color),
      borderWidth: 2,
      hoverBackgroundColor: brandData.map((b) => `${b.color}cc`),
    }],
  }), [brandData]);

  const chartOptions = useMemo(() => ({
    ...hudBaseChartOptions,
    scales: {
      r: { display: false },
    },
    plugins: {
      ...hudBaseChartOptions.plugins,
      tooltip: {
        ...hudBaseChartOptions.plugins.tooltip,
        callbacks: {
          label: (ctx: { label?: string; raw?: unknown }) => {
            const val = ctx.raw as number;
            const pct = filteredStations.length
              ? ((val / filteredStations.length) * 100).toFixed(1)
              : "0";
            return `${ctx.label}: ${val} (${pct}%)`;
          },
        },
      },
    },
  }), [filteredStations.length]);

  if (brandData.length === 0) return null;

  return (
    <HudPanel style={{ padding: "12px 14px" }}>
      <div className={styles["chart-row"]}>
        <div className={styles["chart-box"]}>
          <PolarArea data={chartData} options={chartOptions} />
        </div>
        <div className={styles.legend}>
          {brandData.map((b) => (
            <div key={b.brand} className={styles["legend-item"]}>
              <span className={styles["legend-dot"]} style={{ background: b.color, boxShadow: `0 0 4px ${b.color}` }} />
              <span className={styles["legend-count"]}>{b.count}</span>
              {b.label}
              <span className={styles["legend-pct"]}>
                {filteredStations.length ? ((b.count / filteredStations.length) * 100).toFixed(0) : 0}%
              </span>
            </div>
          ))}
        </div>
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
