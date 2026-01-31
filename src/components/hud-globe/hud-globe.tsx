"use client";

import styles from "./index.module.scss";

export default function HudGlobe() {
  return (
    <div className={styles["globe-container"]}>
      <div className={styles["globe-wrapper"]}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/world.svg"
          alt="World map"
          className={styles["globe-img"]}
          draggable={false}
        />
        <div className={styles["globe-overlay"]} />
        <div className={styles["scan-line"]} />
      </div>
      <div className={styles["region-label"]}>REGION: AU / NZ</div>
    </div>
  );
}
