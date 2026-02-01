# CLAUDE.md

## Project

Pitstop — a Next.js (App Router) fuel station finder with a terminal/HUD aesthetic.

## Stack

- Next.js 14+ (App Router, `"use client"` components)
- TypeScript, SCSS Modules, Bootstrap utilities
- Chart.js / react-chartjs-2 for HUD visualisations
- Leaflet / react-leaflet for maps

## Frontend Clean Code Principles

1. **DRY components** — When the same JSX block appears in two or more places, extract it into a local function component (same file) or a shared component (own file). Pass differences via props.
2. **Constants over magic strings** — All user-facing text, colour hex values, and repeated config values belong in `src/lib/constants.ts`. Import the constant; never inline the raw value.
3. **Prop spreading for shared config** — When multiple instances of a component share the same props, build a shared props object and spread it (`{...sharedProps}`), adding per-instance overrides as needed.
4. **Minimal prop surface** — Only pass the data a child actually needs. Prefer narrow callback props (`onSelect`) over exposing parent state setters directly.
5. **One component per file** — Every React component must live in its own file, even small helpers. Sibling components within the same feature folder is fine (e.g. `map-view/station-marker.tsx`), but never define multiple components in a single file. This keeps files focused, diffs clean, and imports explicit.
6. **Avoid hardcoded layout strings** — Use constants or enums for repeated class-name patterns and breakpoint-specific visibility logic.
7. **Mobile-first responsiveness** — Every component and layout must be tested at mobile viewport widths. Use `max-width: calc(100vw - …)` or `right: 0` anchoring to prevent absolute/fixed elements from overflowing the screen. Dropdowns, modals, and popovers should default to a mobile-safe position and adjust via `@media (min-width: …)` for larger screens.
8. **No inline style objects** — Avoid `style={{ … }}` in JSX. Move styles to SCSS modules or, when the property must be dynamic (e.g. brand colour), keep only the dynamic property inline and put everything else in a CSS class. For Leaflet `pathOptions` and similar config objects, extract them into module-level constants.
9. **Prefer Bootstrap utility classes over custom SCSS** — Use Bootstrap utilities (`d-flex`, `gap-2`, `text-uppercase`, `fw-bold`, etc.) before writing new SCSS. Only create custom SCSS when Bootstrap doesn't cover the case or when the style is component-specific (animations, complex selectors, theme variables).
10. **Extract non-UI logic out of component files** — Icon factories, SVG strings, data transforms, and other helpers that don't render JSX should live in dedicated sibling files (e.g. `map-icons.ts`) rather than cluttering the component file. Keep component files focused on rendering and state.
11. **Reuse existing constant maps** — Before writing a manual `if/else` or ternary chain that maps status/type strings to display values, check if a `Record<string, …>` map already exists in `constants.ts` or `types.ts` (e.g. `STATUS_LABELS`, `BRAND_LABELS`). Use the map with a lookup instead of duplicating the mapping logic.
