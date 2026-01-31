"use client";

import { useMemo } from "react";
import { useApp } from "@/context/AppContext";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
} from "chart.js";
import { Doughnut } from "react-chartjs-2";
import styles from "./index.module.scss";

ChartJS.register(ArcElement, Tooltip);

export default function HudStatusRing() {
  const { filteredStations, allStations, userLocation, mapCenter } = useApp();

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
    const ref = userLocation || { lat: mapCenter[0], lng: mapCenter[1] };
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
      borderColor: [
        "#00ff41",
        "#ffd700",
        "#ff0033",
        "#666666",
      ],
      borderWidth: 1,
      hoverOffset: 4,
    }],
  }), [statusCounts]);

  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    cutout: "65%",
    animation: { duration: 400 } as const,
    plugins: {
      tooltip: {
        backgroundColor: "rgba(10, 10, 10, 0.9)",
        titleColor: "#00ff41",
        bodyColor: "#cccccc",
        borderColor: "rgba(0, 255, 65, 0.3)",
        borderWidth: 1,
        titleFont: { family: "'JetBrains Mono', monospace", size: 12 },
        bodyFont: { family: "'JetBrains Mono', monospace", size: 12 },
      },
      legend: { display: false },
    },
  }), []);

  return (
    <div className={styles.panel}>
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

      <div className={styles.divider} />

      <div className={styles["stat-line"]}>
        24H STATIONS: <span className={styles["stat-val"]}>{twentyFourCount}</span>
        <span className={styles["stat-dim"]}> / {filteredStations.length}</span>
      </div>

      {nearest && (
        <div className={styles["stat-line"]}>
          NEAREST: <span className={styles["stat-val"]}>
            {nearest.dist < 1
              ? `${Math.round(nearest.dist * 1000)}m`
              : `${nearest.dist.toFixed(1)}km`}
          </span>
          <span className={styles["stat-dim"]}> {nearest.name.length > 18 ? nearest.name.slice(0, 18) + "..." : nearest.name}</span>
        </div>
      )}
    </div>
  );
}
