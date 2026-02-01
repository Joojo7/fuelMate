const fs = require('fs');

// =============================================================
// TotalEnergies Ghana Station Scraper
// Uses OpenStreetMap Overpass API (free, public, no API key)
// =============================================================

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

// Ghana bounding box: 4.5°N to 11.5°N, -3.5°W to 1.5°E
const GHANA_BBOX = '4.5,-3.5,11.5,1.5';

// Overpass QL query for TotalEnergies stations in Ghana
// Searches for brand=Total, brand=TotalEnergies, and name containing "Total"
function buildOverpassQuery() {
  return `
[out:json][timeout:120][bbox:${GHANA_BBOX}];
(
  node["amenity"="fuel"]["brand"~"Total|TotalEnergies",i];
  way["amenity"="fuel"]["brand"~"Total|TotalEnergies",i];
  node["amenity"="fuel"]["name"~"Total|TotalEnergies",i];
  way["amenity"="fuel"]["name"~"Total|TotalEnergies",i];
  node["amenity"="fuel"]["operator"~"Total|TotalEnergies",i];
  way["amenity"="fuel"]["operator"~"Total|TotalEnergies",i];
);
out center body;
`;
}

async function fetchFromOverpass() {
  console.log('Querying OpenStreetMap Overpass API for TotalEnergies stations in Ghana...\n');

  const query = buildOverpassQuery();

  try {
    const response = await fetch(OVERPASS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(query)}`
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(`Overpass API error (HTTP ${response.status}):`, text.slice(0, 500));
      return [];
    }

    const data = await response.json();
    console.log(`Overpass returned ${data.elements?.length || 0} elements\n`);
    return data.elements || [];
  } catch (error) {
    console.error('Error querying Overpass API:', error.message);
    console.log('\nIf blocked, try alternative mirrors:');
    console.log('  - https://overpass.kumi.systems/api/interpreter');
    console.log('  - https://maps.mail.ru/osm/tools/overpass/api/interpreter');
    return [];
  }
}

// Normalize OSM elements into consistent station objects
function normalizeStation(element) {
  const tags = element.tags || {};

  // For ways, use the center point; for nodes, use lat/lon directly
  const lat = element.lat || element.center?.lat || null;
  const lon = element.lon || element.center?.lon || null;

  return {
    id: `osm_${element.type}_${element.id}`,
    osm_id: element.id,
    osm_type: element.type,
    name: tags.name || tags['name:en'] || 'TotalEnergies Station',
    brand: tags.brand || tags.operator || 'TotalEnergies',
    address: [
      tags['addr:housenumber'],
      tags['addr:street'],
      tags['addr:city'] || tags['addr:suburb'],
      tags['addr:state'] || tags['addr:district'],
    ].filter(Boolean).join(', ') || '',
    city: tags['addr:city'] || tags['addr:suburb'] || tags['addr:district'] || '',
    region: tags['addr:state'] || tags['addr:region'] || tags['addr:district'] || '',
    postcode: tags['addr:postcode'] || '',
    lat,
    lon,
    phone: tags.phone || tags['contact:phone'] || '',
    website: tags.website || tags['contact:website'] || '',
    opening_hours: tags.opening_hours || '',
    fuel_types: extractFuelTypes(tags),
    amenities: extractAmenities(tags),
    raw_tags: tags
  };
}

function extractFuelTypes(tags) {
  const fuels = [];
  if (tags['fuel:diesel'] === 'yes') fuels.push('Diesel');
  if (tags['fuel:octane_91'] === 'yes' || tags['fuel:octane_92'] === 'yes') fuels.push('Petrol 91/92');
  if (tags['fuel:octane_95'] === 'yes') fuels.push('Super 95');
  if (tags['fuel:octane_98'] === 'yes') fuels.push('Super 98');
  if (tags['fuel:lpg'] === 'yes') fuels.push('LPG');
  if (tags['fuel:kerosene'] === 'yes') fuels.push('Kerosene');
  // Generic petrol
  if (fuels.length === 0 && tags.amenity === 'fuel') fuels.push('Petrol', 'Diesel');
  return fuels;
}

function extractAmenities(tags) {
  const amenities = [];
  if (tags.shop === 'convenience' || tags.shop === 'yes') amenities.push('Shop');
  if (tags['car_wash'] === 'yes' || tags.amenity === 'car_wash') amenities.push('Car Wash');
  if (tags.atm === 'yes') amenities.push('ATM');
  if (tags['toilets'] === 'yes') amenities.push('Toilets');
  if (tags['compressed_air'] === 'yes') amenities.push('Air');
  if (tags['restaurant'] === 'yes' || tags.cuisine) amenities.push('Restaurant');
  return amenities;
}

function deduplicateStations(stations) {
  const seen = new Map();

  for (const station of stations) {
    // Deduplicate by OSM ID (same element can match multiple query clauses)
    const key = `${station.osm_type}_${station.osm_id}`;
    if (!seen.has(key)) {
      seen.set(key, station);
    }
  }

  return Array.from(seen.values());
}

function summarizeStations(stations) {
  const byRegion = {};
  const byBrand = {};

  for (const station of stations) {
    const region = station.region || station.city || 'Unknown';
    byRegion[region] = (byRegion[region] || 0) + 1;

    const brand = station.brand || 'Unknown';
    byBrand[brand] = (byBrand[brand] || 0) + 1;
  }

  return { byRegion, byBrand };
}

async function main() {
  console.log('='.repeat(60));
  console.log('TotalEnergies Ghana Station Scraper');
  console.log('Source: OpenStreetMap (via Overpass API)');
  console.log('='.repeat(60) + '\n');

  // Fetch from Overpass API
  const elements = await fetchFromOverpass();

  if (elements.length === 0) {
    console.log('No stations found. See troubleshooting below.\n');
    printTroubleshooting();
    return;
  }

  // Normalize and deduplicate
  const stations = deduplicateStations(elements.map(normalizeStation));

  console.log('='.repeat(60));
  console.log(`COMPLETE: ${stations.length} unique TotalEnergies stations found`);
  console.log('='.repeat(60) + '\n');

  // Summary
  const { byRegion, byBrand } = summarizeStations(stations);

  console.log('Stations by region/city:');
  Object.entries(byRegion)
    .sort((a, b) => b[1] - a[1])
    .forEach(([region, count]) => {
      console.log(`  ${region}: ${count}`);
    });

  console.log('\nStations by brand name:');
  Object.entries(byBrand)
    .sort((a, b) => b[1] - a[1])
    .forEach(([brand, count]) => {
      console.log(`  ${brand}: ${count}`);
    });

  // Save full JSON
  const outputPath = './totalenergies_stations_ghana.json';
  fs.writeFileSync(outputPath, JSON.stringify(stations, null, 2));
  console.log(`\nFull data saved to: ${outputPath}`);

  // Save CSV
  const csvPath = './totalenergies_stations_ghana.csv';
  const csvHeader = 'id,name,brand,address,city,region,lat,lon,phone,opening_hours,fuel_types,amenities\n';
  const csvRows = stations.map(s => [
    s.id,
    `"${(s.name || '').replace(/"/g, '""')}"`,
    `"${(s.brand || '').replace(/"/g, '""')}"`,
    `"${(s.address || '').replace(/"/g, '""')}"`,
    `"${(s.city || '').replace(/"/g, '""')}"`,
    `"${(s.region || '').replace(/"/g, '""')}"`,
    s.lat || '',
    s.lon || '',
    `"${(s.phone || '').replace(/"/g, '""')}"`,
    `"${(s.opening_hours || '').replace(/"/g, '""')}"`,
    `"${s.fuel_types.join(', ')}"`,
    `"${s.amenities.join(', ')}"`
  ].join(',')).join('\n');

  fs.writeFileSync(csvPath, csvHeader + csvRows);
  console.log(`CSV saved to: ${csvPath}`);

  // Note about coverage
  console.log('\n' + '-'.repeat(60));
  console.log('NOTE: OSM may not have all 273 TotalEnergies stations mapped.');
  console.log('For complete data, see the manual discovery guide below.');
  console.log('-'.repeat(60));
  printManualDiscovery();
}

