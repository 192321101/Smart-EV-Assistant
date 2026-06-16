import express from 'express';
import protect from '../middleware/auth.js';
import Vehicle from '../models/Vehicle.js';
import Station from '../models/Station.js';
import SavedLocation from '../models/SavedLocation.js';
import RecentSearch from '../models/RecentSearch.js';
import RouteHistory from '../models/RouteHistory.js';

const router = express.Router();

// SEC-012: Escape special RegExp characters in user-supplied strings to prevent ReDoS and NoSQL injection.
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const defaultPlaces = [
  { name: 'Bandra West (PulseCharge Hub)', address: 'Linking Road, Bandra West, Mumbai', coordinates: [72.8311, 19.0596], type: 'destination' },
  { name: 'Powai (VoltGrid Plaza)', address: 'Hiranandani Gardens, Powai, Mumbai', coordinates: [72.9114, 19.1197], type: 'destination' },
  { name: 'Andheri East (EcoVoltage Center)', address: 'Metro Station Road, Andheri East, Mumbai', coordinates: [72.8696, 19.1176], type: 'destination' },
  { name: 'Chembur (ZonEV Charging)', address: 'Eastern Express Highway, Chembur, Mumbai', coordinates: [72.8992, 19.0617], type: 'destination' },
  { name: 'Thane West (NexDrive Station)', address: 'Ghodbunder Road, Thane West, Mumbai', coordinates: [72.9780, 19.2183], type: 'destination' },
  { name: 'Gateway of India', address: 'Apollo Bandar, Colaba, Mumbai', coordinates: [72.8347, 18.9220], type: 'landmark' },
  { name: 'Juhu Beach', address: 'Juhu Tara Road, Vile Parle West, Mumbai', coordinates: [72.8273, 19.0988], type: 'landmark' },
  { name: 'Home (Poonamallee)', address: 'Poonamallee High Road, Chennai', coordinates: [80.0945, 13.0473], type: 'favorite' },
  { name: 'PulseCharge Poonamallee Hub', address: 'Poonamallee High Road, Chennai', coordinates: [80.0950, 13.0480], type: 'destination' },
  { name: 'EcoVoltage Nazarathpet', address: 'Bangalore National Highway, Chennai', coordinates: [80.0650, 13.0410], type: 'destination' },
  { name: 'VoltGrid Porur Supercharger', address: 'Porur Bypass Road, Chennai', coordinates: [80.1550, 13.0380], type: 'destination' },
  { name: 'Thiruvanmiyur', address: 'East Coast Road, Thiruvanmiyur, Chennai', coordinates: [80.2586, 12.9830], type: 'destination' },
  { name: 'Guindy', address: 'Guindy National Highway, Chennai', coordinates: [80.2200, 13.0060], type: 'destination' },
  { name: 'Velachery', address: 'Velachery Bypass Road, Chennai', coordinates: [80.2250, 12.9800], type: 'destination' },
  { name: 'Kanchipuram', address: 'Kanchipuram, Tamil Nadu', coordinates: [79.7016, 12.8342], type: 'destination' },
  { name: 'Sriperumbudur', address: 'Sriperumbudur Highway, Tamil Nadu', coordinates: [79.9722, 12.9734], type: 'destination' },
  { name: 'Mahabalipuram', address: 'Mahabalipuram, Tamil Nadu', coordinates: [80.1722, 12.6269], type: 'destination' },
  { name: 'Munnar', address: 'Munnar, Kerala', coordinates: [77.0595, 10.0889], type: 'destination' },
  { name: 'Madurai', address: 'Madurai, Tamil Nadu', coordinates: [78.1198, 9.9252], type: 'destination' },
  { name: 'Mysore', address: 'Mysore, Karnataka', coordinates: [76.6394, 12.2958], type: 'destination' },
  { name: 'Mangalore', address: 'Mangalore, Karnataka', coordinates: [74.8560, 12.9141], type: 'destination' },
  { name: 'Mumbai', address: 'Mumbai, Maharashtra', coordinates: [72.8777, 19.0760], type: 'destination' },
  { name: 'Manali', address: 'Manali, Himachal Pradesh', coordinates: [77.1887, 32.2396], type: 'destination' },
  { name: 'Murudeshwar', address: 'Murudeshwar, Karnataka', coordinates: [74.4849, 14.0940], type: 'destination' },
  { name: 'Muzaffarpur', address: 'Muzaffarpur, Bihar', coordinates: [85.3900, 26.1206], type: 'destination' },
  { name: 'Chennai', address: 'Chennai, Tamil Nadu', coordinates: [80.2707, 13.0827], type: 'destination' },
  { name: 'Chengalpattu', address: 'Chengalpattu, Tamil Nadu', coordinates: [79.9774, 12.6841], type: 'destination' },
  { name: 'Cherthala', address: 'Cherthala, Kerala', coordinates: [76.3364, 9.6846], type: 'destination' },
  { name: 'Cherrapunji', address: 'Cherrapunji, Meghalaya', coordinates: [91.7086, 25.2702], type: 'destination' },
  { name: 'Pondumudi', address: 'Ponmudi, Kerala', coordinates: [77.1167, 8.7607], type: 'destination' },
  { name: 'Salem', address: 'Salem, Tamil Nadu', coordinates: [78.1460, 11.6643], type: 'destination' },
  { name: 'Satara', address: 'Satara, Maharashtra', coordinates: [74.0183, 17.6805], type: 'destination' },
  { name: 'Sambalpur', address: 'Sambalpur, Odisha', coordinates: [83.9878, 21.4669], type: 'destination' },
  { name: 'Sangli', address: 'Sangli, Maharashtra', coordinates: [74.5815, 16.8524], type: 'destination' },
  { name: 'Coimbatore', address: 'Coimbatore, Tamil Nadu', coordinates: [76.9558, 11.0168], type: 'destination' },
  { name: 'Bangalore', address: 'Bangalore, Karnataka', coordinates: [77.5946, 12.9716], type: 'destination' }
];

