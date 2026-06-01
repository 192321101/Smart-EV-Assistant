import express from 'express';
import protect from '../middleware/auth.js';
import Vehicle from '../models/Vehicle.js';
import Telemetry from '../models/Telemetry.js';

const router = express.Router();

// @route   GET /api/vehicles
// @desc    Get user vehicles
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const vehicles = await Vehicle.find({ userId: req.user.id });
    res.json({ success: true, vehicles });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error fetching vehicles' });
  }
});

// @route   POST /api/vehicles
// @desc    Add a vehicle to driver's garage
// @access  Private
router.post('/', protect, async (req, res) => {
  const { name, brand, model, year, batteryCapacity_kWh, currentCharge_percent, range_km, isDefault, plateNumber, connectorType, color } = req.body;

  try {
    // If setting this one to default, unset other defaults first
    if (isDefault) {
      await Vehicle.updateMany({ userId: req.user.id }, { isDefault: false });
    }

    // If it's the user's first vehicle, make it default regardless
    const count = await Vehicle.countDocuments({ userId: req.user.id });
    const setDefault = count === 0 ? true : !!isDefault;

    // Calculate initial range if not supplied
    const capacity = parseFloat(batteryCapacity_kWh) || 40;
    const soc = parseFloat(currentCharge_percent) || 50;
    const range = parseInt(range_km) || Math.round(capacity * 6.5 * (soc / 100));

    const vehicle = await Vehicle.create({
      userId: req.user.id,
      name,
      brand,
      model,
      year: parseInt(year) || new Date().getFullYear(),
      batteryCapacity_kWh: capacity,
      currentCharge_percent: soc,
      range_km: range,
      plateNumber: plateNumber || '',
      connectorType: connectorType || 'CCS',
      color: color || '#0ea5e9',
      isDefault: setDefault
    });

    res.status(201).json({ success: true, vehicle });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error creating vehicle' });
  }
});

// @route   PUT /api/vehicles/:id
// @desc    Update a vehicle's specifications
// @access  Private
router.put('/:id', protect, async (req, res) => {
  const { name, brand, model, year, batteryCapacity_kWh, currentCharge_percent, range_km, isDefault, plateNumber, connectorType, color } = req.body;

  try {
    const vehicle = await Vehicle.findOne({ _id: req.id || req.params.id, userId: req.user.id });

    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    // If setting this to default, clear defaults on all other user vehicles
    if (isDefault) {
      await Vehicle.updateMany({ userId: req.user.id }, { isDefault: false });
    }

    if (name !== undefined) vehicle.name = name;
    if (brand !== undefined) vehicle.brand = brand;
    if (model !== undefined) vehicle.model = model;
    if (year !== undefined) vehicle.year = parseInt(year) || vehicle.year;
    if (plateNumber !== undefined) vehicle.plateNumber = plateNumber;
    if (connectorType !== undefined) vehicle.connectorType = connectorType;
    if (color !== undefined) vehicle.color = color;
    
    if (batteryCapacity_kWh !== undefined) {
      vehicle.batteryCapacity_kWh = parseFloat(batteryCapacity_kWh);
    }
    
    if (currentCharge_percent !== undefined) {
      vehicle.currentCharge_percent = parseFloat(currentCharge_percent);
    }

    if (isDefault !== undefined) {
      vehicle.isDefault = !!isDefault;
    }

    // Recompute range if capacity or SoC changed
    if (batteryCapacity_kWh !== undefined || currentCharge_percent !== undefined) {
      const capacity = vehicle.batteryCapacity_kWh;
      const soc = vehicle.currentCharge_percent;
      vehicle.range_km = Math.round(capacity * 6.5 * (soc / 100));
    } else if (range_km !== undefined) {
      vehicle.range_km = parseInt(range_km);
    }

    await vehicle.save();

    // Verify at least one default exists
    if (!vehicle.isDefault) {
      const activeDefaultCount = await Vehicle.countDocuments({ userId: req.user.id, isDefault: true });
      if (activeDefaultCount === 0) {
        vehicle.isDefault = true;
        await vehicle.save();
      }
    }

    res.json({ success: true, vehicle });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error updating vehicle' });
  }
});

// @route   PUT /api/vehicles/:id/default
// @desc    Set vehicle as default (active) garage vehicle
// @access  Private
router.put('/:id/default', protect, async (req, res) => {
  try {
    const vehicle = await Vehicle.findOne({ _id: req.id || req.params.id, userId: req.user.id });

    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    // Unset other defaults
    await Vehicle.updateMany({ userId: req.user.id }, { isDefault: false });

    vehicle.isDefault = true;
    await vehicle.save();

    res.json({ success: true, vehicle });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error setting default vehicle' });
  }
});

// @route   DELETE /api/vehicles/:id
// @desc    Delete a vehicle
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const vehicle = await Vehicle.findOne({ _id: req.id || req.params.id, userId: req.user.id });

    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    await vehicle.deleteOne();

    // If we deleted the default vehicle, auto-assign default to another vehicle if any exist
    if (vehicle.isDefault) {
      const remaining = await Vehicle.findOne({ userId: req.user.id });
      if (remaining) {
        remaining.isDefault = true;
        await remaining.save();
      }
    }

    res.json({ success: true, message: 'Vehicle removed from garage' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error deleting vehicle' });
  }
});

// @route   PUT /api/vehicles/:id/battery
// @desc    Update battery state of charge & range telemetry
// @access  Private
router.put('/:id/battery', protect, async (req, res) => {
  const { batteryPercent } = req.body;

  try {
    const vehicle = await Vehicle.findOne({ _id: req.id || req.params.id, userId: req.user.id });

    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    const soc = Math.max(0, Math.min(100, parseFloat(batteryPercent)));
    const range = Math.round(vehicle.batteryCapacity_kWh * 6.5 * (soc / 100));

    vehicle.currentCharge_percent = soc;
    vehicle.range_km = range;
    await vehicle.save();

    // Synchronize telemetry collection in the DB
    await Telemetry.findOneAndUpdate(
      { vehicleId: vehicle._id },
      { batteryPercent: soc, range_km: range },
      { upsert: true }
    );

    res.json({ success: true, vehicle });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error syncing battery status' });
  }
});

export default router;
