import express from 'express';
import protect from '../middleware/auth.js';
import { adminProtect } from '../middleware/admin.js';
import User from '../models/User.js';
import Station from '../models/Station.js';
import Booking from '../models/Booking.js';
import Session from '../models/Session.js';
import Telemetry from '../models/Telemetry.js';

const router = express.Router();

// Apply authorization check to all administrative routes
router.use(protect, adminProtect);

// ==========================================
// 1. User Management (CRUD)
// ==========================================

// @route   GET /api/admin/users
// @desc    Get all users in the system
router.get('/users', async (req, res) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    res.json({ success: true, users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error retrieving users list' });
  }
});

// @route   PUT /api/admin/users/:id
// @desc    Update a user's details
router.put('/users/:id', async (req, res) => {
  const { name, email, phone, role, tier, points } = req.body;

  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (name !== undefined) user.name = name;
    if (email !== undefined) {
      const emailExists = await User.findOne({ email });
      if (emailExists && emailExists._id.toString() !== req.params.id) {
        return res.status(400).json({ success: false, message: 'Email address already in use.' });
      }
      user.email = email;
    }
    if (phone !== undefined) user.phone = phone;
    if (role !== undefined) {
      const validRoles = ['driver', 'admin', 'station_operator'];
      if (validRoles.includes(role)) {
        user.role = role;
      }
    }
    if (tier !== undefined) user.tier = tier;
    if (points !== undefined) user.points = Number(points) || 0;

    await user.save();

    res.json({
      success: true,
      message: 'User details updated successfully',
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        tier: user.tier,
        points: user.points
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error updating user details' });
  }
});

// @route   DELETE /api/admin/users/:id
// @desc    Delete a user from the system
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user._id.toString() === req.user.id.toString()) {
      return res.status(400).json({ success: false, message: 'Self-deletion is blocked.' });
    }

    await user.deleteOne();
    res.json({ success: true, message: 'User removed from system.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error removing user' });
  }
});

// ==========================================
// 2. Station Management (CRUD)
// ==========================================

// @route   GET /api/admin/stations
// @desc    Get all stations
router.get('/stations', async (req, res) => {
  try {
    const stations = await Station.find({}).sort({ createdAt: -1 });
    res.json({ success: true, stations });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error fetching stations' });
  }
});

// @route   POST /api/admin/stations
// @desc    Create a new charging station
router.post('/stations', async (req, res) => {
  const { name, operator, pricing_per_kWh, address, lat, lng, amenities, slots } = req.body;

  try {
    const generatedId = `st_${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now().toString().slice(-4)}`;

    const station = await Station.create({
      _id: generatedId,
      name,
      operator: operator || 'VoltGrid Corp',
      pricing_per_kWh: Number(pricing_per_kWh) || 12.0,
      location: {
        type: 'Point',
        coordinates: [parseFloat(lng) || 72.83, parseFloat(lat) || 19.05],
        address: address || 'Mumbai'
      },
      amenities: amenities || ['WiFi', 'Restroom'],
      rating: 4.5,
      reviewsCount: 0,
      reviews: [],
      slots: slots || [
        { id: 's1', type: 'DC Fast (CCS)', power_kW: 60, status: 'available' },
        { id: 's2', type: 'AC (Type 2)', power_kW: 22, status: 'available' }
      ]
    });

    res.status(201).json({ success: true, station });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error creating charging station' });
  }
});

// @route   PUT /api/admin/stations/:id
// @desc    Update charging station details
router.put('/stations/:id', async (req, res) => {
  const { name, operator, pricing_per_kWh, address, lat, lng, amenities, slots } = req.body;

  try {
    const station = await Station.findById(req.params.id);
    if (!station) {
      return res.status(404).json({ success: false, message: 'Station not found' });
    }

    if (name !== undefined) station.name = name;
    if (operator !== undefined) station.operator = operator;
    if (pricing_per_kWh !== undefined) station.pricing_per_kWh = Number(pricing_per_kWh);
    
    if (address !== undefined || lat !== undefined || lng !== undefined) {
      station.location = {
        type: 'Point',
        coordinates: [
          lng !== undefined ? parseFloat(lng) : station.location.coordinates[0],
          lat !== undefined ? parseFloat(lat) : station.location.coordinates[1]
        ],
        address: address !== undefined ? address : station.location.address
      };
    }

    if (amenities !== undefined) station.amenities = amenities;
    if (slots !== undefined) station.slots = slots;

    await station.save();

    // Emit live status update to connected apps
    const io = req.app.get('io');
    if (io) {
      io.emit('station:updated', { station });
    }

    res.json({ success: true, station });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error updating station details' });
  }
});