const INDIA_CITIES = {
  chennai: { lat: 13.0827, lng: 80.2707 },
  tiruvannamalai: { lat: 12.2274, lng: 79.0747 },
  thiruvannamalai: { lat: 12.2274, lng: 79.0747 },
  bangalore: { lat: 12.9716, lng: 77.5946 },
  bengaluru: { lat: 12.9716, lng: 77.5946 },
  mysore: { lat: 12.2958, lng: 76.6394 },
  mysuru: { lat: 12.2958, lng: 76.6394 },
  mumbai: { lat: 19.0760, lng: 72.8777 },
  pune: { lat: 18.5204, lng: 73.8567 },
  delhi: { lat: 28.6139, lng: 77.2090 },
  newdelhi: { lat: 28.6139, lng: 77.2090 },
  salem: { lat: 11.6643, lng: 78.1460 },
  coimbatore: { lat: 11.0168, lng: 76.9558 },
  madurai: { lat: 9.9252, lng: 78.1198 },
  trichy: { lat: 10.7905, lng: 78.7047 },
  tiruchirappalli: { lat: 10.7905, lng: 78.7047 },
  vellore: { lat: 12.9165, lng: 79.1325 },
  pondicherry: { lat: 11.9416, lng: 79.8083 },
  puducherry: { lat: 11.9416, lng: 79.8083 },
  villupuram: { lat: 11.9398, lng: 79.4883 },
  tambaram: { lat: 12.9234, lng: 80.1289 },
  adyar: { lat: 13.0063, lng: 80.2575 },
  poonamallee: { lat: 13.0473, lng: 80.0945 },
  poonamalle: { lat: 13.0473, lng: 80.0945 },
  kochi: { lat: 9.9312, lng: 76.2673 },
  hyderabad: { lat: 17.3850, lng: 78.4867 },
  kolkata: { lat: 22.5726, lng: 88.3639 },
  ahmedabad: { lat: 23.0225, lng: 72.5714 },
  jaipur: { lat: 26.9124, lng: 75.7873 },
  lucknow: { lat: 26.8467, lng: 80.9462 },
  nagpur: { lat: 21.1458, lng: 79.0882 },
  chandigarh: { lat: 30.7333, lng: 76.7794 },
  dehradun: { lat: 30.3165, lng: 78.0322 },
  shimla: { lat: 31.1048, lng: 77.1734 },
  srinagar: { lat: 34.0837, lng: 74.7973 },
  goa: { lat: 15.4909, lng: 73.8278 }
};