function printTroubleshooting() {
  console.log(`
TROUBLESHOOTING:
1. Check your internet connection
2. Try alternative Overpass mirrors by editing OVERPASS_URL:
   - https://overpass.kumi.systems/api/interpreter
   - https://maps.mail.ru/osm/tools/overpass/api/interpreter
3. Try the query manually at https://overpass-turbo.eu/ with:

   [out:json][timeout:120];
   area["ISO3166-1"="GH"]->.searchArea;
   (
     node["amenity"="fuel"]["brand"~"Total|TotalEnergies",i](area.searchArea);
     way["amenity"="fuel"]["brand"~"Total|TotalEnergies",i](area.searchArea);
   );
   out center body;
`);
}

function printManualDiscovery() {
  console.log(`
=============================================================
MANUAL DISCOVERY: TotalEnergies Proprietary Station API
=============================================================

The TotalEnergies website (totalenergies.com.gh) loads station
data via JavaScript. To find their internal API:

METHOD 1: Browser DevTools
1. Open https://totalenergies.com.gh/totalenergies-station-services/find-your-station
2. Press F12 → Network tab → Check "Preserve log"
3. Filter by "XHR" or "Fetch"
4. Refresh the page and interact with the map
5. Look for JSON responses containing station coordinates
6. Right-click the request → "Copy as cURL"

METHOD 2: TotalEnergies Services App (most reliable)
1. Install Charles Proxy or mitmproxy on your computer
2. Install "Services - TotalEnergies" app on your phone
   - iOS: https://apps.apple.com/gh/app/services-totalenergies/id345297399
   - Android: https://play.google.com/store/apps/details?id=com.total.totalservices
3. Configure phone to use your computer as proxy
4. Install the proxy's CA certificate on your phone
5. Open the app → Navigate to station finder → Select Ghana
6. Watch the proxy for API calls containing station data

Common TotalEnergies API patterns to look for:
  - /api/stationsfinder?country=GH&lat=...&lng=...
  - /stations/search?countryCode=GH
  - /api/v1/stations?country=GH

METHOD 3: Google Maps Places API (paid, but comprehensive)
  curl "https://maps.googleapis.com/maps/api/place/nearbysearch/json?\\
    location=5.6037,-0.1870&radius=50000&\\
    type=gas_station&keyword=TotalEnergies&\\
    key=YOUR_API_KEY"
`);
}

main().catch(console.error);