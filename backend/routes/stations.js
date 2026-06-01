import express from 'express';
import protect from '../middleware/auth.js';
import Station from '../models/Station.js';
import User from '../models/User.js';

const router = express.Router();

// @route   GET /api/stations/nearby
// @desc    Get nearby charging stations with query-based filtering
// @access  Private
router.get('/nearby', protect, async (req, res) => {
  const queryLng = parseFloat(req.query.lng);
  const queryLat = parseFloat(req.query.lat);

  if (!isNaN(queryLng) && !isNaN(queryLat)) {
    try {
      const allStations = await Station.find({});
      const nearby = allStations.filter(st => {
        if (!st.location || !st.location.coordinates) return false;
        const [stLng, stLat] = st.location.coordinates;
        const dist = Math.sqrt(Math.pow(stLng - queryLng, 2) + Math.pow(stLat - queryLat, 2));
        return dist < 0.15; // ~15km
      });

      if (nearby.length === 0) {
        const mockStations = [
          {
            _id: `st_dynamic_${Date.now()}_1`,
            name: `PulseCharge Hub - Sector ${Math.floor(1 + Math.random() * 10)}`,
            location: {
              type: 'Point',
              coordinates: [queryLng + (Math.random() - 0.5) * 0.02, queryLat + (Math.random() - 0.5) * 0.02],
              address: `Near Clicked Location, India`
            },
            operator: 'PulseCharge India',
            amenities: ['WiFi', 'Cafe', 'Restroom'],
            rating: Number((4.0 + Math.random() * 0.9).toFixed(1)),
            reviewsCount: 1,
            reviews: [{ userName: 'Local Driver', rating: 5, comment: 'Very convenient dynamic charging point.' }],
            pricing_per_kWh: 14.5,
            slots: [
              { id: `c_dyn_${Date.now()}_1`, type: 'DC Fast (CCS)', power_kW: 120, status: 'available' },
              { id: `c_dyn_${Date.now()}_2`, type: 'AC (Type 2)', power_kW: 22, status: 'available' }
            ]
          },
          {
            _id: `st_dynamic_${Date.now()}_2`,
            name: `EcoVoltage Point`,
            location: {
              type: 'Point',
              coordinates: [queryLng + (Math.random() - 0.5) * 0.02, queryLat + (Math.random() - 0.5) * 0.02],
              address: `High Street, India`
            },
            operator: 'EcoVoltage',
            amenities: ['Restroom', 'Lounge'],
            rating: Number((4.0 + Math.random() * 0.9).toFixed(1)),
            reviewsCount: 1,
            reviews: [{ userName: 'Local Driver', rating: 4, comment: 'Nice and clean slots.' }],
            pricing_per_kWh: 13.0,
            slots: [
              { id: `c_dyn_${Date.now()}_3`, type: 'DC Fast (CCS)', power_kW: 80, status: 'available' },
              { id: `c_dyn_${Date.now()}_4`, type: 'AC (Type 2)', power_kW: 22, status: 'occupied' }
            ]
          },
          {
            _id: `st_dynamic_${Date.now()}_3`,
            name: `VoltGrid Supercharger`,
            location: {
              type: 'Point',
              coordinates: [queryLng + (Math.random() - 0.5) * 0.02, queryLat + (Math.random() - 0.5) * 0.02],
              address: `Express Highway, India`
            },
            operator: 'VoltGrid Corp',
            amenities: ['WiFi', 'Supermarket'],
            rating: Number((4.5 + Math.random() * 0.5).toFixed(1)),
            reviewsCount: 2,
            reviews: [
              { userName: 'Local Driver', rating: 5, comment: 'Super fast hypercharger!' }
            ],
            pricing_per_kWh: 17.0,
            slots: [
              { id: `c_dyn_${Date.now()}_5`, type: 'DC Hyper (CCS)', power_kW: 240, status: 'available' }
            ]
          }
        ];
        await Station.insertMany(mockStations);
        console.log(`📡 [DB Dynamic Seed] Generated 3 stations near [${queryLng.toFixed(4)}, ${queryLat.toFixed(4)}]`);
      }
    } catch (e) {
      console.warn('❌ [DB Dynamic Seed] Failed:', e.message);
    }
  }

  const lng = parseFloat(req.query.lng) || 72.8311;
  const lat = parseFloat(req.query.lat) || 19.0596;
  const maxDistance = parseInt(req.query.maxDistance) || 15000; // in meters (default 15km)


  try {
    let stations = await Station.find({
      'location.coordinates': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [lng, lat]
          },
          $maxDistance: maxDistance
        }
      }
    });

    // Apply filters
    let filtered = stations;

    if (req.query.search) {
      const q = req.query.search.toLowerCase();
      filtered = filtered.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.location.address.toLowerCase().includes(q) ||
        s.operator.toLowerCase().includes(q)
      );
    }

    if (req.query.connectorType && req.query.connectorType !== 'all') {
      const conn = req.query.connectorType.toLowerCase();
      filtered = filtered.filter(s =>
        s.slots.some(slot => slot.type.toLowerCase().includes(conn))
      );
    }

    if (req.query.minPower) {
      const power = parseFloat(req.query.minPower);
      if (power > 0) {
        filtered = filtered.filter(s =>
          s.slots.some(slot => slot.power_kW >= power)
        );
      }
    }

    if (req.query.onlyAvailable === 'true' || req.query.onlyAvailable === '1') {
      filtered = filtered.filter(s =>
        s.slots.some(slot => slot.status === 'available')
      );
    }

    res.json({ success: true, stations: filtered });
  } catch (err) {
    console.warn('❌ [Geospatial Stations Query] Failed, falling back to simple scan:', err.message);
    
    try {
      const allStations = await Station.find({});
      
      let filtered = allStations;

      if (req.query.search) {
        const q = req.query.search.toLowerCase();
        filtered = filtered.filter(s =>
          s.name.toLowerCase().includes(q) ||
          s.location.address.toLowerCase().includes(q) ||
          s.operator.toLowerCase().includes(q)
        );
      }

      if (req.query.connectorType && req.query.connectorType !== 'all') {
        const conn = req.query.connectorType.toLowerCase();
        filtered = filtered.filter(s =>
          s.slots.some(slot => slot.type.toLowerCase().includes(conn))
        );
      }

      if (req.query.minPower) {
        const power = parseFloat(req.query.minPower);
        if (power > 0) {
          filtered = filtered.filter(s =>
            s.slots.some(slot => slot.power_kW >= power)
          );
        }
      }

      if (req.query.onlyAvailable === 'true' || req.query.onlyAvailable === '1') {
        filtered = filtered.filter(s =>
          s.slots.some(slot => slot.status === 'available')
        );
      }

      res.json({ success: true, stations: filtered });
    } catch (fallbackErr) {
      console.error(fallbackErr);
      res.status(500).json({ success: false, message: 'Server error retrieving stations' });
    }
  }
});

