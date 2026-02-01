"use client";

import { COUNTRY_FLAGS, COUNTRY_OPTIONS, type CountryCode } from "@/lib/types";
import styles from "./index.module.scss";

interface CountryPickerProps {
  activeCountry: CountryCode;
  activeCountryLabel: string;
  showCountryPicker: boolean;
  setShowCountryPicker: (v: boolean) => void;
  setActiveCountry: (c: CountryCode) => void;
  onSelect?: () => void;
}

export default function CountryPicker({
  activeCountry,
  activeCountryLabel,
  showCountryPicker,
  setShowCountryPicker,
  setActiveCountry,
  onSelect,
}: CountryPickerProps) {
  return (
    <div className={styles["country-picker"]}>
      <button
        className={`${styles["country-trigger"]} ${showCountryPicker ? styles["country-trigger-open"] : ""}`}
        onClick={() => setShowCountryPicker(!showCountryPicker)}
        onBlur={() => setTimeout(() => setShowCountryPicker(false), 150)}
      >
        <span className={styles["country-flag"]}>{COUNTRY_FLAGS[activeCountry]}</span>
        {activeCountryLabel}
        <span className={`${styles["country-caret"]} ${showCountryPicker ? styles["country-caret-open"] : ""}`}>&#9660;</span>
      </button>
      {showCountryPicker && (
        <div className={styles["country-dropdown"]}>
          {COUNTRY_OPTIONS.map((c) => (
            <button
              key={c.code}
              className={`${styles["country-item"]} ${c.code === activeCountry ? styles["country-item-active"] : ""}`}
              onMouseDown={() => { setActiveCountry(c.code); setShowCountryPicker(false); onSelect?.(); }}
            >
              <span className={styles["country-flag"]}>{COUNTRY_FLAGS[c.code]}</span>
              {c.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
