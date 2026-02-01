const fs = require('fs');

// ============================================================
// PETRONAS Malaysia Station Scraper
// ~1,100+ stations across Malaysia
// Source: mymesra.com.my (Drupal-based, JS-rendered station finder)
//
// METHOD 1: OSM Overpass API (run directly, no auth)
// METHOD 2: Browser DevTools API discovery (see PETRONAS_EXTRACT_GUIDE.md)
// METHOD 3: Feed extracted JSON from browser console
// ============================================================

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
];

// ---------- METHOD 1: OSM Overpass ----------

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
  // Malaysia bounding box: 0.8°N to 7.5°N (Peninsula), 0.8°N to 7.5°N, 109°E to 119.5°E (Borneo)
  // Using full bounds: 0.8°N to 7.5°N, 99.5°E to 119.5°E
  return `
[out:json][timeout:180][bbox:0.8,99.5,7.5,119.5];
(
  node["amenity"="fuel"]["brand"~"PETRONAS|Petronas",i];
  way["amenity"="fuel"]["brand"~"PETRONAS|Petronas",i];
  node["amenity"="fuel"]["name"~"PETRONAS|Petronas",i];
  way["amenity"="fuel"]["name"~"PETRONAS|Petronas",i];
  node["amenity"="fuel"]["operator"~"PETRONAS|Petronas|PDB|Dagangan",i];
  way["amenity"="fuel"]["operator"~"PETRONAS|Petronas|PDB|Dagangan",i];
);
out center body;
  `.trim();
}

function normalizeOsmStation(element) {
  const tags = element.tags || {};
  const lat = element.lat || element.center?.lat || null;
  const lon = element.lon || element.center?.lon || null;

  // Parse fuel types
  const fuelTypes = [];
  const fuelMap = {
    'fuel:octane_95': 'Primax 95',
    'fuel:octane_97': 'Primax 97',
    'fuel:diesel': 'Dynamic Diesel',
    'fuel:e5': 'Euro 5 Diesel',
    'fuel:cng': 'NGV',
    'fuel:lpg': 'LPG',
    'fuel:octane_91': 'RON 91',
  };
  for (const [key, label] of Object.entries(fuelMap)) {
    if (tags[key] === 'yes') fuelTypes.push(label);
  }

  // Parse amenities
  const amenities = [];
  if (tags['shop'] && tags['shop'] !== 'no') amenities.push('Kedai Mesra');
  if (tags['car_wash'] === 'yes') amenities.push('Car Wash');
  if (tags['atm'] === 'yes') amenities.push('ATM');
  if (tags['toilets'] === 'yes') amenities.push('Toilet');
  if (tags['compressed_air'] === 'yes') amenities.push('Air');
  if (tags['religion'] === 'muslim' || tags['surau'] === 'yes') amenities.push('Surau');
  if (tags['ev_charging'] === 'yes') amenities.push('EV Charging');

  // Determine state from coordinates (rough mapping)
  let state = tags['addr:state'] || tags['addr:province'] || '';
  if (!state && lat && lon) {
    state = guessState(lat, lon);
  }

  return {
    source: 'osm',
    osm_id: element.id,
    osm_type: element.type,
    name: tags.name || tags.brand || 'PETRONAS',
    brand: tags.brand || '',
    operator: tags.operator || '',
    latitude: lat,
    longitude: lon,
    address: [tags['addr:housenumber'], tags['addr:street']].filter(Boolean).join(' ') || '',
    city: tags['addr:city'] || '',
    state: state,
    postcode: tags['addr:postcode'] || '',
    country: 'Malaysia',
    phone: tags.phone || tags['contact:phone'] || '',
    website: tags.website || tags['contact:website'] || '',
    opening_hours: tags.opening_hours || '',
    fuel_types: fuelTypes,
    amenities: amenities,
    _raw_tags: tags,
  };
}

