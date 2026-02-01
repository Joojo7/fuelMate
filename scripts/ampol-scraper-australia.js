const fs = require('fs');

// ============================================================
// Ampol Australia Station Scraper
// Method 1: OpenStreetMap Overpass API (no auth needed)
// Method 2: Yext Search API (requires API key from DevTools)
// Target: ~1700 stations
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
  // Australia bounding box: roughly -44°S to -10°S, 112°E to 154°E
  // Search for fuel stations with brand/name/operator matching Ampol or Caltex
  // (Caltex rebranded to Ampol — many OSM entries still say Caltex)
  return `
[out:json][timeout:180][bbox:-44,112,-10,154];
(
  node["amenity"="fuel"]["brand"~"Ampol|Caltex",i];
  way["amenity"="fuel"]["brand"~"Ampol|Caltex",i];
  node["amenity"="fuel"]["name"~"Ampol|Caltex",i];
  way["amenity"="fuel"]["name"~"Ampol|Caltex",i];
  node["amenity"="fuel"]["operator"~"Ampol|Caltex",i];
  way["amenity"="fuel"]["operator"~"Ampol|Caltex",i];
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
    'fuel:diesel': 'Diesel',
    'fuel:octane_91': 'Unleaded 91',
    'fuel:octane_95': 'Premium 95',
    'fuel:octane_98': 'Premium 98',
    'fuel:e10': 'E10',
    'fuel:e85': 'E85',
    'fuel:lpg': 'LPG',
    'fuel:adblue': 'AdBlue',
    'fuel:HGV_diesel': 'Truck Diesel',
    'fuel:cng': 'CNG',
  };
  for (const [key, label] of Object.entries(fuelMap)) {
    if (tags[key] === 'yes') fuelTypes.push(label);
  }

  // Parse amenities/services
  const amenities = [];
  if (tags['shop'] && tags['shop'] !== 'no') amenities.push('Shop');
  if (tags['car_wash'] === 'yes' || tags['amenity:car_wash']) amenities.push('Car Wash');
  if (tags['atm'] === 'yes') amenities.push('ATM');
  if (tags['toilets'] === 'yes') amenities.push('Toilets');
  if (tags['compressed_air'] === 'yes') amenities.push('Air');
  if (tags['restaurant'] === 'yes' || tags['food'] === 'yes') amenities.push('Food');
  if (tags['ev_charging'] === 'yes' || tags['socket:type2']) amenities.push('EV Charging');

  // Determine brand (Ampol vs legacy Caltex)
  const brand = tags.brand || tags.name || tags.operator || '';
  const isLegacyCaltex = /caltex/i.test(brand) && !/ampol/i.test(brand);

  return {
    osm_id: element.id,
    osm_type: element.type,
    name: tags.name || tags.brand || 'Ampol',
    brand: tags.brand || '',
    operator: tags.operator || '',
    is_legacy_caltex: isLegacyCaltex,
    latitude: lat,
    longitude: lon,
    address: [tags['addr:housenumber'], tags['addr:street']].filter(Boolean).join(' ') || '',
    suburb: tags['addr:suburb'] || tags['addr:city'] || '',
    state: tags['addr:state'] || '',
    postcode: tags['addr:postcode'] || '',
    country: 'Australia',
    phone: tags.phone || tags['contact:phone'] || '',
    website: tags.website || tags['contact:website'] || '',
    opening_hours: tags.opening_hours || '',
    fuel_types: fuelTypes,
    amenities: amenities,
    _raw_tags: tags,
  };
}

async function scrapeViaOverpass() {
  console.log('\n=== OSM Overpass API Scrape ===\n');
  console.log('Querying for Ampol + Caltex branded fuel stations in Australia...\n');

  const query = buildOverpassQuery();
  const data = await fetchFromOverpass(query);

  if (!data || !data.elements) {
    console.error('No data returned from Overpass API');
    return [];
  }

  console.log(`Raw elements returned: ${data.elements.length}`);

  // Deduplicate by OSM ID
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

  // Breakdown
  const ampolCount = stations.filter(s => /ampol/i.test(s.brand || s.name)).length;
  const caltexCount = stations.filter(s => s.is_legacy_caltex).length;
  const otherCount = stations.length - ampolCount - caltexCount;
  console.log(`  Ampol-branded: ${ampolCount}`);
  console.log(`  Legacy Caltex: ${caltexCount}`);
  console.log(`  Other/mixed: ${otherCount}`);

  return stations;
}

// ---------- METHOD 2: Yext Search API ----------

async function scrapeViaYext(apiKey, experienceKey) {
  console.log('\n=== Yext Search API Scrape ===\n');
  console.log(`API Key: ${apiKey.slice(0, 8)}...`);
  console.log(`Experience Key: ${experienceKey}\n`);

  const allStations = [];
  let offset = 0;
  const limit = 50; // Yext typically allows up to 50 per page
  let totalCount = null;

  while (true) {
    const params = new URLSearchParams({
      api_key: apiKey,
      v: '20230101',
      experienceKey: experienceKey,
      verticalKey: 'locations',
      input: '',
      limit: limit.toString(),
      offset: offset.toString(),
      locale: 'en',
      experienceVersion: 'PRODUCTION',
      retrieveFacets: 'false',
      sessionTrackingEnabled: 'false',
      // Geo search from center of Australia with huge radius
      location: JSON.stringify({
        latitude: -25.2744,
        longitude: 133.7751,
      }),
      locationRadius: '5000000', // 5000km - covers all of Australia
    });

    const url = `https://cdn.yextapis.com/v2/accounts/me/search/vertical/query?${params.toString()}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        console.error(`HTTP ${response.status}: ${await response.text()}`);
        break;
      }

      const data = await response.json();

      if (totalCount === null) {
        totalCount = data.response?.resultsCount || 0;
        console.log(`Total stations reported: ${totalCount}\n`);
      }

      const results = data.response?.results || [];
      if (results.length === 0) break;

      for (const result of results) {
        const entity = result.data || {};
        allStations.push({
          id: entity.id || '',
          name: entity.name || entity.geomodifier || '',
          latitude: entity.yextDisplayCoordinate?.latitude || entity.geocodedCoordinate?.latitude || null,
          longitude: entity.yextDisplayCoordinate?.longitude || entity.geocodedCoordinate?.longitude || null,
          address: entity.address?.line1 || '',
          address2: entity.address?.line2 || '',
          suburb: entity.address?.city || '',
          state: entity.address?.region || '',
          postcode: entity.address?.postalCode || '',
          country: entity.address?.countryCode || 'AU',
          phone: entity.mainPhone || '',
          website: entity.websiteUrl?.url || '',
          opening_hours: entity.hours ? JSON.stringify(entity.hours) : '',
          services: (entity.services || []).map(s => s.name || s).filter(Boolean),
          fuel_types: (entity.c_fuelTypes || entity.c_fuels || []).map(f => f.name || f).filter(Boolean),
          // Yext custom fields vary by account
          _raw: entity,
        });
      }

      process.stdout.write(`  Fetched ${allStations.length}/${totalCount}...\r`);
      offset += results.length;

      if (offset >= totalCount || results.length < limit) break;

      // Rate limit
      await new Promise(r => setTimeout(r, 300));
    } catch (error) {
      console.error(`Error at offset ${offset}:`, error.message);
      break;
    }
  }

  console.log(`\nTotal stations retrieved: ${allStations.length}`);
  return allStations;
}

