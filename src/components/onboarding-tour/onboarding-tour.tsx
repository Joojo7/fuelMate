"use client";

import { TOUR_STEPS, TOUR_STORAGE_KEY } from "@/lib/constants";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import type { CallBackProps, Step } from "react-joyride";
import "./tour-theme.scss";

const Joyride = dynamic(() => import("react-joyride"), { ssr: false });

const STEPS: Step[] = [
  {
    target: '[data-tour="brand"]',
    title: TOUR_STEPS.welcome.title,
    content: TOUR_STEPS.welcome.content,
    placement: "bottom",
    disableBeacon: true,
  },
  {
    target: '[data-tour="search"]',
    title: TOUR_STEPS.search.title,
    content: TOUR_STEPS.search.content,
    placement: "bottom",
  },
  {
    target: '[data-tour="country"]',
    title: TOUR_STEPS.country.title,
    content: TOUR_STEPS.country.content,
    placement: "bottom",
  },
  {
    target: '[data-tour="map"]',
    title: TOUR_STEPS.map.title,
    content: TOUR_STEPS.map.content,
    placement: "center",
  },
  {
    target: '[data-tour="filters"]',
    title: TOUR_STEPS.filters.title,
    content: TOUR_STEPS.filters.content,
    placement: "bottom",
  },
  {
    target: '[data-tour="tabs"]',
    title: TOUR_STEPS.tabs.title,
    content: TOUR_STEPS.tabs.content,
    placement: "bottom",
  },
  {
    target: '[data-tour="hud"]',
    title: TOUR_STEPS.hud.title,
    content: TOUR_STEPS.hud.content,
    placement: "top",
  },
];

export default function OnboardingTour() {
  const [run, setRun] = useState(false);

  useEffect(() => {
    const done = localStorage.getItem(TOUR_STORAGE_KEY);
    if (!done) {
      // Small delay to let the page render and map load
      const timer = setTimeout(() => setRun(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleCallback = useCallback((data: CallBackProps) => {
    const { status } = data;
    if (status === "finished" || status === "skipped") {
      setRun(false);
      localStorage.setItem(TOUR_STORAGE_KEY, "true");
    }
  }, []);

  if (!run) return null;

  return (
    <Joyride
      steps={STEPS}
      run={run}
      continuous
      showSkipButton
      showProgress
      disableScrolling
      callback={handleCallback}
      styles={{
        options: {
          zIndex: 10000,
          overlayColor: "rgba(0, 0, 0, 0.75)",
        },
      }}
      locale={{
        back: "Back",
        close: "Close",
        last: "Finish",
        next: "Next",
        skip: "Skip tour",
      }}
    />
  );
}
