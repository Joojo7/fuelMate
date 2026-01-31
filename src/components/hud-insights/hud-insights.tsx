"use client";

import { useMemo } from "react";
import { useApp } from "@/context/AppContext";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { Radar } from "react-chartjs-2";
import styles from "./index.module.scss";

ChartJS.register(
  CategoryScale, LinearScale, BarElement,
  RadialLinearScale, PointElement, LineElement, Filler, Tooltip
);

const AMENITY_CATEGORIES: { label: string; match: (a: string) => boolean }[] = [
  { label: "Food", match: (a) => /cafe|coffee|food|hungry|uber/i.test(a) },
  { label: "EV", match: (a) => /pulse|ev|charg/i.test(a) },
  { label: "Wash", match: (a) => /wash|vacuum|jet/i.test(a) },
  { label: "ATM", match: (a) => /atm/i.test(a) },
  { label: "Truck", match: (a) => /truck|rigid|b-double|road train|high flow/i.test(a) },
  { label: "WiFi", match: (a) => /wifi/i.test(a) },
  { label: "Toilet", match: (a) => /toilet|shower/i.test(a) },
  { label: "Loyalty", match: (a) => /reward|smartfuel|bpme/i.test(a) },
];

const AU_STATES = ["NSW", "VIC", "QLD", "SA", "WA", "TAS", "NT", "ACT"];

const FONT = "'JetBrains Mono', monospace";

export default function HudInsights() {
  const { filteredStations, userLocation, mapCenter } = useApp();

  // Regional counts
  const regionData = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const st of AU_STATES) counts[st] = 0;
    let nzCount = 0;
    for (const s of filteredStations) {
      if (AU_STATES.includes(s.state)) {
        counts[s.state]++;
      } else {
        nzCount++;
      }
    }
    const labels = [...AU_STATES];
    const data = AU_STATES.map((st) => counts[st]);
    if (nzCount > 0) {
      labels.push("NZ");
      data.push(nzCount);
    }
    return { labels, data };
  }, [filteredStations]);

  // Amenity counts
  const amenityData = useMemo(() => {
    const counts = AMENITY_CATEGORIES.map(() => 0);
    for (const s of filteredStations) {
      const all = [...s.fuels, ...s.amenities];
      AMENITY_CATEGORIES.forEach((cat, i) => {
        if (all.some(cat.match)) counts[i]++;
      });
    }
    return counts;
  }, [filteredStations]);

  // Coverage radius
  const coverageKm = useMemo(() => {
    if (filteredStations.length === 0) return 0;
    const ref = userLocation || { lat: mapCenter[0], lng: mapCenter[1] };
    let maxDist = 0;
    for (const s of filteredStations) {
      if (s.distance !== undefined && s.distance > maxDist) {
        maxDist = s.distance;
      }
    }
    return maxDist;
  }, [filteredStations, userLocation, mapCenter]);

  const barChartData = useMemo(() => ({
    labels: regionData.labels,
    datasets: [{
      data: regionData.data,
      backgroundColor: "rgba(0, 255, 65, 0.5)",
      borderColor: "#00ff41",
      borderWidth: 1,
      borderRadius: 2,
      hoverBackgroundColor: "rgba(0, 255, 65, 0.8)",
    }],
  }), [regionData]);

  const barOptions = useMemo(() => ({
    indexAxis: "y" as const,
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 400 } as const,
    plugins: {
      tooltip: {
        backgroundColor: "rgba(10, 10, 10, 0.9)",
        titleColor: "#00ff41",
        bodyColor: "#00ff41",
        borderColor: "rgba(0, 255, 65, 0.3)",
        borderWidth: 1,
        titleFont: { family: FONT, size: 12 },
        bodyFont: { family: FONT, size: 12 },
      },
      legend: { display: false },
    },
    scales: {
      x: {
        beginAtZero: true,
        ticks: {
          color: "rgba(0, 255, 65, 0.35)",
          font: { family: FONT, size: 11 },
          stepSize: Math.ceil(Math.max(...regionData.data, 1) / 3),
        },
        grid: { color: "rgba(0, 255, 65, 0.06)" },
        border: { color: "rgba(0, 255, 65, 0.15)" },
      },
      y: {
        ticks: {
          color: "rgba(0, 255, 65, 0.5)",
          font: { family: FONT, size: 9, weight: 700 as const },
        },
        grid: { display: false },
        border: { color: "rgba(0, 255, 65, 0.15)" },
      },
    },
  }), [regionData]);

  const radarChartData = useMemo(() => ({
    labels: AMENITY_CATEGORIES.map((c) => c.label),
    datasets: [{
      data: amenityData,
      backgroundColor: "rgba(0, 255, 65, 0.12)",
      borderColor: "rgba(0, 255, 65, 0.6)",
      borderWidth: 1.5,
      pointBackgroundColor: "#00ff41",
      pointBorderColor: "#00ff41",
      pointRadius: 2,
      pointHoverRadius: 4,
    }],
  }), [amenityData]);

  const radarOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 400 } as const,
    plugins: {
      tooltip: {
        backgroundColor: "rgba(10, 10, 10, 0.9)",
        titleColor: "#00ff41",
        bodyColor: "#00ff41",
        borderColor: "rgba(0, 255, 65, 0.3)",
        borderWidth: 1,
        titleFont: { family: FONT, size: 12 },
        bodyFont: { family: FONT, size: 12 },
      },
      legend: { display: false },
    },
    scales: {
      r: {
        beginAtZero: true,
        ticks: {
          display: false,
          stepSize: Math.ceil(Math.max(...amenityData, 1) / 3),
        },
        grid: { color: "rgba(0, 255, 65, 0.08)" },
        angleLines: { color: "rgba(0, 255, 65, 0.1)" },
        pointLabels: {
          color: "rgba(0, 255, 65, 0.5)",
          font: { family: FONT, size: 10, weight: 700 as const },
        },
      },
    },
  }), [amenityData]);

  return (
    <div className={styles.panel}>
      <div className={styles["charts-row"]}>
        <div className={styles["chart-col"]}>
          <div className={styles["section-label"]}>By Region</div>
          <div className={styles["bar-wrapper"]}>
            <Bar data={barChartData} options={barOptions} />
          </div>
        </div>
        <div className={styles["chart-col"]}>
          <div className={styles["section-label"]}>Amenities</div>
          <div className={styles["radar-wrapper"]}>
            <Radar data={radarChartData} options={radarOptions} />
          </div>
        </div>
      </div>

      <div className={styles.divider} />

      <div className={styles["stat-line"]}>
        COVERAGE: <span className={styles["stat-val"]}>
          {coverageKm < 1
            ? `${Math.round(coverageKm * 1000)}m`
            : `${coverageKm.toFixed(0)}km`}
        </span>
        <span className={styles["stat-dim"]}> radius</span>
      </div>
    </div>
  );
}