function guessState(lat, lon) {
  // Very rough state boundaries for Malaysian states
  // Peninsula
  if (lon < 105) {
    if (lat > 6.0) return 'Perlis/Kedah';
    if (lat > 5.0 && lon < 101) return 'Perak';
    if (lat > 5.0 && lon >= 101) return 'Kelantan/Terengganu';
    if (lat > 4.0 && lon < 101.5) return 'Perak/Selangor';
    if (lat > 3.5 && lon >= 103) return 'Pahang/Terengganu';
    if (lat > 2.5 && lon < 102) return 'Selangor/KL/Negeri Sembilan';
    if (lat > 2.5 && lon >= 102) return 'Pahang';
    if (lat > 1.5 && lon < 103) return 'Melaka/Negeri Sembilan';
    if (lat > 1.2) return 'Johor';
  }
  // Borneo
  if (lon >= 109) {
    if (lat > 4.5) return 'Sabah';
    if (lon < 113) return 'Sarawak';
    if (lon >= 114.5 && lat < 5.5) return 'Sabah';
    return 'Sarawak';
  }
  return '';
}

async function scrapeViaOverpass() {
  console.log('\n=== OSM Overpass API Scrape ===\n');
  console.log('Querying for PETRONAS fuel stations in Malaysia...\n');

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

// ---------- METHOD 2: MyMesra API (if endpoint discovered) ----------

async function scrapeViaMyMesraApi(apiUrl, options = {}) {
  console.log('\n=== MyMesra API Scrape ===\n');
  console.log(`Endpoint: ${apiUrl}\n`);

  // Common patterns for Drupal station finder APIs:
  // GET /api/stations?lat=3.1&lng=101.6&radius=50
  // GET /jsonapi/node/station?page[limit]=50&page[offset]=0
  // POST /views/ajax with form data for a Drupal Views exposed filter
  // GET /find-us/station-finder?_format=json&lat=3.1&lng=101.6

  // Grid-based approach for proximity APIs
  const gridPoints = generateMalaysiaGrid();
  const allStations = new Map();
  const radius = options.radius || 50; // km

  for (let i = 0; i < gridPoints.length; i++) {
    const { lat, lng, label } = gridPoints[i];
    process.stdout.write(`  [${i + 1}/${gridPoints.length}] ${label} (${lat}, ${lng})...\r`);

    try {
      const url = apiUrl
        .replace('{lat}', lat)
        .replace('{lng}', lng)
        .replace('{radius}', radius);

      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0',
          ...(options.headers || {}),
        },
      });

      if (!response.ok) {
        console.log(`  HTTP ${response.status} at ${label}`);
        continue;
      }

      const data = await response.json();

      // Try to extract stations from various response formats
      const stations = extractStationsFromResponse(data);

      for (const station of stations) {
        const key = station.id || `${station.latitude?.toFixed(4)},${station.longitude?.toFixed(4)}`;
        if (!allStations.has(key)) {
          allStations.set(key, station);
        }
      }
    } catch (error) {
      // Skip errors silently for grid crawl
    }

    // Rate limit
    await new Promise(r => setTimeout(r, 300));
  }

  console.log(`\nTotal unique stations: ${allStations.size}`);
  return Array.from(allStations.values());
}

function extractStationsFromResponse(data) {
  // Handle various response formats
  const stations = [];

  // Direct array
  if (Array.isArray(data)) {
    return data.map(normalizeApiStation);
  }

  // Nested in common keys
  const possibleKeys = ['data', 'results', 'stations', 'items', 'rows', 'nodes', 'features', 'locations'];
  for (const key of possibleKeys) {
    if (data[key] && Array.isArray(data[key])) {
      return data[key].map(normalizeApiStation);
    }
  }

  // Drupal JSON:API format
  if (data.data && Array.isArray(data.data) && data.data[0]?.type) {
    return data.data.map(item => normalizeApiStation({
      ...item.attributes,
      id: item.id,
    }));
  }

  // GeoJSON
  if (data.type === 'FeatureCollection' && data.features) {
    return data.features.map(f => normalizeApiStation({
      ...f.properties,
      latitude: f.geometry?.coordinates?.[1],
      longitude: f.geometry?.coordinates?.[0],
    }));
  }

  return stations;
}