// ---------- Output ----------

function summarize(stations) {
  const byState = {};
  const byBrand = {};

  for (const s of stations) {
    const state = s.state || 'Unknown';
    const brand = s.brand || s.name?.split(' ')[0] || 'Unknown';
    byState[state] = (byState[state] || 0) + 1;
    byBrand[brand] = (byBrand[brand] || 0) + 1;
  }

  return { byState, byBrand };
}

function saveResults(stations, prefix) {
  // JSON (clean, no raw tags)
  const jsonPath = `./${prefix}_stations_australia.json`;
  const cleanStations = stations.map(({ _raw_tags, _raw, ...rest }) => rest);
  fs.writeFileSync(jsonPath, JSON.stringify(cleanStations, null, 2));
  console.log(`\nJSON saved: ${jsonPath}`);

  // JSON with raw data
  const rawPath = `./${prefix}_stations_australia_raw.json`;
  fs.writeFileSync(rawPath, JSON.stringify(stations, null, 2));
  console.log(`Raw JSON saved: ${rawPath}`);

  // CSV
  const csvPath = `./${prefix}_stations_australia.csv`;
  const headers = [
    'osm_id', 'name', 'brand', 'latitude', 'longitude',
    'address', 'suburb', 'state', 'postcode', 'phone',
    'opening_hours', 'fuel_types', 'amenities', 'website',
  ];

  // Filter headers that exist
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
  console.log('  Ampol Australia Station Scraper');
  console.log('='.repeat(60));

  // Check for Yext API key in args
  const apiKey = process.argv[2];
  const experienceKey = process.argv[3];

  if (apiKey && experienceKey) {
    // Method 2: Yext API (complete data)
    const stations = await scrapeViaYext(apiKey, experienceKey);

    console.log('\n' + '='.repeat(60));
    console.log(`  COMPLETE: ${stations.length} stations via Yext API`);
    console.log('='.repeat(60));

    const { byState } = summarize(stations);
    console.log('\nBy State:');
    Object.entries(byState)
      .sort((a, b) => b[1] - a[1])
      .forEach(([s, c]) => console.log(`  ${s}: ${c}`));

    saveResults(stations, 'ampol_yext');
  } else {
    // Method 1: OSM Overpass (partial but free)
    const stations = await scrapeViaOverpass();

    console.log('\n' + '='.repeat(60));
    console.log(`  COMPLETE: ${stations.length} stations via OSM`);
    console.log(`  (Note: OSM coverage is partial, ~1700 exist in total)`);
    console.log('='.repeat(60));

    const { byState, byBrand } = summarize(stations);
    console.log('\nBy State:');
    Object.entries(byState)
      .sort((a, b) => b[1] - a[1])
      .forEach(([s, c]) => console.log(`  ${s}: ${c}`));

    console.log('\nBy Brand:');
    Object.entries(byBrand)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .forEach(([b, c]) => console.log(`  ${b}: ${c}`));

    saveResults(stations, 'ampol_osm');
  }
}

main().catch(console.error);

// ============================================================
// USAGE
// ============================================================
//
// Method 1 — OSM (no credentials, run immediately):
//   node ampol-scraper-australia.js
//
// Method 2 — Yext API (after extracting credentials from DevTools):
//   node ampol-scraper-australia.js YOUR_API_KEY YOUR_EXPERIENCE_KEY
//
// HOW TO GET YEXT CREDENTIALS:
// 1. Open https://locations.ampol.com.au/en
// 2. F12 → Network tab → Filter: "cdn.yextapis"
// 3. Search for any location on the map
// 4. Look at request URL for api_key= and experienceKey= params
// 5. Run: node ampol-scraper-australia.js <api_key> <experienceKey>
//
// ALTERNATIVE — Yext entities endpoint (if you find account ID):
//   curl "https://cdn.yextapis.com/v2/accounts/ACCOUNT_ID/entities?api_key=KEY&v=20230101&entityTypes=location&limit=50&offset=0"
//
// ============================================================