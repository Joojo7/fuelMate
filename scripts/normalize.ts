/**
 * Normalize pipeline: reads raw brand JSON files and outputs unified Station[] JSON.
 *
 * Usage:  npx ts-node --compiler-options '{"module":"commonjs","moduleResolution":"node"}' scripts/normalize.ts
 *
 * To add a new brand:
 *   1. Create scripts/normalizers/<brand>.ts exporting a BrandNormalizer
 *   2. Import and add it to the NORMALIZERS array below
 *   3. Register the brand in src/lib/types.ts (BRAND_OPTIONS, BRAND_LABELS, BRAND_COLORS)
 */

import * as fs from "fs";
import * as path from "path";
import { unmapped } from "./normalizers/helpers";
import { BrandNormalizer, NormalizedStation } from "./normalizers/types";
import { shellMalaysia, shellWestAfrica } from "./normalizers/shell";
import { caltexB2C, caltexB2B } from "./normalizers/caltex";
import { totalenergiesGhana } from "./normalizers/totalenergies";
import { ampolAustralia } from "./normalizers/ampol";
import { staroilGhana } from "./normalizers/staroil";
import { petronasMalaysia } from "./normalizers/petronas";

// ─── Registry ────────────────────────────────────────

const NORMALIZERS: BrandNormalizer[] = [
  shellMalaysia,
  shellWestAfrica,
  caltexB2C,
  caltexB2B,
  totalenergiesGhana,
  ampolAustralia,
  staroilGhana,
  petronasMalaysia,
];

// ─── Pipeline ────────────────────────────────────────

function runNormalizer(norm: BrandNormalizer, root: string): void {
  const rawPath = path.join(root, "src", "raw-data", norm.rawFile);
  if (!fs.existsSync(rawPath)) {
    console.log(`${norm.label}: ${norm.rawFile} not found, skipping`);
    return;
  }

  const rawData: any[] = JSON.parse(fs.readFileSync(rawPath, "utf-8"));
  const stations = rawData.map((r) => norm.normalize(r)).filter(Boolean) as NormalizedStation[];

  if (norm.splitByCountry) {
    const byCountry: Record<string, NormalizedStation[]> = {};
    for (const s of stations) {
      const cc = s.country_code.toLowerCase();
      if (!byCountry[cc]) byCountry[cc] = [];
      byCountry[cc].push(s);
    }
    for (const [cc, group] of Object.entries(byCountry)) {
      const outDir = path.join(root, "public", "data", cc);
      fs.mkdirSync(outDir, { recursive: true });
      fs.writeFileSync(path.join(outDir, `${norm.outputBrand}.json`), JSON.stringify(group));
      console.log(`${norm.label} ${cc.toUpperCase()}: ${group.length} stations`);
    }
  } else {
    const cc = norm.countryCode.toLowerCase();
    const outDir = path.join(root, "public", "data", cc);
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, `${norm.outputBrand}.json`), JSON.stringify(stations));
    console.log(`${norm.label}: ${stations.length} stations (from ${rawData.length} raw)`);
  }
}

// ─── Main ────────────────────────────────────────────

function main() {
  const root = path.resolve(__dirname, "..");

  for (const norm of NORMALIZERS) {
    runNormalizer(norm, root);
  }

  // Unmapped report
  const hasUnmapped = Object.keys(unmapped.fuels).length > 0 || Object.keys(unmapped.amenities).length > 0;
  const reportDir = path.join(root, "public", "data", "my");
  fs.mkdirSync(reportDir, { recursive: true });

  if (hasUnmapped) {
    fs.writeFileSync(path.join(reportDir, "unmapped.json"), JSON.stringify(unmapped, null, 2));
    console.log("\n⚠ Unmapped values found:");
    if (Object.keys(unmapped.fuels).length > 0) {
      console.log("  Fuels:");
      for (const [raw, auto] of Object.entries(unmapped.fuels)) {
        console.log(`    "${raw}" → "${auto}"`);
      }
    }
    if (Object.keys(unmapped.amenities).length > 0) {
      console.log("  Amenities:");
      for (const [raw, auto] of Object.entries(unmapped.amenities)) {
        console.log(`    "${raw}" → "${auto}"`);
      }
    }
    console.log(`\nReport written to: ${path.join(reportDir, "unmapped.json")}`);
  } else {
    console.log("\n✓ All values mapped successfully");
  }
}

main();