function normalizeApiStation(raw) {
  return {
    source: 'mymesra_api',
    id: raw.id || raw.nid || raw.station_id || raw.stationId || '',
    name: raw.title || raw.name || raw.station_name || raw.stationName || 'PETRONAS',
    latitude: parseFloat(raw.latitude || raw.lat || raw.field_latitude || 0),
    longitude: parseFloat(raw.longitude || raw.lng || raw.lon || raw.field_longitude || 0),
    address: raw.address || raw.field_address || raw.street || '',
    city: raw.city || raw.field_city || '',
    state: raw.state || raw.field_state || raw.region || '',
    postcode: raw.postcode || raw.zipcode || raw.field_postcode || '',
    country: 'Malaysia',
    phone: raw.phone || raw.field_phone || '',
    fuel_types: raw.fuel_types || raw.fuelTypes || raw.field_fuel_types || [],
    services: raw.services || raw.amenities || raw.field_services || [],
    _raw: raw,
  };
}

function generateMalaysiaGrid() {
  const points = [];

  // Peninsula Malaysia - denser grid
  for (let lat = 1.3; lat <= 6.8; lat += 0.5) {
    for (let lng = 99.8; lng <= 104.5; lng += 0.5) {
      points.push({ lat: lat.toFixed(2), lng: lng.toFixed(2), label: `Peninsula ${lat.toFixed(1)}N ${lng.toFixed(1)}E` });
    }
  }

  // East Malaysia - Sarawak
  for (let lat = 1.0; lat <= 5.0; lat += 0.7) {
    for (let lng = 109.5; lng <= 115.5; lng += 0.7) {
      points.push({ lat: lat.toFixed(2), lng: lng.toFixed(2), label: `Sarawak ${lat.toFixed(1)}N ${lng.toFixed(1)}E` });
    }
  }

  // East Malaysia - Sabah
  for (let lat = 4.0; lat <= 7.0; lat += 0.7) {
    for (let lng = 115.5; lng <= 119.5; lng += 0.7) {
      points.push({ lat: lat.toFixed(2), lng: lng.toFixed(2), label: `Sabah ${lat.toFixed(1)}N ${lng.toFixed(1)}E` });
    }
  }

  // Key city centers for guaranteed coverage
  const cities = [
    { lat: '3.1390', lng: '101.6869', label: 'Kuala Lumpur' },
    { lat: '5.4164', lng: '100.3327', label: 'George Town (Penang)' },
    { lat: '1.4927', lng: '103.7414', label: 'Johor Bahru' },
    { lat: '3.0738', lng: '101.5183', label: 'Petaling Jaya' },
    { lat: '3.0319', lng: '101.7945', label: 'Ampang' },
    { lat: '2.7456', lng: '101.7072', label: 'Seremban' },
    { lat: '2.1896', lng: '102.2501', label: 'Melaka' },
    { lat: '4.5841', lng: '101.0901', label: 'Ipoh' },
    { lat: '3.8077', lng: '103.3260', label: 'Kuantan' },
    { lat: '5.3117', lng: '103.1324', label: 'Kuala Terengganu' },
    { lat: '6.1184', lng: '102.2546', label: 'Kota Bharu' },
    { lat: '6.4414', lng: '100.1986', label: 'Alor Setar' },
    { lat: '4.2105', lng: '101.9758', label: 'Cameron Highlands' },
    { lat: '1.5535', lng: '110.3593', label: 'Kuching' },
    { lat: '2.3000', lng: '111.8167', label: 'Sibu' },
    { lat: '4.5500', lng: '114.0167', label: 'Miri' },
    { lat: '5.9749', lng: '116.0724', label: 'Kota Kinabalu' },
    { lat: '5.0389', lng: '118.3375', label: 'Sandakan' },
    { lat: '4.2430', lng: '117.8910', label: 'Tawau' },
    { lat: '3.1710', lng: '113.0419', label: 'Bintulu' },
    { lat: '2.9264', lng: '101.6964', label: 'Putrajaya' },
    { lat: '2.9485', lng: '101.7887', label: 'Cyberjaya' },
  ];

  return [...cities, ...points];
}

// ---------- Output ----------

function summarize(stations) {
  const byState = {};
  for (const s of stations) {
    const state = s.state || 'Unknown';
    byState[state] = (byState[state] || 0) + 1;
  }
  return { byState };
}