function normalizePlaceQuery(name) {
  return name.toLowerCase()
    .replace(/[?.,!]/g, "")
    .replace(/(?:,\s*india|\s+india)/gi, "")
    .replace(/(?:,\s*tamil\s*nadu|\s+tamil\s*nadu|\s+tn)/gi, "")
    .replace(/(?:the\s+city\s+of\s+|town\s+of\s+|district\s+of\s+|in\s+)/gi, "")
    .trim();
}

async function resolveCoordinatesAndName(placeName) {
  const normalized = normalizePlaceQuery(placeName);

  // 1. Check local static cities first
  if (INDIA_CITIES[normalized]) {
    return {
      name: placeName,
      coordinates: [INDIA_CITIES[normalized].lng, INDIA_CITIES[normalized].lat]
    };
  }

  // 2. Check defaultPlaces matches
  const mockLoc = defaultPlaces.find(p => p.name.toLowerCase().includes(normalized) || p.address.toLowerCase().includes(normalized));
  if (mockLoc) {
    return {
      name: mockLoc.name,
      coordinates: mockLoc.coordinates
    };
  }

  // 3. Online lookup with Nominatim
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2500);
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(placeName + ', India')}&format=json&limit=1`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Smart-EV-Assistant-Bot/1.0' },
      signal: controller.signal
    });
    clearTimeout(timer);
    if (response.ok) {
      const data = await response.json();
      if (data && data[0]) {
        return {
          name: data[0].display_name.split(',')[0],
          coordinates: [parseFloat(data[0].lon), parseFloat(data[0].lat)]
        };
      }
    }
  } catch (err) {
    console.warn('[Nominatim Routing API] Online geocoding failed:', err.message);
  }

  return null;
}

// Helper to project GPS coordinates dynamically to Canvas space
const getCanvasCoordsFromGPS = (lng, lat) => {
  if (lng > 79 && lng < 81 && lat > 12 && lat < 14) {
    // Chennai Poonamallee/Kanchipuram bounding box mapping
    const minLng = 79.60;
    const maxLng = 80.30;
    const minLat = 12.80;
    const maxLat = 13.15;
    const x = Math.round(100 + ((lng - minLng) / (maxLng - minLng)) * 600);
    const y = Math.round(500 - ((lat - minLat) / (maxLat - minLat)) * 400);
    return { x, y };
  }
  
  // Mumbai bounding box mapping
  const minLng = 72.80;
  const maxLng = 72.99;
  const minLat = 19.04;
  const maxLat = 19.23;
  const x = Math.round(100 + ((lng - minLng) / (maxLng - minLng)) * 600);
  const y = Math.round(500 - ((lat - minLat) / (maxLat - minLat)) * 400);
  return { x, y };
};

// Helper to generate coordinates path between two canvas points
const generatePath = (start, end) => {
  const points = [];
  const segments = 6;
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const x = Math.round(start.x + (end.x - start.x) * t);
    // Add slight curve for aesthetic realism on canvas
    const curve = i > 0 && i < segments ? Math.sin(t * Math.PI) * 25 : 0;
    const y = Math.round(start.y + (end.y - start.y) * t + curve);
    points.push({ x, y });
  }
  return points;
};

// Helper to generate coordinates path between two GPS coordinates
const generateGpsPath = (startCoords, endCoords) => {
  const points = [];
  const segments = 20; // 20 segments for smoother polyline rendering on real map
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const lng = startCoords[0] + (endCoords[0] - startCoords[0]) * t;
    // Add a slight realistic curve along the highway
    const curve = i > 0 && i < segments ? Math.sin(t * Math.PI) * 0.003 : 0;
    const lat = startCoords[1] + (endCoords[1] - startCoords[1]) * t + curve;
    points.push([lng, lat]);
  }
  return points;
};

// Unified Route Calculator Logic
const handleRouteCalculation = async (req, res) => {
  const { startCoords, destination, startName } = req.body.destination ? req.body : req.query;

  if (!destination) {
    return res.status(400).json({ success: false, message: 'Destination is required.' });
  }

  try {
    // 1. Fetch user vehicle profile
    const vehicle = await Vehicle.findOne({ userId: req.user.id, isDefault: true }) || await Vehicle.findOne({ userId: req.user.id });
    const capacity = vehicle ? vehicle.batteryCapacity_kWh : 40.5;
    const currentRange = vehicle ? vehicle.range_km : 243;
    const soc = vehicle ? vehicle.currentCharge_percent : 45;

    // 2. Resolve Starting location coordinates
    let resolvedStartCoords = [80.0945, 13.0473]; // Poonamallee default
    if (startCoords) {
      if (Array.isArray(startCoords)) {
        resolvedStartCoords = startCoords.map(Number);
      } else if (typeof startCoords === 'string') {
        resolvedStartCoords = startCoords.split(',').map(Number);
      }
    }

    // 3. Resolve destination details
    let resolvedDestCoords = [80.1550, 13.0380]; // Porur default fallback
    let resolvedDestName = destination;

    const destRes = await resolveCoordinatesAndName(destination);
    if (destRes) {
      resolvedDestCoords = destRes.coordinates;
      resolvedDestName = destRes.name;
    }

    if (startName && startName !== 'Current Location' && (!startCoords || startName.toLowerCase() !== 'home (poonamallee)')) {
      const startRes = await resolveCoordinatesAndName(startName);
      if (startRes) {
        resolvedStartCoords = startRes.coordinates;
      }
    }

    let distanceVal = 0;
    let estTimeVal = 0;
    let gpsPath = [];

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 2500);
      const url = `http://router.project-osrm.org/route/v1/driving/${resolvedStartCoords[0]},${resolvedStartCoords[1]};${resolvedDestCoords[0]},${resolvedDestCoords[1]}?overview=full&geometries=geojson`;
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);
      if (response.ok) {
        const data = await response.json();
        if (data && data.routes && data.routes[0]) {
          distanceVal = Number((data.routes[0].distance / 1000).toFixed(1));
          estTimeVal = Math.round(data.routes[0].duration / 60);
          gpsPath = data.routes[0].geometry.coordinates;
        }
      }
    } catch (err) {
      console.warn('[OSRM Routing API] Failed to fetch road route online:', err.message);
    }

    if (distanceVal === 0) {
      const R = 6371; // km
      const dLat = (resolvedDestCoords[1] - resolvedStartCoords[1]) * Math.PI / 180;
      const dLon = (resolvedDestCoords[0] - resolvedStartCoords[0]) * Math.PI / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(resolvedStartCoords[1] * Math.PI / 180) * Math.cos(resolvedDestCoords[1] * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const haversineDist = R * c;
      
      distanceVal = Number((haversineDist * 1.25).toFixed(1));
      estTimeVal = Math.round(distanceVal * 1.5);
      gpsPath = generateGpsPath(resolvedStartCoords, resolvedDestCoords);
    }

    const isChennaiLocal = resolvedStartCoords[0] > 79 && resolvedDestCoords[0] > 79;
    const pathCoordinates = gpsPath.map(coord => getCanvasCoordsFromGPS(coord[0], coord[1]));

    // Energy analysis
    const energyKwhNeeded = Number((distanceVal * 0.16).toFixed(1));
    const isRangeSufficient = currentRange >= distanceVal && soc > 20;

    let recommendedStop = null;
    let chargingStops = [];

    // Recommended stop logic if battery is low
    if (!isRangeSufficient) {
      let fallbackStation;
      if (isChennaiLocal) {
        fallbackStation = await Station.findById('st_chennai_nazarathpet_02') || await Station.findOne({ _id: /st_chennai/ });
      } else {
        fallbackStation = await Station.findById('st_bandra_01') || await Station.findOne({ _id: /st_bandra/ });
      }
      if (!fallbackStation) {
        fallbackStation = await Station.findOne({});
      }
      recommendedStop = {
        stationId: fallbackStation ? fallbackStation._id : (isChennaiLocal ? 'st_chennai_nazarathpet_02' : 'st_bandra_01'),
        name: fallbackStation ? fallbackStation.name : (isChennaiLocal ? 'EcoVoltage Nazarathpet' : 'PulseCharge HyperHub (Bandra)'),
        chargerType: 'DC Fast (CCS)',
        power_kW: fallbackStation && fallbackStation.slots?.[0] ? fallbackStation.slots[0].power_kW : 120,
        delayMins: 15
      };
      chargingStops.push(recommendedStop);
    }

    const elevationGainVal = Math.round(15 + Math.random() * 30);
    const routeResponse = {
      coordinates: pathCoordinates,
      gpsCoordinates: gpsPath,
      startName: startName || 'Current Location',
      destinationName: resolvedDestName,
      distance: distanceVal,
      timeMinutes: estTimeVal,
      energyKwhNeeded,
      elevationGain: elevationGainVal,
      recommendedStop,
      chargingStops,
      socAtArrival: Math.max(0, Math.round(soc - (energyKwhNeeded / capacity) * 100))
    };

    // Save to Route History
    await RouteHistory.create({
      userId: req.user.id,
      startName: startName || 'Current Location',
      startCoords: resolvedStartCoords,
      destinationName: resolvedDestName,
      destCoords: resolvedDestCoords,
      distance_km: distanceVal,
      duration_min: estTimeVal,
      energy_kwh: energyKwhNeeded,
      chargingStops: chargingStops.map(s => ({
        stationId: s.stationId,
        name: s.name,
        chargerType: s.chargerType,
        power_kW: s.power_kW
      }))
    });

    res.json({ success: true, route: routeResponse });
  } catch (err) {
    console.error('❌ [Route Planner] Calculation failed:', err.message);
    res.status(500).json({ success: false, message: 'Server error calculating optimized route.' });
  }
};

