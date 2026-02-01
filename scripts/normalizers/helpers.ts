import { UnmappedReport, WeeklyHours } from "./types";

// ─── Global unmapped tracker ─────────────────────────

export const unmapped: UnmappedReport = { fuels: {}, amenities: {} };

// ─── String helpers ──────────────────────────────────

export function titleCase(s: string): string {
  return s
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function mapValue(
  raw: string,
  table: Record<string, string>,
  field: "fuels" | "amenities"
): string {
  if (table[raw]) return table[raw];
  const auto = titleCase(raw);
  unmapped[field][raw] = auto;
  return auto;
}

// ─── Hours parsers ───────────────────────────────────

/** Parse Caltex-style hours like "6.30am - 11.00pm" */
export function parseTimeRange(raw: string | null | undefined): { open24Hours: boolean; hours: WeeklyHours | null } {
  if (!raw || raw.trim() === "") return { open24Hours: false, hours: null };
  const s = raw.trim().toLowerCase();
  if (s === "24 hours" || s === "24hours" || s === "24 hrs") {
    return { open24Hours: true, hours: null };
  }

  const match = s.match(/(\d{1,2})[.:]?(\d{2})?\s*(am|pm)\s*[-–]\s*(\d{1,2})[.:]?(\d{2})?\s*(am|pm)/i);
  if (!match) return { open24Hours: false, hours: null };

  const toTime = (h: string, m: string | undefined, period: string): string => {
    let hour = parseInt(h);
    const min = parseInt(m || "0");
    if (period.toLowerCase() === "pm" && hour !== 12) hour += 12;
    if (period.toLowerCase() === "am" && hour === 12) hour = 0;
    return `${hour.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}`;
  };

  const open = toTime(match[1], match[2], match[3]);
  const close = toTime(match[4], match[5], match[6]);
  const timeStr = `${open} - ${close}`;

  return {
    open24Hours: false,
    hours: { mon: timeStr, tue: timeStr, wed: timeStr, thu: timeStr, fri: timeStr, sat: timeStr, sun: timeStr },
  };
}

/** Parse OSM opening_hours like "Mo-Sa 06:00-22:00" or "24/7" */
export function parseOsmHours(raw: string | null | undefined): { open24Hours: boolean; hours: WeeklyHours | null } {
  if (!raw || raw.trim() === "") return { open24Hours: false, hours: null };
  const s = raw.trim();
  if (s === "24/7") return { open24Hours: true, hours: null };

  // Simple case: "Mo-Su 06:00-22:00" or "06:00-22:00"
  const timeMatch = s.match(/(\d{2}:\d{2})\s*[-–]\s*(\d{2}:\d{2})/);
  if (!timeMatch) return { open24Hours: false, hours: null };

  const timeStr = `${timeMatch[1]} - ${timeMatch[2]}`;
  const allDays: WeeklyHours = { mon: timeStr, tue: timeStr, wed: timeStr, thu: timeStr, fri: timeStr, sat: timeStr, sun: timeStr };

  // Check if specific days are mentioned
  const DAY_MAP: Record<string, keyof WeeklyHours> = {
    mo: "mon", tu: "tue", we: "wed", th: "thu", fr: "fri", sa: "sat", su: "sun",
  };

  const dayRangeMatch = s.match(/([A-Za-z]{2})\s*-\s*([A-Za-z]{2})/);
  if (dayRangeMatch) {
    const dayKeys = Object.keys(DAY_MAP);
    const startIdx = dayKeys.indexOf(dayRangeMatch[1].toLowerCase());
    const endIdx = dayKeys.indexOf(dayRangeMatch[2].toLowerCase());
    if (startIdx >= 0 && endIdx >= 0) {
      // Clear all days first, then set the range
      const result: WeeklyHours = { mon: "", tue: "", wed: "", thu: "", fri: "", sat: "", sun: "" };
      for (let i = startIdx; i <= endIdx; i++) {
        const key = DAY_MAP[dayKeys[i]];
        result[key] = timeStr;
      }
      return { open24Hours: false, hours: result };
    }
  }

  return { open24Hours: false, hours: allDays };
}
