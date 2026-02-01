const fs = require('fs');

// ============================================================
// GOIL Ghana Station Scraper
// API: WordPress Simple Locator plugin
// Endpoint: /wp-json/simplelocator/v2/search
// Expected: 440+ stations across Ghana
// ============================================================

const BASE_URL = 'https://goil.com.gh/wp-json/simplelocator/v2/search';

// Grid points covering Ghana (4.5°N–11.5°N, 3.5°W–1.5°E)
// Using large search radius per point to maximize coverage
function generateGrid() {
  const points = [];

  // Strategy: Use fewer grid points with large radius (100km)
  // Ghana is roughly 670km N-S and 560km E-W

  // Southern Ghana - Greater Accra, Central, Western, Volta, Eastern
  for (let lat = 4.5; lat <= 7.0; lat += 0.8) {
    for (let lng = -3.3; lng <= 1.3; lng += 0.8) {
      points.push({ lat, lng, region: 'southern' });
    }
  }

  // Central Belt - Ashanti, Bono, Ahafo
  for (let lat = 6.5; lat <= 8.5; lat += 0.8) {
    for (let lng = -3.0; lng <= 0.5; lng += 0.8) {
      points.push({ lat, lng, region: 'central' });
    }
  }

  // Northern Ghana - Northern, Savannah, North East, Upper East, Upper West
  for (let lat = 8.5; lat <= 11.2; lat += 1.0) {
    for (let lng = -2.8; lng <= 0.5; lng += 1.0) {
      points.push({ lat, lng, region: 'northern' });
    }
  }

  // Key city centers for extra coverage
  const cities = [
    { lat: 5.6037, lng: -0.1870, region: 'accra' },        // Accra
    { lat: 5.5560, lng: -0.2000, region: 'accra' },        // Accra South
    { lat: 5.6500, lng: -0.1500, region: 'accra' },        // Accra North
    { lat: 5.6145, lng: -0.2350, region: 'accra' },        // Accra West
    { lat: 5.1053, lng: -1.2466, region: 'cape-coast' },   // Cape Coast
    { lat: 4.8976, lng: -1.7600, region: 'takoradi' },     // Takoradi
    { lat: 6.6885, lng: -1.6244, region: 'kumasi' },       // Kumasi
    { lat: 6.7300, lng: -1.5800, region: 'kumasi' },       // Kumasi East
    { lat: 6.6600, lng: -1.6700, region: 'kumasi' },       // Kumasi West
    { lat: 9.4034, lng: -0.8393, region: 'tamale' },       // Tamale
    { lat: 10.0601, lng: -2.5099, region: 'wa' },          // Wa
    { lat: 10.7851, lng: -1.0601, region: 'bolgatanga' },  // Bolgatanga
    { lat: 7.3349, lng: -2.3253, region: 'sunyani' },      // Sunyani
    { lat: 6.1000, lng: 0.4700, region: 'ho' },            // Ho
    { lat: 5.9300, lng: -0.9800, region: 'winneba' },      // Winneba
    { lat: 6.0900, lng: -1.0200, region: 'swedru' },       // Swedru
    { lat: 5.1100, lng: -1.3500, region: 'elmina' },       // Elmina
    { lat: 6.4000, lng: -0.4700, region: 'koforidua' },    // Koforidua
    { lat: 7.6500, lng: -1.9500, region: 'techiman' },     // Techiman
    { lat: 5.5500, lng: 0.0600, region: 'tema' },          // Tema
    { lat: 5.6700, lng: -0.0200, region: 'tema-north' },   // Tema North
    { lat: 5.8700, lng: -0.2600, region: 'nsawam' },       // Nsawam
    { lat: 5.8100, lng: -0.0700, region: 'dodowa' },       // Dodowa
    { lat: 8.3500, lng: -1.6000, region: 'kintampo' },     // Kintampo
    { lat: 9.4200, lng: -1.0500, region: 'yendi' },        // Yendi
    { lat: 4.9300, lng: -2.1000, region: 'axim' },         // Axim
  ];

  points.push(...cities);
  return points;
}

