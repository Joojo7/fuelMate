"use client";

import { FETCH_ERROR_TEXT, RETRY_LABEL, SYNCED_LABEL } from "@/lib/constants";
import { useEffect, useState } from "react";
import styles from "./data-status-banner.module.scss";

interface DataStatusBannerProps {
  fetchError: string | null;
  retryFetch: () => void;
  lastFetchTime: Date | null;
}

function getRelativeTime(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

export default function DataStatusBanner({ fetchError, retryFetch, lastFetchTime }: DataStatusBannerProps) {
  const [relativeTime, setRelativeTime] = useState("");

  useEffect(() => {
    if (!lastFetchTime) return;
    setRelativeTime(getRelativeTime(lastFetchTime));
    const interval = setInterval(() => {
      setRelativeTime(getRelativeTime(lastFetchTime));
    }, 30_000);
    return () => clearInterval(interval);
  }, [lastFetchTime]);

  if (fetchError) {
    return (
      <div className={`${styles.banner} ${styles.error}`}>
        <span className={styles["error-text"]}>⚠ {FETCH_ERROR_TEXT}</span>
        <button className={styles["retry-btn"]} onClick={retryFetch}>
          {RETRY_LABEL}
        </button>
      </div>
    );
  }

  if (lastFetchTime) {
    return (
      <div className={`${styles.banner} ${styles.freshness}`}>
        {SYNCED_LABEL}: {relativeTime}
      </div>
    );
  }

  return null;
}