// @route   DELETE /api/admin/stations/:id
// @desc    Delete a charging station
router.delete('/stations/:id', async (req, res) => {
  try {
    const station = await Station.findById(req.params.id);
    if (!station) {
      return res.status(404).json({ success: false, message: 'Station not found' });
    }

    await station.deleteOne();
    res.json({ success: true, message: 'Charging station removed.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error deleting station' });
  }
});

// ==========================================
// 3. Booking Monitoring
// ==========================================

// @route   GET /api/admin/bookings
// @desc    Retrieve all booking logs populated with user info
router.get('/bookings', async (req, res) => {
  try {
    const bookings = await Booking.find({}).populate('userId', 'name email').sort({ createdAt: -1 });
    res.json({ success: true, bookings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error retrieving bookings' });
  }
});

// ==========================================
// 4. System Analytics Summary
// ==========================================

// @route   GET /api/admin/analytics
// @desc    Retrieve dashboard supervisory telemetry metrics
router.get('/analytics', async (req, res) => {
  try {
    const totalDrivers = await User.countDocuments({ role: 'driver' });
    const activeSessionsCount = await Session.countDocuments({ status: 'active' });
    const activeSessions = await Session.find({ status: 'active' });
    
    // Compute Active Grid Load: sum power rating of active session slots
    let activeLoadKw = 0;
    for (const session of activeSessions) {
      const station = await Station.findById(session.stationId);
      const slot = station?.slots?.find(sl => sl.id === session.slotId);
      activeLoadKw += slot?.power_kW || 75; // fallback load 75kW
    }

    // Completed sessions aggregates
    const completedSessions = await Session.find({ status: 'completed' });
    const totalEnergyDelivered = completedSessions.reduce((sum, s) => sum + (s.energy_delivered_kwh || 0), 0);
    const totalRevenue = completedSessions.reduce((sum, s) => sum + (s.total_cost || 0), 0);

    // Latest bookings log
    const recentBookings = await Booking.find({}).populate('userId', 'name email').sort({ createdAt: -1 }).limit(5);

    res.json({
      success: true,
      metrics: {
        totalDrivers,
        activeSessions: activeSessionsCount,
        activeLoadKw: Math.round(activeLoadKw),
        totalEnergyDelivered: Math.round(totalEnergyDelivered * 10) / 10,
        totalRevenue: Math.round(totalRevenue),
        occupancyRate: activeSessionsCount > 0 ? 35 : 0 // fallback percent
      },
      recentBookings
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error retrieving analytics summary' });
  }
});

// ==========================================
// 5. CSV Reports Generation
// ==========================================

// @route   GET /api/admin/reports/:type
// @desc    Download spreadsheet reports payload
router.get('/reports/:type', async (req, res) => {
  const { type } = req.params;

  try {
    if (type === 'users') {
      const users = await User.find({}).select('name email phone role tier points');
      let csv = 'Name,Email,Phone,Role,Tier,CarbonPoints\n';
      users.forEach(u => {
        csv += `"${u.name}","${u.email}","${u.phone || ''}","${u.role}","${u.tier}",${u.points || 0}\n`;
      });
      return res.json({ success: true, filename: 'ev_users_report.csv', data: csv });
    }

    if (type === 'bookings') {
      const bookings = await Booking.find({}).populate('userId', 'name email');
      let csv = 'BookingID,Driver,Email,StationID,SlotID,Time,DurationMins,Status\n';
      bookings.forEach(b => {
        const name = b.userId?.name || 'Unknown';
        const email = b.userId?.email || 'Unknown';
        const timeStr = b.scheduledTime ? b.scheduledTime.toISOString() : '';
        csv += `"${b._id}","${name}","${email}","${b.stationId}","${b.slotId}","${timeStr}",${b.duration_min},"${b.status}"\n`;
      });
      return res.json({ success: true, filename: 'ev_bookings_report.csv', data: csv });
    }

    if (type === 'stations') {
      const stations = await Station.find({});
      let csv = 'StationID,Name,Operator,SlotsCount,PricingPerKWh,Address\n';
      stations.forEach(s => {
        const address = s.location?.address || '';
        csv += `"${s._id}","${s.name}","${s.operator}",${s.slots?.length || 0},${s.pricing_per_kWh},"${address}"\n`;
      });
      return res.json({ success: true, filename: 'ev_stations_report.csv', data: csv });
    }

    res.status(400).json({ success: false, message: 'Invalid report type catalog requested.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error compiling CSV reports.' });
  }
});

export default router;
