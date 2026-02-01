"use client";

import {
  FUEL_PREF_CONTINUE,
  FUEL_PREF_HEADING,
  FUEL_PREF_OPTIONS,
  FUEL_PREF_SKIP,
  FUEL_PREF_SUBHEADING,
} from "@/lib/constants";
import { useState } from "react";
import styles from "./fuel-picker-splash.module.scss";

interface FuelPickerSplashProps {
  onComplete: (selectedFuels: string[]) => void;
}

export default function FuelPickerSplash({ onComplete }: FuelPickerSplashProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = (fuel: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(fuel)) next.delete(fuel);
      else next.add(fuel);
      return next;
    });
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.card}>
        <h2 className={styles.heading}>{FUEL_PREF_HEADING}</h2>
        <p className={styles.subheading}>{FUEL_PREF_SUBHEADING}</p>

        <div className={styles.grid}>
          {FUEL_PREF_OPTIONS.map((fuel) => (
            <button
              key={fuel}
              className={`${styles["fuel-btn"]} ${selected.has(fuel) ? styles["fuel-btn-selected"] : ""}`}
              onClick={() => toggle(fuel)}
            >
              {fuel}
            </button>
          ))}
        </div>

        <button
          className={styles["continue-btn"]}
          disabled={selected.size === 0}
          onClick={() => onComplete(Array.from(selected))}
        >
          {FUEL_PREF_CONTINUE}
        </button>

        <button className={styles.skip} onClick={() => onComplete([])}>
          {FUEL_PREF_SKIP}
        </button>
      </div>
    </div>
  );
}