function saveResults(stations, prefix) {
  const jsonPath = `./${prefix}_stations_malaysia.json`;
  const cleanStations = stations.map(({ _raw_tags, _raw, ...rest }) => rest);
  fs.writeFileSync(jsonPath, JSON.stringify(cleanStations, null, 2));
  console.log(`\nJSON saved: ${jsonPath}`);

  const rawPath = `./${prefix}_stations_malaysia_raw.json`;
  fs.writeFileSync(rawPath, JSON.stringify(stations, null, 2));
  console.log(`Raw JSON saved: ${rawPath}`);

  const csvPath = `./${prefix}_stations_malaysia.csv`;
  const headers = ['osm_id', 'id', 'name', 'brand', 'latitude', 'longitude',
    'address', 'city', 'state', 'postcode', 'phone',
    'opening_hours', 'fuel_types', 'amenities', 'website'];
  const activeHeaders = headers.filter(h =>
    stations.some(s => s[h] !== undefined && s[h] !== '' && s[h] !== null)
  );
  const csvContent = [
    activeHeaders.join(','),
    ...stations.map(s =>
      activeHeaders.map(h => {
        let val = s[h];
        if (Array.isArray(val)) val = val.join('; ');
        val = String(val || '').replace(/"/g, '""');
        return val.includes(',') || val.includes('"') || val.includes('\n')
          ? `"${val}"` : val;
      }).join(',')
    ),
  ].join('\n');

  fs.writeFileSync(csvPath, csvContent);
  console.log(`CSV saved: ${csvPath}`);
}

// ---------- Main ----------

async function main() {
  console.log('='.repeat(60));
  console.log('  PETRONAS Malaysia Station Scraper');
  console.log('  Target: ~1,100+ stations');
  console.log('='.repeat(60));

  const mode = process.argv[2];

  if (mode === '--api' && process.argv[3]) {
    // Method 2: Direct API scrape
    const apiUrl = process.argv[3];
    const stations = await scrapeViaMyMesraApi(apiUrl);
    saveResults(stations, 'petronas_api');
  } else if (mode && fs.existsSync(mode)) {
    // Method 3: Browser-extracted JSON file
    console.log(`\nLoading browser-extracted data from: ${mode}`);
    const raw = JSON.parse(fs.readFileSync(mode, 'utf8'));
    const stations = Array.isArray(raw) ? raw : (raw.data || raw.results || raw.stations || []);
    console.log(`Loaded ${stations.length} stations`);
    saveResults(stations.map(normalizeApiStation), 'petronas_browser');
  } else {
    // Method 1: OSM Overpass (default)
    const stations = await scrapeViaOverpass();

    console.log('\n' + '='.repeat(60));
    console.log(`  COMPLETE: ${stations.length} stations via OSM`);
    console.log(`  (PETRONAS has ~1,100+ stations; OSM may have good coverage)`);
    console.log('='.repeat(60));

    if (stations.length > 0) {
      const { byState } = summarize(stations);
      console.log('\nBy State:');
      Object.entries(byState)
        .sort((a, b) => b[1] - a[1])
        .forEach(([s, c]) => console.log(`  ${s}: ${c}`));

      saveResults(stations, 'petronas_osm');
    } else {
      console.log('\nNo stations found. Try browser extraction (see PETRONAS_EXTRACT_GUIDE.md).');
    }
  }
}

main().catch(console.error);

// ============================================================
// USAGE
// ============================================================
//
// Method 1 — OSM Overpass (no credentials, run immediately):
//   node petronas-scraper-malaysia.js
//
// Method 2 — Direct API (after discovering the endpoint via DevTools):
//   node petronas-scraper-malaysia.js --api "https://www.mymesra.com.my/api/stations?lat={lat}&lng={lng}&radius={radius}"
//   (Replace URL pattern with the actual endpoint you find)
//
// Method 3 — Browser-extracted JSON:
//   node petronas-scraper-malaysia.js browser_extracted.json
//
// See PETRONAS_EXTRACT_GUIDE.md for how to discover the API endpoint.
// ============================================================