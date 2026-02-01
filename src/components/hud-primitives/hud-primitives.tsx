"use client";

import { ReactNode } from "react";
import { HUD_GREEN } from "@/lib/constants";
import styles from "./index.module.scss";

/* ─── HUD Font ─── */
export const HUD_FONT = "'JetBrains Mono', monospace";

/* ─── Layout primitives ─── */

export function HudPanel({
  children,
  className,
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`${styles.panel}${className ? ` ${className}` : ""}`}
      style={style}
    >
      {children}
    </div>
  );
}

export function HudSectionLabel({ children }: { children: ReactNode }) {
  return <div className={styles["section-label"]}>{children}</div>;
}

export function HudDivider() {
  return <div className={styles.divider} />;
}

export function HudStatLine({
  label,
  value,
  dim,
}: {
  label: string;
  value: ReactNode;
  dim?: ReactNode;
}) {
  return (
    <div className={styles["stat-line"]}>
      {label}: <span className={styles["stat-val"]}>{value}</span>
      {dim && <span className={styles["stat-dim"]}> {dim}</span>}
    </div>
  );
}

/* ─── Shared Chart.js configuration ─── */

export const hudTooltipConfig = {
  backgroundColor: "rgba(10, 10, 10, 0.9)",
  titleColor: HUD_GREEN,
  bodyColor: HUD_GREEN,
  borderColor: "rgba(0, 255, 65, 0.3)",
  borderWidth: 1,
  titleFont: { family: HUD_FONT, size: 12 },
  bodyFont: { family: HUD_FONT, size: 12 },
} as const;

export const hudBaseChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  animation: { duration: 400 } as const,
  plugins: {
    tooltip: hudTooltipConfig,
    legend: { display: false },
  },
} as const;

/* ─── Common scale helpers ─── */

export function hudAxisStyle(
  color: string = "rgba(0, 255, 65, 0.5)",
  fontSize: number = 11,
  weight?: number,
) {
  return {
    color,
    font: {
      family: HUD_FONT,
      size: fontSize,
      ...(weight !== undefined ? { weight: weight as 700 } : {}),
    },
  };
}

export const hudGridStyle = { color: "rgba(0, 255, 65, 0.06)" };
export const hudBorderStyle = { color: "rgba(0, 255, 65, 0.15)" };