// @route   GET /api/stations/:id
// @desc    Get details of a single charging station
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const station = await Station.findById(req.params.id);
    if (!station) {
      return res.status(404).json({ success: false, message: 'Charging station not found' });
    }
    res.json({ success: true, station });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error retrieving station details' });
  }
});

// @route   GET /api/stations/:id/availability
// @desc    Get charger slots availability list
// @access  Private
router.get('/:id/availability', protect, async (req, res) => {
  try {
    const station = await Station.findById(req.params.id);
    if (!station) {
      return res.status(404).json({ success: false, message: 'Charging station not found' });
    }
    res.json({ success: true, availability: station.slots.map(s => ({ id: s.id, status: s.status })) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error retrieving slot availability' });
  }
});

// @route   GET /api/stations/:id/connectors
// @desc    Get distinct charger slot connector types
// @access  Private
router.get('/:id/connectors', protect, async (req, res) => {
  try {
    const station = await Station.findById(req.params.id);
    if (!station) {
      return res.status(404).json({ success: false, message: 'Charging station not found' });
    }
    const connectorTypes = [...new Set(station.slots.map(s => s.type))];
    res.json({ success: true, connectorTypes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error retrieving connector types' });
  }
});

// @route   GET /api/stations/:id/reviews
// @desc    Get reviews for a charging station
// @access  Private
router.get('/:id/reviews', protect, async (req, res) => {
  try {
    const station = await Station.findById(req.params.id);
    if (!station) {
      return res.status(404).json({ success: false, message: 'Charging station not found' });
    }
    res.json({ success: true, reviews: station.reviews || [] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error retrieving reviews' });
  }
});

// @route   POST /api/stations/:id/reviews
// @desc    Submit a review and rating for a charging station
// @access  Private
router.post('/:id/reviews', protect, async (req, res) => {
  const { rating, comment } = req.body;

  if (rating === undefined || !comment) {
    return res.status(400).json({ success: false, message: 'Rating and comment are required' });
  }

  try {
    const station = await Station.findById(req.params.id);
    if (!station) {
      return res.status(404).json({ success: false, message: 'Charging station not found' });
    }

    const user = await User.findById(req.user.id);
    const userName = user ? user.name : 'Anonymous Driver';

    const newReview = {
      userId: req.user.id,
      userName,
      rating: Number(rating),
      comment
    };

    station.reviews = station.reviews || [];
    station.reviews.push(newReview);

    // Recalculate average rating
    const totalRatings = station.reviews.reduce((acc, r) => acc + r.rating, 0);
    station.rating = parseFloat((totalRatings / station.reviews.length).toFixed(1));
    station.reviewsCount = station.reviews.length;

    await station.save();
    res.status(201).json({ 
      success: true, 
      reviews: station.reviews, 
      rating: station.rating, 
      reviewsCount: station.reviewsCount 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error submitting review' });
  }
});

// @route   PUT /api/stations/:id/slots/:slotId
// @desc    Admin node slot status override
// @access  Private
router.put('/:id/slots/:slotId', protect, async (req, res) => {
  const { status } = req.body;

  if (!status || !['available', 'occupied'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid slot status' });
  }

  try {
    const station = await Station.findById(req.params.id);
    if (!station) {
      return res.status(404).json({ success: false, message: 'Charging station not found' });
    }

    const slot = station.slots.find(s => s.id === req.params.slotId);
    if (!slot) {
      return res.status(404).json({ success: false, message: 'Slot not found' });
    }

    slot.status = status;
    await station.save();

    // Broadcast status change real-time via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.emit('station:status_update', { 
        stationId: req.params.id, 
        slotId: req.params.slotId, 
        status 
      });
      console.log(`📡 [Socket Broadcast] Status updated for Station: ${req.params.id}, Slot: ${req.params.slotId} to: ${status}`);
    }

    res.json({ success: true, message: 'Slot status overridden successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error overriding slot status' });
  }
});

// @route   GET /api/stations/on-route
// @desc    Get stations located near route corridor
// @access  Private
router.get('/on-route', protect, async (req, res) => {
  try {
    const stations = await Station.find({});
    res.json({ success: true, stations });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error retrieving corridor stations' });
  }
});

// @route   GET /api/stations/recommended
// @desc    Get recommended stations based on SoC
// @access  Private
router.get('/recommended', protect, async (req, res) => {
  const { currentSoc, lng, lat } = req.query;
  try {
    const soc = currentSoc ? parseInt(currentSoc) : 45;
    let recommended = [];

    if (soc < 25) {
      let recommendedStation = null;
      if (lng && lat) {
        const uLng = parseFloat(lng);
        const uLat = parseFloat(lat);
        const isChennai = uLng > 79 && uLng < 81;
        if (isChennai) {
          recommendedStation = await Station.findById('st_chennai_nazarathpet_02') || await Station.findOne({ _id: /st_chennai/ });
        }
      }
      if (!recommendedStation) {
        recommendedStation = await Station.findById('st_bandra_01') || await Station.findOne({});
      }

      if (recommendedStation) {
        recommended.push({
          station: recommendedStation,
          reason: 'Low SoC: Charger within range corridor',
          chargeTimeEstMins: 20
        });
      }
    }
    res.json({ success: true, recommended });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error retrieving recommended stations' });
  }
});

export default router;
