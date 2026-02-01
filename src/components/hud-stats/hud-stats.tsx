"use client";

import { useMemo } from "react";
import { useApp } from "@/context/AppContext";
import { HUD_GREEN } from "@/lib/constants";
import {
  HudPanel,
  HudSectionLabel,
  HudDivider,
  hudBaseChartOptions,
  hudAxisStyle,
  hudGridStyle,
  hudBorderStyle,
} from "@/components/hud-primitives/hud-primitives";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import styles from "./index.module.scss";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

const FUEL_TYPES: { key: string; label: string; match: (f: string) => boolean }[] = [
  { key: "ulp", label: "ULP", match: (f) => /unlead|ulp|91|e10/i.test(f) && !/premium|ultimate/i.test(f) },
  { key: "dsl", label: "DSL", match: (f) => /diesel/i.test(f) && !/premium|ultimate/i.test(f) },
  { key: "prm", label: "PRM", match: (f) => /premium|ultimate|95|98/i.test(f) },
  { key: "ev", label: "EV", match: (f) => /pulse|ev|charg/i.test(f) },
  { key: "lpg", label: "LPG", match: (f) => /lpg|autogas/i.test(f) },
  { key: "adb", label: "ADB", match: (f) => /adblue/i.test(f) },
];

export default function HudStats() {
  const { filteredStations, allStations, filters } = useApp();

  const fuelCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const ft of FUEL_TYPES) counts[ft.key] = 0;
    for (const s of filteredStations) {
      for (const ft of FUEL_TYPES) {
        if (s.fuels.some(ft.match)) counts[ft.key]++;
      }
    }
    return counts;
  }, [filteredStations]);

  const activeFilterCount = useMemo(() => {
    return (
      (filters.brand?.length || 0) +
      (filters.region?.length || 0) +
      filters.fuels.length +
      filters.ev.length +
      filters.foodDrink.length +
      filters.vehicleServices.length +
      filters.truckAmenities.length +
      filters.convenience.length +
      filters.loyalty.length +
      filters.siteType.length +
      filters.accessibility.length
    );
  }, [filters]);

  const chartData = useMemo(() => ({
    labels: FUEL_TYPES.map((ft) => ft.label),
    datasets: [
      {
        data: FUEL_TYPES.map((ft) => fuelCounts[ft.key]),
        backgroundColor: "rgba(0, 255, 65, 0.6)",
        borderColor: HUD_GREEN,
        borderWidth: 1,
        borderRadius: 2,
        hoverBackgroundColor: "rgba(0, 255, 65, 0.85)",
      },
    ],
  }), [fuelCounts]);

  const chartOptions = useMemo(() => ({
    ...hudBaseChartOptions,
    scales: {
      x: {
        ticks: hudAxisStyle("rgba(0, 255, 65, 0.5)", 12, 700),
        grid: hudGridStyle,
        border: hudBorderStyle,
      },
      y: {
        beginAtZero: true,
        ticks: {
          ...hudAxisStyle("rgba(0, 255, 65, 0.35)", 11),
          stepSize: Math.ceil(Math.max(...Object.values(fuelCounts), 1) / 4),
        },
        grid: hudGridStyle,
        border: hudBorderStyle,
      },
    },
  }), [fuelCounts]);

  return (
    <HudPanel className="h-100" style={{ padding: "24px 30px" }}>
      <HudSectionLabel>Fuel Distribution</HudSectionLabel>
      <div className={styles["chart-wrapper"]}>
        <Bar data={chartData} options={chartOptions} />
      </div>

      <HudDivider />

      <div className={styles["filter-line"]}>
        {activeFilterCount > 0 ? (
          <>FILTERS: <span className={styles["filter-count"]}>{activeFilterCount}</span> ACTIVE</>
        ) : (
          <>ALL TARGETS VISIBLE</>
        )}
      </div>
      <div className={styles["filter-line"]}>
        SHOWING <span className={styles["filter-count"]}>{filteredStations.length}</span>
        <span className={styles["filter-dim"]}> / {allStations.length}</span>
      </div>
    </HudPanel>
  );
}
