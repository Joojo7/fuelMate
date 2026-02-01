"use client";

import Favourites from "@/components/favourites";
import HudGlobe from "@/components/hud-globe/hud-globe";
import StationList from "@/components/station-list";
import TripPlanner from "@/components/trip-planner";
import { type Tab, TAB_LABELS } from "@/lib/constants";

interface SidebarTabsProps {
  activeTab: Tab;
  setActiveTab: (t: Tab) => void;
  onSwitchToMap: () => void;
}

export default function SidebarTabs({ activeTab, setActiveTab, onSwitchToMap }: SidebarTabsProps) {
  return (
    <>
      <HudGlobe />
      <ul className="nav nav-tabs">
        {(["list", "trip", "favourites"] as Tab[]).map((tab) => (
          <li className="nav-item" key={tab}>
            <button
              className={`nav-link ${activeTab === tab || (activeTab === "map" && tab === "list") ? "active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {TAB_LABELS[tab]}
            </button>
          </li>
        ))}
      </ul>
      <div className="flex-grow-1 overflow-auto">
        {(activeTab === "list" || activeTab === "map") && <StationList onSwitchToMap={onSwitchToMap} />}
        {activeTab === "trip" && <TripPlanner onSwitchToMap={onSwitchToMap} />}
        {activeTab === "favourites" && <Favourites onSwitchToMap={onSwitchToMap} />}
      </div>
    </>
  );
}
