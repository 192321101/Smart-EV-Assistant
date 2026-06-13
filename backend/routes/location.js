import express from 'express';
import mongoose from 'mongoose';
import protect from '../middleware/auth.js';
import Telemetry from '../models/Telemetry.js';
import Vehicle from '../models/Vehicle.js';

const router = express.Router();

// @route   POST /api/location/update
// @desc    Update current GPS coordinates
// @access  Private
router.post('/update', protect, async (req, res) => {
  const { lat, lng, speedKmph } = req.body;

  if (lat === undefined || lng === undefined) {
    return res.status(400).json({ success: false, message: 'Latitude and longitude are required.' });
  }

  try {
    const vehicle = await Vehicle.findOne({ userId: req.user.id, isDefault: true }) || await Vehicle.findOne({ userId: req.user.id });
    const vehicleId = vehicle ? vehicle._id : new mongoose.Types.ObjectId();

    let telemetry = await Telemetry.findOne({ userId: req.user.id });
    if (!telemetry) {
      telemetry = new Telemetry({
        userId: req.user.id,
        vehicleId,
        batteryPercent: vehicle ? vehicle.currentCharge_percent : 45,
        range_km: vehicle ? vehicle.range_km : 243
      });
    }

    telemetry.location = {
      type: 'Point',
      coordinates: [parseFloat(lng), parseFloat(lat)]
    };
    if (speedKmph !== undefined) {
      telemetry.speed_kmh = parseFloat(speedKmph);
    }

    await telemetry.save();

    // SEC-025: Broadcast location only to this user's own Socket.IO room, not all clients.
    const io = req.app.get('io');
    if (io) {
      io.to(req.user.id.toString()).emit('location:updated', {
        userId: req.user.id,
        coordinates: [parseFloat(lng), parseFloat(lat)],
        speedKmph: speedKmph || 0,
        stations: []
      });
    }

    res.json({
      success: true,
      message: 'Location updated successfully',
      coordinates: [parseFloat(lng), parseFloat(lat)]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error updating location' });
  }
});

// @route   GET /api/location/current
// @desc    Get current GPS location
// @access  Private
router.get('/current', protect, async (req, res) => {
  try {
    const telemetry = await Telemetry.findOne({ userId: req.user.id });
    if (!telemetry || !telemetry.location || !telemetry.location.coordinates) {
      // Default to Bandra West if not found
      return res.json({ success: true, coordinates: [72.8311, 19.0596] });
    }
    res.json({ success: true, coordinates: telemetry.location.coordinates });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error retrieving current location' });
  }
});

export default router;