// @route   POST /api/navigation/route
// @route   GET /api/navigation/route
// @desc    Optimized EV routing with range check
router.post('/route', protect, handleRouteCalculation);
router.get('/route', protect, handleRouteCalculation);

// @route   GET /api/navigation/search
// @desc    Place autocomplete search suggestion
router.get('/search', protect, async (req, res) => {
  const { q } = req.query;
  if (!q) return res.json({ success: true, suggestions: [] });

  try {
    // Save to search history
    await RecentSearch.create({ userId: req.user.id, query: q });

    // Search in DB
    const safeQ = escapeRegex(q);
    const dbMatches = await SavedLocation.find({
      $or: [
        { name: new RegExp(safeQ, 'i') },
        { address: new RegExp(safeQ, 'i') }
      ]
    }).limit(10);

    // Sort DB matches to prioritize starts-with
    const qLower = q.toLowerCase();
    dbMatches.sort((a, b) => {
      const aStarts = a.name.toLowerCase().startsWith(qLower);
      const bStarts = b.name.toLowerCase().startsWith(qLower);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      return 0;
    });

    let suggestions = dbMatches.map(item => ({
      name: item.name,
      address: item.address,
      coordinates: item.coordinates,
      type: item.type
    }));

    // Find mock locations that start with the query
    const mockMatchesPrefix = defaultPlaces.filter(p =>
      p.name.toLowerCase().startsWith(qLower) ||
      p.address.toLowerCase().startsWith(qLower)
    );

    // Find mock locations that contain the query but do not start with it
    const mockMatchesContains = defaultPlaces.filter(p =>
      !mockMatchesPrefix.includes(p) &&
      (p.name.toLowerCase().includes(qLower) || p.address.toLowerCase().includes(qLower))
    );

    const mockMatches = [...mockMatchesPrefix, ...mockMatchesContains];

    mockMatches.forEach(mock => {
      if (!suggestions.some(s => s.name.toLowerCase() === mock.name.toLowerCase())) {
        suggestions.push(mock);
      }
    });

    // Fallback to online geocoding suggestion if we don't have enough matches and input is long enough
    if (suggestions.length < 5 && q.length > 2) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 2000);
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&countrycodes=in&format=json&addressdetails=1&limit=5`;
        const response = await fetch(url, {
          headers: { 'User-Agent': 'Smart-EV-Assistant-Bot/1.0' },
          signal: controller.signal
        });
        clearTimeout(timer);
        if (response.ok) {
          const data = await response.json();
          data.forEach(item => {
            const name = item.display_name.split(',')[0];
            if (!suggestions.some(s => s.name.toLowerCase() === name.toLowerCase())) {
              suggestions.push({
                name,
                address: item.display_name,
                coordinates: [parseFloat(item.lon), parseFloat(item.lat)],
                type: 'destination'
              });
            }
          });
        }
      } catch (err) {
        console.warn('[Search Autocomplete] Online geocoding failed:', err.message);
      }
    }

    res.json({ success: true, suggestions: suggestions.slice(0, 7) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Autocomplete suggestion search failed.' });
  }
});

// @route   GET /api/navigation/eta
// @desc    Live navigation distance and duration remaining details
router.get('/eta', protect, async (req, res) => {
  const { destination, speedKmph, distanceCovered = 0 } = req.query;

  if (!destination) {
    return res.status(400).json({ success: false, message: 'Destination is required.' });
  }

  try {
    const speed = parseFloat(speedKmph) || 50;
    const covered = parseFloat(distanceCovered) || 0;

    let totalDist = 15;
    // SEC-012: Escape destination before using in RegExp.
    const dbLoc = await SavedLocation.findOne({ name: new RegExp(escapeRegex(destination), 'i') });
    if (dbLoc) {
      totalDist = 18.2;
    }

    const remainingDist = Math.max(0, Number((totalDist - covered).toFixed(1)));
    const remainingTime = remainingDist > 0 ? Math.round((remainingDist / speed) * 60) : 0;

    res.json({
      success: true,
      eta: {
        remainingDistanceKm: remainingDist,
        remainingDurationMin: remainingTime,
        currentSpeedKmph: speed
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error computing live ETA details.' });
  }
});

// @route   GET /api/navigation/recalculate
// @desc    Recalculate path due to route deviation
router.get('/recalculate', protect, async (req, res) => {
  const { destination, currentLng, currentLat } = req.query;

  if (!destination || !currentLng || !currentLat) {
    return res.status(400).json({ success: false, message: 'Destination and current coords are required.' });
  }

  try {
    const vehicle = await Vehicle.findOne({ userId: req.user.id, isDefault: true }) || await Vehicle.findOne({ userId: req.user.id });
    const soc = vehicle ? vehicle.currentCharge_percent : 45;

    const startCoords = [parseFloat(currentLng), parseFloat(currentLat)];
    let resolvedDestCoords = [80.1550, 13.0380]; // Porur default fallback
    // SEC-012: Escape destination before RegExp use.
    const dbLoc2 = await SavedLocation.findOne({ name: new RegExp(escapeRegex(destination), 'i') });
    const resolvedName = dbLoc2 ? dbLoc2.name : destination;
    if (dbLoc2) {
      resolvedDestCoords = dbLoc2.coordinates;
    } else {
      const mockLoc = defaultPlaces.find(p => p.name.toLowerCase().includes(destination.toLowerCase()));
      if (mockLoc) {
        resolvedDestCoords = mockLoc.coordinates;
      }
    }

    const startPoint = getCanvasCoordsFromGPS(startCoords[0], startCoords[1]);
    const destPoint = getCanvasCoordsFromGPS(resolvedDestCoords[0], resolvedDestCoords[1]);
    const pathCoordinates = generatePath(startPoint, destPoint);

    res.json({
      success: true,
      message: 'Route recalculated successfully due to deviation.',
      route: {
        coordinates: pathCoordinates,
        gpsCoordinates: generateGpsPath(startCoords, resolvedDestCoords),
        destinationName: resolvedName,
        distance: 12.8,
        timeMinutes: 24,
        energyKwhNeeded: 2.1,
        elevationGain: 28,
        recommendedStop: null,
        socAtArrival: Math.max(0, soc - 5)
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error recalculating route.' });
  }
});

// @route   GET /api/navigation/favorites
// @desc    Get user favorite and saved locations
router.get('/favorites', protect, async (req, res) => {
  try {
    const list = await SavedLocation.find({ userId: req.user.id, isFavorite: true });
    res.json({ success: true, favorites: list });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch favorites.' });
  }
});

// @route   POST /api/navigation/favorites
// @desc    Add location to favorites
router.post('/favorites', protect, async (req, res) => {
  const { name, address, coordinates, type = 'favorite' } = req.body;

  if (!name || !address || !coordinates) {
    return res.status(400).json({ success: false, message: 'All details required to save favorite.' });
  }

  try {
    const fav = await SavedLocation.create({
      userId: req.user.id,
      name,
      address,
      coordinates: coordinates.map(Number),
      isFavorite: true,
      type
    });
    res.status(201).json({ success: true, favorite: fav });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to save favorite.' });
  }
});

// @route   GET /api/navigation/recent-searches
// @desc    Get recent searches
router.get('/recent-searches', protect, async (req, res) => {
  try {
    const searches = await RecentSearch.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(10);
    res.json({ success: true, searches });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch search history.' });
  }
});

// @route   GET /api/navigation/history
// @desc    Get route/stops planning logs
router.get('/history', protect, async (req, res) => {
  try {
    const list = await RouteHistory.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(15);
    res.json({ success: true, history: list });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch route logs.' });
  }
});

export default router;
