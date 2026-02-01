const fs = require('fs');

// Shell station locator API
const BASE_URL = 'https://shellretaillocator.geoapp.me/api/v2/locations/nearest_to';

// Grid points covering Ghana
// Ghana: roughly 4.5°N to 11.5°N, -3.5°W to 1.5°E
function generateGrid() {
  const points = [];

  // Southern Ghana (Greater Accra, Central, Western, Volta) - denser grid (more stations)
  for (let lat = 4.5; lat <= 7.0; lat += 0.4) {
    for (let lng = -3.5; lng <= 1.5; lng += 0.4) {
      points.push({ lat, lng, region: 'southern' });
    }
  }

  // Central/Ashanti Region (Kumasi area)
  for (let lat = 6.0; lat <= 8.0; lat += 0.5) {
    for (let lng = -3.0; lng <= 0.0; lng += 0.5) {
      points.push({ lat, lng, region: 'ashanti' });
    }
  }

  // Northern Ghana (Northern, Upper East, Upper West) - sparser grid
  for (let lat = 8.0; lat <= 11.5; lat += 0.6) {
    for (let lng = -3.0; lng <= 1.0; lng += 0.6) {
      points.push({ lat, lng, region: 'northern' });
    }
  }

  return points;
}

async function fetchStations(lat, lng) {
  const params = new URLSearchParams({
    lat: lat.toString(),
    lng: lng.toString(),
    limit: '50',
    'with_any[fuel_type][]': 'conventional',
    locale: 'en_GH',
    format: 'json',
    driving_distances: 'true'
  });

  // Add EV fuel type (need to append separately due to array param)
  const url = `${BASE_URL}?${params.toString()}&with_any[fuel_type][]=ev`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`HTTP ${response.status} for (${lat}, ${lng})`);
      return [];
    }
    const data = await response.json();

    // Handle different response structures
    if (Array.isArray(data)) {
      return data;
    } else if (data && Array.isArray(data.locations)) {
      return data.locations;
    } else if (data && Array.isArray(data.results)) {
      return data.results;
    } else if (data && Array.isArray(data.data)) {
      return data.data;
    } else {
      // Debug: log the actual structure on first successful response
      console.log('\nAPI response structure:', JSON.stringify(data, null, 2).slice(0, 500));
      return [];
    }
  } catch (error) {
    console.error(`Error fetching (${lat}, ${lng}):`, error.message);
    return [];
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function scrapeAllStations() {
  const gridPoints = generateGrid();
  const allStations = new Map(); // Use Map for deduplication by ID

  console.log(`Starting scrape with ${gridPoints.length} grid points...\n`);

  for (let i = 0; i < gridPoints.length; i++) {
    const { lat, lng, region } = gridPoints[i];

    process.stdout.write(`[${i + 1}/${gridPoints.length}] Fetching (${lat.toFixed(2)}, ${lng.toFixed(2)}) - ${region}... `);

    const stations = await fetchStations(lat, lng);

    let newCount = 0;
    if (Array.isArray(stations)) {
      for (const station of stations) {
        if (station && station.id && !allStations.has(station.id)) {
          allStations.set(station.id, station);
          newCount++;
        }
      }
      console.log(`${stations.length} found, ${newCount} new (Total: ${allStations.size})`);
    } else {
      console.log(`Unexpected response type: ${typeof stations}`);
    }
    // Rate limiting - be respectful
    await sleep(300);
  }

  return Array.from(allStations.values());
}

function summarizeStations(stations) {
  const byRegion = {};

  for (const station of stations) {
    const region = station.address?.region || station.state || station.city || 'Unknown';
    byRegion[region] = (byRegion[region] || 0) + 1;
  }

  return byRegion;
}

async function main() {
  console.log('='.repeat(60));
  console.log('Shell Ghana Station Scraper');
  console.log('='.repeat(60) + '\n');

  const stations = await scrapeAllStations();

  console.log('\n' + '='.repeat(60));
  console.log(`COMPLETE: ${stations.length} unique stations found`);
  console.log('='.repeat(60) + '\n');

  // Summary by region
  const byRegion = summarizeStations(stations);
  console.log('Stations by region:');
  Object.entries(byRegion)
    .sort((a, b) => b[1] - a[1])
    .forEach(([region, count]) => {
      console.log(`  ${region}: ${count}`);
    });

  // Save full data
  const outputPath = './shell_stations_ghana.json';
  fs.writeFileSync(outputPath, JSON.stringify(stations, null, 2));
  console.log(`\nFull data saved to: ${outputPath}`);

  // Save simplified CSV for easy viewing
  const csvPath = './shell_stations_ghana.csv';
  const csvHeader = 'id,name,address,city,region,lat,lng,phone,has_ev,amenities\n';
  const csvRows = stations.map(s => {
    const hasEv = s.amenities?.some(a => a.toLowerCase().includes('ev') || a.toLowerCase().includes('electric')) ||
                  s.fuel_types?.some(f => f.toLowerCase().includes('ev')) || false;
    return [
      s.id,
      `"${(s.name || '').replace(/"/g, '""')}"`,
      `"${(s.address?.address_line_1 || s.formatted_address || s.address || '').replace(/"/g, '""')}"`,
      `"${(s.address?.locality || s.city || '').replace(/"/g, '""')}"`,
      `"${(s.address?.region || s.state || '').replace(/"/g, '""')}"`,
      s.lat || s.latitude || '',
      s.lng || s.longitude || '',
      `"${(s.telephone || s.phone || '').replace(/"/g, '""')}"`,
      hasEv,
      `"${(s.amenities || []).join(', ')}"`
    ].join(',');
  }).join('\n');

  fs.writeFileSync(csvPath, csvHeader + csvRows);
  console.log(`CSV saved to: ${csvPath}`);
}

main().catch(console.error);