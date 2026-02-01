"use client";

import { useMemo } from "react";
import { useApp } from "@/context/AppContext";
import { HUD_GREEN } from "@/lib/constants";
import {
  HudPanel,
  HudDivider,
  HudStatLine,
  hudBaseChartOptions,
} from "@/components/hud-primitives/hud-primitives";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
} from "chart.js";
import { Doughnut } from "react-chartjs-2";
import styles from "./index.module.scss";

ChartJS.register(ArcElement, Tooltip);

export default function HudStatusRing() {
  const { filteredStations, userLocation, mapCenter } = useApp();

  const statusCounts = useMemo(() => {
    const counts = { open: 0, "closing-soon": 0, closed: 0, unknown: 0 };
    for (const s of filteredStations) {
      const st = s.status || "unknown";
      counts[st]++;
    }
    return counts;
  }, [filteredStations]);

  const twentyFourCount = useMemo(
    () => filteredStations.filter((s) => s.open24Hours).length,
    [filteredStations]
  );

  const nearest = useMemo(() => {
    let best: { name: string; dist: number } | null = null;
    for (const s of filteredStations) {
      if (s.status !== "open" && s.status !== "closing-soon") continue;
      if (s.distance !== undefined) {
        if (!best || s.distance < best.dist) {
          best = { name: s.name, dist: s.distance };
        }
      }
    }
    return best;
  }, [filteredStations, userLocation, mapCenter]);

  const chartData = useMemo(() => ({
    labels: ["Open", "Closing Soon", "Closed", "Unknown"],
    datasets: [{
      data: [statusCounts.open, statusCounts["closing-soon"], statusCounts.closed, statusCounts.unknown],
      backgroundColor: [
        "rgba(0, 255, 65, 0.7)",
        "rgba(255, 215, 0, 0.7)",
        "rgba(255, 0, 51, 0.7)",
        "rgba(102, 102, 102, 0.5)",
      ],
      borderColor: [HUD_GREEN, "#ffd700", "#ff0033", "#666666"],
      borderWidth: 1,
      hoverOffset: 4,
    }],
  }), [statusCounts]);

  const chartOptions = useMemo(() => ({
    ...hudBaseChartOptions,
    cutout: "65%",
    plugins: {
      ...hudBaseChartOptions.plugins,
      tooltip: {
        ...hudBaseChartOptions.plugins.tooltip,
        bodyColor: "#cccccc",
      },
    },
  }), []);

  const nearestValue = nearest
    ? nearest.dist < 1
      ? `${Math.round(nearest.dist * 1000)}m`
      : `${nearest.dist.toFixed(1)}km`
    : null;

  const nearestDim = nearest
    ? nearest.name.length > 18 ? nearest.name.slice(0, 18) + "..." : nearest.name
    : null;

  return (
    <HudPanel style={{ padding: "12px 14px" }}>
      <div className={styles["chart-row"]}>
        <div className={styles["chart-box"]}>
          <Doughnut data={chartData} options={chartOptions} />
          <div className={styles["chart-center"]}>
            <span className={styles["chart-center-num"]}>{filteredStations.length}</span>
          </div>
        </div>
        <div className={styles["legend"]}>
          <div className={styles["legend-item"]}>
            <span className={`${styles["legend-dot"]} ${styles["dot-open"]}`} />
            <span>{statusCounts.open}</span> OPN
          </div>
          <div className={styles["legend-item"]}>
            <span className={`${styles["legend-dot"]} ${styles["dot-closing"]}`} />
            <span>{statusCounts["closing-soon"]}</span> CSN
          </div>
          <div className={styles["legend-item"]}>
            <span className={`${styles["legend-dot"]} ${styles["dot-closed"]}`} />
            <span>{statusCounts.closed}</span> CLS
          </div>
          <div className={styles["legend-item"]}>
            <span className={`${styles["legend-dot"]} ${styles["dot-unknown"]}`} />
            <span>{statusCounts.unknown}</span> UNK
          </div>
        </div>
      </div>

      <HudDivider />

      <HudStatLine
        label="24H STATIONS"
        value={twentyFourCount}
        dim={`/ ${filteredStations.length}`}
      />

      {nearest && (
        <HudStatLine
          label="NEAREST"
          value={nearestValue}
          dim={nearestDim}
        />
      )}
    </HudPanel>
  );
}
