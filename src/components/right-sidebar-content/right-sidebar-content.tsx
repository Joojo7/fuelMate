"use client";

import FilterPanel from "@/components/filter-panel";
import StationDetail from "@/components/station-detail";
import { EMPTY_DETAIL, FILTERS_CLOSED, FILTERS_OPEN } from "@/lib/constants";
import styles from "./index.module.scss";

interface RightSidebarContentProps {
  showFilters: boolean;
  setShowFilters: (v: boolean) => void;
  selectedStation: unknown;
}

export default function RightSidebarContent({ showFilters, setShowFilters, selectedStation }: RightSidebarContentProps) {
  return (
    <>
      <div className={`${styles["right-sidebar-section"]} ${showFilters ? styles["right-sidebar-section--expanded"] : ""}`}>
        <button
          className={`btn-terminal w-100 ${styles["filter-toggle"]}`}
          onClick={() => setShowFilters(!showFilters)}
        >
          {showFilters ? FILTERS_OPEN : FILTERS_CLOSED}
        </button>
        {showFilters && (
          <div className="overflow-auto p-2">
            <FilterPanel onClose={() => setShowFilters(false)} />
          </div>
        )}
      </div>
      <div className="flex-grow-1 overflow-auto">
        {selectedStation ? (
          <div className="p-3">
            <StationDetail />
          </div>
        ) : (
          <div className="d-flex align-items-center justify-content-center h-100 text-sub fs-8">
            {EMPTY_DETAIL}
          </div>
        )}
      </div>
    </>
  );
}
