import express from 'express';
import protect from '../middleware/auth.js';
import Telemetry from '../models/Telemetry.js';
import Vehicle from '../models/Vehicle.js';

const router = express.Router();

// @route   GET /api/telemetry/latest
// @desc    Get latest vehicle telemetry
// @access  Private
router.get('/latest', protect, async (req, res) => {
  try {
    // Find the user's default/active vehicle first
    const vehicle = await Vehicle.findOne({ userId: req.user.id, isDefault: true }) || await Vehicle.findOne({ userId: req.user.id });
    
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'No vehicle profile registered.' });
    }

    let telemetry = await Telemetry.findOne({ vehicleId: vehicle._id }).sort({ createdAt: -1 });

    // If no telemetry record exists yet, create an initial default record based on the vehicle
    if (!telemetry) {
      telemetry = await Telemetry.create({
        userId: req.user.id,
        vehicleId: vehicle._id,
        batteryPercent: vehicle.currentCharge_percent || 45,
        range_km: vehicle.range_km || 243,
        speed_kmh: 0,
        isCharging: false,
        estimatedChargeTime_mins: 0,
        powerDraw_kW: 0,
        temperature_c: 28,
        location: {
          type: 'Point',
          coordinates: [72.8777, 19.0760]
        }
      });
    } else {
      // Sync vehicle charge if telemetry charge changed recently (from sim or websocket)
      if (telemetry.batteryPercent !== vehicle.currentCharge_percent) {
        telemetry.batteryPercent = vehicle.currentCharge_percent;
        telemetry.range_km = vehicle.range_km;
        await telemetry.save();
      }
    }

    res.json({ success: true, telemetry });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error fetching telemetry' });
  }
});

// @route   POST /api/telemetry
// @desc    Record new telemetry log
// @access  Private
router.post('/', protect, async (req, res) => {
  const { vehicleId, batteryPercent, range_km, speed_kmh, isCharging, estimatedChargeTime_mins, powerDraw_kW, temperature_c, longitude, latitude } = req.body;

  try {
    const telemetry = await Telemetry.create({
      userId: req.user.id,
      vehicleId,
      batteryPercent,
      range_km,
      speed_kmh,
      isCharging,
      estimatedChargeTime_mins,
      powerDraw_kW,
      temperature_c,
      location: longitude && latitude ? {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)]
      } : undefined
    });

    // Update vehicle state as well
    await Vehicle.findByIdAndUpdate(vehicleId, {
      currentCharge_percent: batteryPercent,
      range_km
    });

    res.status(201).json({ success: true, telemetry });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error recording telemetry' });
  }
});

export default router;
