"use client";

import { BRAND_NAME } from "@/lib/constants";
import Link from "next/link";
import styles from "./disclaimer-splash.module.scss";

interface DisclaimerSplashProps {
  onAccept: () => void;
}

export default function DisclaimerSplash({ onAccept }: DisclaimerSplashProps) {
  return (
    <div className={styles.overlay}>
      <div className={styles.card}>
        <div className={styles.brand}>{BRAND_NAME}</div>
        <div className={styles.tagline}>Fuel Station Finder &amp; Trip Planner</div>

        <hr className={styles.divider} />

        <h2 className={styles.heading}>⚠ Before you continue</h2>
        <div className={styles.warning}>
          <p>
            This application is provided <strong>&quot;AS IS&quot;</strong> with <strong>no
            warranty of any kind</strong>. Station data — including locations, hours, fuel types,
            and open/closed status — <strong>may be inaccurate, outdated, or entirely
            wrong</strong>.
          </p>
          <p>
            Pitstop is <strong>NOT affiliated with</strong> BP, Shell, Caltex, TotalEnergies,
            or any fuel retailer. All trademarks belong to their respective owners.
          </p>
          <p>
            <strong>Do not rely on this app for critical decisions.</strong> The developer(s) accept
            <strong> no liability</strong> for any damages arising from use of this application.
          </p>
        </div>

        <div className={styles.attribution}>
          <h2 className={styles.heading}>Data sources</h2>
          <p>
            Station data from BP (AU/NZ), Shell, TotalEnergies, and Caltex. Map tiles by
            Google Maps &amp; CARTO. Map data © OpenStreetMap contributors (ODbL).
          </p>
        </div>

        <div className={styles["privacy-note"]}>
          Your location is used only to show nearby stations and is <strong>never stored
          or shared</strong>. No cookies. No tracking. No accounts.
          {" "}<Link href="/privacy">Read the full policy →</Link>
        </div>

        <div className={styles.actions}>
          <button className={styles["continue-btn"]} onClick={onAccept}>
            I UNDERSTAND — CONTINUE TO MAP
          </button>
          <span className={styles["full-policy"]}>
            <Link href="/privacy">VIEW FULL LEGAL &amp; PRIVACY POLICY</Link>
          </span>
        </div>
      </div>
    </div>
  );
}