async function fetchStations(lat, lng, distance = 100, perPage = 100, page = 1) {
  // Build query params matching the Simple Locator API format
  const params = new URLSearchParams({
    address: '',
    formatted_address: '',
    distance: distance.toString(),
    latitude: lat.toString(),
    longitude: lng.toString(),
    unit: 'kilometers',
    geolocation: 'true',
    allow_empty_address: 'false',
    ajax: 'true',
    per_page: perPage.toString(),
    page: page.toString(),
    autoload: 'true',
    formmethod: 'POST',
    resultspage: '4054',
    mapheight: '250',
    search_page: '4054',
  });

  const url = `${BASE_URL}?${params.toString()}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://goil.com.gh/service-station/',
        'Origin': 'https://goil.com.gh',
      },
    });

    if (!response.ok) {
      console.error(`  HTTP ${response.status} for (${lat}, ${lng})`);
      return { stations: [], hasMore: false };
    }

    const data = await response.json();

    // Debug first response to understand structure
    if (!fetchStations._logged) {
      fetchStations._logged = true;
      console.log('\n--- API Response Structure ---');
      console.log(JSON.stringify(data, null, 2).slice(0, 2000));
      console.log('--- End Structure ---\n');
    }

    // Simple Locator typically returns:
    // { result_count: N, results: [...], has_more: bool }
    // OR just an array
    // OR { status: "ok", results: [...] }
    let stations = [];
    let hasMore = false;

    if (Array.isArray(data)) {
      stations = data;
    } else if (data && Array.isArray(data.results)) {
      stations = data.results;
      hasMore = data.has_more || false;
    } else if (data && Array.isArray(data.locations)) {
      stations = data.locations;
    } else if (data && data.result_count !== undefined) {
      // Simple Locator v2 format
      stations = data.results || [];
      hasMore = data.has_more || (data.result_count > perPage * page);
    } else {
      // Try to find any array in the response
      for (const key of Object.keys(data || {})) {
        if (Array.isArray(data[key]) && data[key].length > 0) {
          stations = data[key];
          console.log(`  Found stations in response key: "${key}"`);
          break;
        }
      }
    }

    return { stations, hasMore };
  } catch (error) {
    console.error(`  Error fetching (${lat}, ${lng}):`, error.message);
    return { stations: [], hasMore: false };
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Normalize station data from Simple Locator format
function normalizeStation(raw) {
  // Simple Locator stores posts with meta fields
  // Common fields: title, latitude, longitude, address, city, state, zip, phone, etc.
  return {
    id: raw.id || raw.ID || raw.post_id || null,
    name: raw.title || raw.post_title || raw.name || '',
    latitude: parseFloat(raw.latitude || raw.lat || 0),
    longitude: parseFloat(raw.longitude || raw.lng || raw.lon || 0),
    address: raw.address || raw.street || raw.address_one || '',
    address2: raw.address_two || raw.address_2 || '',
    city: raw.city || raw.locality || '',
    region: raw.state || raw.region || raw.province || '',
    zip: raw.zip || raw.postal_code || raw.postcode || '',
    country: raw.country || 'Ghana',
    phone: raw.phone || raw.telephone || '',
    distance: raw.distance || null,
    url: raw.permalink || raw.url || raw.link || '',
    // Preserve all raw fields for analysis
    _raw: raw,
  };
}

// Generate unique key for deduplication
function stationKey(station) {
  // Prefer ID, fallback to coordinate-based key
  if (station.id) return `id_${station.id}`;
  // Round to 4 decimal places (~11m precision) for dedup
  const latKey = station.latitude.toFixed(4);
  const lngKey = station.longitude.toFixed(4);
  return `geo_${latKey}_${lngKey}`;
}

async function scrapeAllStations() {
  const gridPoints = generateGrid();
  const allStations = new Map();

  console.log(`\nStarting GOIL Ghana scrape with ${gridPoints.length} grid points...\n`);
  console.log(`Search radius: 100km per point | per_page: 100\n`);

  for (let i = 0; i < gridPoints.length; i++) {
    const { lat, lng, region } = gridPoints[i];
    process.stdout.write(
      `[${String(i + 1).padStart(3)}/${gridPoints.length}] ` +
      `(${lat.toFixed(2)}, ${lng.toFixed(2)}) ${region.padEnd(12)}... `
    );

    // Fetch first page
    let { stations, hasMore } = await fetchStations(lat, lng, 100, 100, 1);

    let newCount = 0;
    for (const raw of stations) {
      const station = normalizeStation(raw);
      const key = stationKey(station);
      if (!allStations.has(key)) {
        allStations.set(key, station);
        newCount++;
      }
    }

    // If there are more results, paginate
    let page = 2;
    while (hasMore && page <= 10) {
      await sleep(200);
      const nextPage = await fetchStations(lat, lng, 100, 100, page);
      for (const raw of nextPage.stations) {
        const station = normalizeStation(raw);
        const key = stationKey(station);
        if (!allStations.has(key)) {
          allStations.set(key, station);
          newCount++;
        }
      }
      hasMore = nextPage.hasMore;
      page++;
    }

    console.log(
      `${stations.length} found, ${newCount} new ` +
      `(Total: ${allStations.size})`
    );

    // Rate limiting
    await sleep(400);
  }

  return Array.from(allStations.values());
}

function summarize(stations) {
  const byRegion = {};
  const byCity = {};

  for (const s of stations) {
    const region = s.region || 'Unknown';
    const city = s.city || 'Unknown';
    byRegion[region] = (byRegion[region] || 0) + 1;
    byCity[city] = (byCity[city] || 0) + 1;
  }

  return { byRegion, byCity };
}

async function main() {
  console.log('='.repeat(60));
  console.log('  GOIL Ghana Station Scraper');
  console.log('  API: WordPress Simple Locator v2');
  console.log('  Target: 440+ stations');
  console.log('='.repeat(60));

  const stations = await scrapeAllStations();

  console.log('\n' + '='.repeat(60));
  console.log(`  COMPLETE: ${stations.length} unique stations found`);
  console.log('='.repeat(60));

  // Summary
  const { byRegion, byCity } = summarize(stations);

  console.log('\nBy Region:');
  Object.entries(byRegion)
    .sort((a, b) => b[1] - a[1])
    .forEach(([r, c]) => console.log(`  ${r}: ${c}`));

  console.log('\nTop Cities:');
  Object.entries(byCity)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .forEach(([c, n]) => console.log(`  ${c}: ${n}`));

  // Save JSON (full data)
  const jsonPath = './goil_stations_ghana.json';
  const jsonOutput = stations.map(({ _raw, ...rest }) => rest);
  fs.writeFileSync(jsonPath, JSON.stringify(jsonOutput, null, 2));
  console.log(`\nJSON saved: ${jsonPath}`);

  // Save JSON with raw data (for debugging)
  const rawPath = './goil_stations_ghana_raw.json';
  fs.writeFileSync(rawPath, JSON.stringify(stations, null, 2));
  console.log(`Raw JSON saved: ${rawPath}`);

  // Save CSV
  const csvPath = './goil_stations_ghana.csv';
  const headers = ['id', 'name', 'latitude', 'longitude', 'address', 'city', 'region', 'zip', 'phone', 'url'];
  const csvContent = [
    headers.join(','),
    ...stations.map(s =>
      headers.map(h => {
        const val = String(s[h] || '').replace(/"/g, '""');
        return val.includes(',') || val.includes('"') || val.includes('\n')
          ? `"${val}"` : val;
      }).join(',')
    ),
  ].join('\n');

  fs.writeFileSync(csvPath, csvContent);
  console.log(`CSV saved: ${csvPath}`);
}

main().catch(console.error);

// ============================================================
// TROUBLESHOOTING
// ============================================================
//
// 1. If you get empty results, the API might need POST instead of GET.
//    Change fetch to:
//      fetch(BASE_URL, {
//        method: 'POST',
//        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
//        body: params.toString()
//      })
//
// 2. If response structure differs, check the debug output
//    on first request and adjust normalizeStation()
//
// 3. To test a single point first:
//    node -e "fetch('https://goil.com.gh/wp-json/simplelocator/v2/search?latitude=5.6037&longitude=-0.1870&distance=50&unit=kilometers&per_page=10&page=1').then(r=>r.json()).then(d=>console.log(JSON.stringify(d,null,2)))"
//
// 4. If per_page doesn't work (some configs limit to 25),
//    reduce per_page and let pagination handle it
//
// 5. Alternative: Try fetching ALL via very large distance from center:
//    node -e "fetch('https://goil.com.gh/wp-json/simplelocator/v2/search?latitude=7.5&longitude=-1.5&distance=1000&unit=kilometers&per_page=500&page=1').then(r=>r.json()).then(d=>console.log(JSON.stringify(d,null,2)))"
// ============================================================