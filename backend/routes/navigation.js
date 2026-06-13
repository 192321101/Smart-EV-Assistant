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

// Mock Locations list in case DB has not been seeded yet
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
  { name: 'Sriperumbudur', address: 'Sriperumbudur Highway, Tamil Nadu', coordinates: [79.9722, 12.9734], type: 'destination' }
];

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
    
    // Look up location name in DB or fallback mock
    // SEC-012: Escape destination before using in RegExp to prevent ReDoS.
    const dbLoc = await SavedLocation.findOne({ name: new RegExp(escapeRegex(destination), 'i') });
    if (dbLoc) {
      resolvedDestCoords = dbLoc.coordinates;
      resolvedDestName = dbLoc.name;
    } else {
      const mockLoc = defaultPlaces.find(p => p.name.toLowerCase().includes(destination.toLowerCase()));
      if (mockLoc) {
        resolvedDestCoords = mockLoc.coordinates;
        resolvedDestName = mockLoc.name;
      }
    }

    // Calculate simulated distance in km using coords distance scale
    const rawDist = Math.sqrt(
      Math.pow(resolvedDestCoords[0] - resolvedStartCoords[0], 2) +
      Math.pow(resolvedDestCoords[1] - resolvedStartCoords[1], 2)
    );
    // Scale distance based on whether it is Chennai local (Chennai span ~0.11 long/lat)
    const isChennaiLocal = resolvedStartCoords[0] > 79 && resolvedDestCoords[0] > 79;
    const scalingFactor = isChennaiLocal ? 150 : 120;
    const distanceVal = Number(Math.max(2.0, rawDist * scalingFactor).toFixed(1)); 
    const estTimeVal = Math.round(distanceVal * 1.8); // 1.8 mins per km

    // Canvas points mapping dynamically projected from GPS coordinates
    const startPoint = getCanvasCoordsFromGPS(resolvedStartCoords[0], resolvedStartCoords[1]);
    const destPoint = getCanvasCoordsFromGPS(resolvedDestCoords[0], resolvedDestCoords[1]);
    const pathCoordinates = generatePath(startPoint, destPoint);

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
      gpsCoordinates: generateGpsPath(resolvedStartCoords, resolvedDestCoords),
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
    // SEC-012: Escape user query before building regex.
    const safeQ = escapeRegex(q);
    const dbMatches = await SavedLocation.find({
      $or: [
        { name: new RegExp(safeQ, 'i') },
        { address: new RegExp(safeQ, 'i') }
      ]
    }).limit(5);

    let suggestions = dbMatches.map(item => ({
      name: item.name,
      address: item.address,
      coordinates: item.coordinates,
      type: item.type
    }));

    // Filter defaults in case DB has few elements
    if (suggestions.length < 3) {
      const mockMatches = defaultPlaces.filter(p =>
        p.name.toLowerCase().includes(q.toLowerCase()) ||
        p.address.toLowerCase().includes(q.toLowerCase())
      );
      mockMatches.forEach(mock => {
        if (!suggestions.some(s => s.name.toLowerCase() === mock.name.toLowerCase())) {
          suggestions.push(mock);
        }
      });
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
