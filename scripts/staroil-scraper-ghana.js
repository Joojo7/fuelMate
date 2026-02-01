const fs = require('fs');

// ============================================================
// StarOil Ghana Station Scraper
// ~240+ stations (as of 2025, Ghana's largest OMC)
//
// The StarOil outlets page (staroil.com.gh/outlets) loads all
// station data via JavaScript, so we need TWO approaches:
//
// METHOD 1: Browser Console Extraction (RECOMMENDED)
//   → Paste script in DevTools on the outlets page
//   → Extracts whatever the page has rendered
//
// METHOD 2: OSM Overpass API (baseline, run this file)
//   → Free, no auth needed
//   → Partial coverage (community-mapped)
//
// METHOD 3: DevTools API Discovery (most complete)
//   → Find the AJAX endpoint that feeds the outlets page
//   → Build targeted scraper once endpoint is known
// ============================================================

// ==========================================
// METHOD 2: OSM Overpass API
// ==========================================

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
];

async function fetchFromOverpass(query, endpointIndex = 0) {
  const endpoint = OVERPASS_ENDPOINTS[endpointIndex];
  console.log(`  Using endpoint: ${endpoint}`);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(query)}`,
    });

    if (!response.ok) {
      if (response.status === 429 || response.status === 504) {
        if (endpointIndex < OVERPASS_ENDPOINTS.length - 1) {
          console.log(`  Rate limited/timeout, trying next endpoint...`);
          return fetchFromOverpass(query, endpointIndex + 1);
        }
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    if (endpointIndex < OVERPASS_ENDPOINTS.length - 1) {
      console.log(`  Error: ${error.message}, trying next endpoint...`);
      return fetchFromOverpass(query, endpointIndex + 1);
    }
    throw error;
  }
}

function buildOverpassQuery() {
  // Ghana bounding box: 4.5°N to 11.5°N, -3.5°W to 1.5°E
  return `
[out:json][timeout:120][bbox:4.5,-3.5,11.5,1.5];
(
  node["amenity"="fuel"]["brand"~"Star.?Oil|StarOil",i];
  way["amenity"="fuel"]["brand"~"Star.?Oil|StarOil",i];
  node["amenity"="fuel"]["name"~"Star.?Oil|StarOil",i];
  way["amenity"="fuel"]["name"~"Star.?Oil|StarOil",i];
  node["amenity"="fuel"]["operator"~"Star.?Oil|StarOil",i];
  way["amenity"="fuel"]["operator"~"Star.?Oil|StarOil",i];
);
out center body;
  `.trim();
}

function normalizeOsmStation(element) {
  const tags = element.tags || {};
  const lat = element.lat || element.center?.lat || null;
  const lon = element.lon || element.center?.lon || null;

  return {
    source: 'osm',
    osm_id: element.id,
    osm_type: element.type,
    name: tags.name || tags.brand || 'Star Oil',
    brand: tags.brand || '',
    operator: tags.operator || '',
    latitude: lat,
    longitude: lon,
    address: [tags['addr:housenumber'], tags['addr:street']].filter(Boolean).join(' ') || '',
    suburb: tags['addr:suburb'] || tags['addr:city'] || '',
    region: tags['addr:state'] || tags['addr:province'] || '',
    postcode: tags['addr:postcode'] || '',
    country: 'Ghana',
    phone: tags.phone || tags['contact:phone'] || '',
    website: tags.website || tags['contact:website'] || '',
    opening_hours: tags.opening_hours || '',
    _raw_tags: tags,
  };
}

async function scrapeViaOverpass() {
  console.log('\n=== OSM Overpass API Scrape ===\n');
  console.log('Querying for StarOil branded fuel stations in Ghana...\n');

  const query = buildOverpassQuery();
  const data = await fetchFromOverpass(query);

  if (!data || !data.elements) {
    console.error('No data returned from Overpass API');
    return [];
  }

  console.log(`Raw elements returned: ${data.elements.length}`);

  const seen = new Set();
  const stations = [];

  for (const element of data.elements) {
    if (seen.has(element.id)) continue;
    seen.add(element.id);
    const station = normalizeOsmStation(element);
    if (station.latitude && station.longitude) {
      stations.push(station);
    }
  }

  console.log(`Unique stations with coordinates: ${stations.length}`);
  return stations;
}

// ==========================================
// Output
// ==========================================

function saveResults(stations, prefix) {
  const jsonPath = `./${prefix}_stations_ghana.json`;
  const cleanStations = stations.map(({ _raw_tags, ...rest }) => rest);
  fs.writeFileSync(jsonPath, JSON.stringify(cleanStations, null, 2));
  console.log(`\nJSON saved: ${jsonPath}`);

  const rawPath = `./${prefix}_stations_ghana_raw.json`;
  fs.writeFileSync(rawPath, JSON.stringify(stations, null, 2));
  console.log(`Raw JSON saved: ${rawPath}`);

  const csvPath = `./${prefix}_stations_ghana.csv`;
  const headers = ['osm_id', 'name', 'brand', 'latitude', 'longitude',
    'address', 'suburb', 'region', 'phone', 'opening_hours', 'website'];
  const activeHeaders = headers.filter(h =>
    stations.some(s => s[h] !== undefined && s[h] !== '' && s[h] !== null)
  );
  const csvContent = [
    activeHeaders.join(','),
    ...stations.map(s =>
      activeHeaders.map(h => {
        let val = String(s[h] || '').replace(/"/g, '""');
        return val.includes(',') || val.includes('"') || val.includes('\n')
          ? `"${val}"` : val;
      }).join(',')
    ),
  ].join('\n');

  fs.writeFileSync(csvPath, csvContent);
  console.log(`CSV saved: ${csvPath}`);
}

// ==========================================
// Main
// ==========================================

async function main() {
  console.log('='.repeat(60));
  console.log('  StarOil Ghana Station Scraper');
  console.log('  Target: ~240+ stations');
  console.log('='.repeat(60));

  // Check if user is providing browser-extracted JSON
  const inputFile = process.argv[2];

  if (inputFile) {
    // User has browser-extracted data
    console.log(`\nLoading browser-extracted data from: ${inputFile}`);
    const raw = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
    console.log(`Loaded ${raw.length} stations`);
    saveResults(raw, 'staroil_browser');
    return;
  }

  // Otherwise, use OSM
  const stations = await scrapeViaOverpass();

  console.log('\n' + '='.repeat(60));
  console.log(`  COMPLETE: ${stations.length} stations via OSM`);
  console.log(`  (Note: StarOil has ~240+ stations; OSM coverage is partial)`);
  console.log('='.repeat(60));

  if (stations.length > 0) {
    saveResults(stations, 'staroil_osm');
  } else {
    console.log('\nNo stations found in OSM. Use browser extraction (Method 1).');
  }
}

main().catch(console.error);

// ============================================================
// USAGE
// ============================================================
//
// OSM baseline (run directly):
//   node staroil-scraper-ghana.js
//
// After browser extraction (see BROWSER_EXTRACT.md):
//   node staroil-scraper-ghana.js browser_extracted_stations.json
//
// ============================================================