# PITSTOP — BP Station Finder & Trip Planner

A fuel station finder and trip planner for BP stations across Australia and New Zealand. Search, filter, and plan road trips with automatic fuel stop recommendations.

Built with a retro terminal aesthetic.
[![Netlify Status](https://api.netlify.com/api/v1/badges/b9741e16-4ac6-405e-b542-72cb4574b400/deploy-status)](https://app.netlify.com/projects/pitstop-convenience/deploys)

## Features

- **Interactive Map** — Leaflet-based map with color-coded station markers (green = open, yellow = closing soon, red = closed). Supports dark/light mode and user location tracking.
- **Search & Autocomplete** — Search by station name, city, or postcode with live suggestions.
- **Advanced Filtering** — Filter by fuel type, amenities, EV charging, truck facilities, accessibility, loyalty programs, and more. Configurable search radius (5–100 km).
- **Trip Planner** — Set origin and destination on the map, configure vehicle range, and get automatic fuel stop suggestions along the route with ETA predictions.
- **Station Details** — Full address, opening hours, fuel types, amenities, phone, and Google Maps directions.
- **Favourites** — Save stations to localStorage for quick access.
- **Responsive** — Tab-based mobile layout, sidebar + map split on desktop.

## Tech Stack

- **Next.js 14** (App Router)
- **React 18** + **TypeScript**
- **Leaflet** / **React Leaflet** — Maps
- **PapaParse** — CSV data parsing
- **Bootstrap 5** + **SASS** — Styling
- **Phosphor Icons** / **React Icons**

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_GOOGLE_MAPS_KEY` | No | Google Maps Tile API key. Falls back to CARTO tiles if not set. |

### Scripts

```bash
npm run dev      # Development server
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run linter
```

## Data

Station data is sourced from CSV files in `/public`:

- `AU.csv` — ~1400 Australian BP stations
- `NZ.csv` — ~80 New Zealand BP stations

Each record includes location, GPS coordinates, opening hours, fuel types, and 70+ amenity columns. Data is parsed and normalized at runtime.

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx          # Root layout with AppProvider
│   ├── page.tsx            # Main page (tabs + map)
│   └── globals.scss        # Global theme & styles
├── components/
│   ├── map-view/           # Leaflet map with markers
│   ├── search-bar/         # Autocomplete search
│   ├── filter-panel/       # Fuel, amenity & service filters
│   ├── station-list/       # Sorted station cards
│   ├── station-detail/     # Full station info panel
│   ├── trip-planner/       # Route planning with fuel stops
│   └── favourites/         # Saved stations
├── context/
│   └── AppContext.tsx       # Global state (React Context)
├── lib/
│   ├── types.ts            # TypeScript interfaces
│   ├── parseCSV.ts         # CSV loading & normalization
│   └── stationUtils.ts     # Distance, status, filtering utils
└── styles/
    ├── _variables.scss
    └── typography.scss
```

## License

ISC
