"use client";

import styles from "./map-skeleton.module.scss";

export default function MapSkeleton() {
  return (
    <div className={styles.wrapper}>
      {/* Faux grid lines */}
      <div className={styles.grid} />

      {/* Crosshair center */}
      <div className={styles.crosshair}>
        <div className={styles["crosshair-h"]} />
        <div className={styles["crosshair-v"]} />
      </div>

      {/* Scatter skeleton markers */}
      {[
        { top: "22%", left: "35%" },
        { top: "40%", left: "55%" },
        { top: "60%", left: "30%" },
        { top: "48%", left: "70%" },
        { top: "32%", left: "60%" },
        { top: "70%", left: "50%" },
      ].map((pos, i) => (
        <span key={i} className={styles.pin} style={pos} />
      ))}

      <div className={styles.label}>
        ACQUIRING TARGETS<span className="tm-blink">...</span>
      </div>
    </div>
  );
}
