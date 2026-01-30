"use client";

import React from "react";
import { useApp } from "@/context/AppContext";
import {
  Filters, FUEL_OPTIONS, EV_OPTIONS, FOOD_DRINK_OPTIONS,
  VEHICLE_SERVICE_OPTIONS, TRUCK_OPTIONS, CONVENIENCE_OPTIONS, LOYALTY_OPTIONS,
} from "@/lib/types";

function FilterGroup({
  title, options, selected, onChange,
}: {
  title: string; options: string[]; selected: string[];
  onChange: (selected: string[]) => void;
}) {
  const toggle = (opt: string) => {
    onChange(
      selected.includes(opt) ? selected.filter((s) => s !== opt) : [...selected, opt]
    );
  };

  return (
    <div className="filter-group">
      <h4>{title}</h4>
      <div className="flex flex-wrap gap-1">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => toggle(opt)}
            className={`chip cursor-pointer ${
              selected.includes(opt) ? "!bg-bp-green !text-white" : ""
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function FilterPanel({ onClose }: { onClose: () => void }) {
  const { filters, setFilters } = useApp();

  const update = (key: keyof Filters, val: string[]) => {
    setFilters({ ...filters, [key]: val });
  };

  const clearAll = () => {
    setFilters({
      fuels: [], ev: [], foodDrink: [], vehicleServices: [],
      truckAmenities: [], convenience: [], loyalty: [],
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold">Filters</h3>
        <div className="flex gap-2">
          <button onClick={clearAll} className="text-xs text-red-500">Clear All</button>
          <button onClick={onClose} className="text-gray-400">&times;</button>
        </div>
      </div>

      <FilterGroup title="Fuel Type" options={FUEL_OPTIONS} selected={filters.fuels} onChange={(v) => update("fuels", v)} />
      <FilterGroup title="EV" options={EV_OPTIONS} selected={filters.ev} onChange={(v) => update("ev", v)} />
      <FilterGroup title="Food & Drink" options={FOOD_DRINK_OPTIONS} selected={filters.foodDrink} onChange={(v) => update("foodDrink", v)} />
      <FilterGroup title="Vehicle Services" options={VEHICLE_SERVICE_OPTIONS} selected={filters.vehicleServices} onChange={(v) => update("vehicleServices", v)} />
      <FilterGroup title="Truck Amenities" options={TRUCK_OPTIONS} selected={filters.truckAmenities} onChange={(v) => update("truckAmenities", v)} />
      <FilterGroup title="Convenience" options={CONVENIENCE_OPTIONS} selected={filters.convenience} onChange={(v) => update("convenience", v)} />
      <FilterGroup title="Loyalty & Payments" options={LOYALTY_OPTIONS} selected={filters.loyalty} onChange={(v) => update("loyalty", v)} />
    </div>
  );
}
