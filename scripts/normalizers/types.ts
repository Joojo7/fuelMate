// ─── Shared types for the normalize pipeline ─────────

export interface WeeklyHours {
  mon: string;
  tue: string;
  wed: string;
  thu: string;
  fri: string;
  sat: string;
  sun: string;
}

export interface NormalizedStation {
  id: string;
  name: string;
  brand: string;
  country_code: string;
  lat: number;
  lng: number;
  address: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  telephone: string;
  fuels: string[];
  amenities: string[];
  payments: string[];
  open24Hours: boolean;
  hours: WeeklyHours | null;
  openStatusRaw?: string;
  nextStatusChange?: string;
  websiteUrl?: string;
}

export interface UnmappedReport {
  fuels: Record<string, string>;
  amenities: Record<string, string>;
}

/**
 * Each brand normalizer registers itself with this shape.
 * The orchestrator iterates over all normalizers, reads the raw file,
 * maps each entry through `normalize()`, and writes the output.
 */
export interface BrandNormalizer {
  /** Internal brand key, e.g. "shell", "totalenergies" */
  brand: string;
  /** Display label for console output */
  label: string;
  /** Path to raw JSON file, relative to `src/raw-data/` */
  rawFile: string;
  /** Brand key written into output station objects (may differ from `brand` for variants like caltex-workshop) */
  outputBrand: string;
  /** Fixed country code for output, or "auto" to read from each station's `country_code` field */
  countryCode: string | "auto";
  /** If true, split output into per-country folders based on station `country_code` */
  splitByCountry?: boolean;
  /** Transform a single raw record into a NormalizedStation (or null to skip) */
  normalize(raw: any): NormalizedStation | null;
}
