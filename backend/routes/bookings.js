import express from 'express';
import protect from '../middleware/auth.js';
import Booking from '../models/Booking.js';
import User from '../models/User.js';
import Station from '../models/Station.js';

const router = express.Router();

// @route   GET /api/bookings
// @desc    Get user bookings
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json({ success: true, bookings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error fetching bookings' });
  }
});

// @route   GET /api/bookings/upcoming
// @desc    Get user's upcoming active reservations
// @access  Private
router.get('/upcoming', protect, async (req, res) => {
  try {
    const now = new Date();
    const bookings = await Booking.find({
      userId: req.user.id,
      status: 'active',
      scheduledTime: { $gte: now }
    }).sort({ scheduledTime: 1 });

    const populated = await Promise.all(bookings.map(async (booking) => {
      const station = await Station.findById(booking.stationId);
      return {
        ...booking.toObject(),
        stationName: station ? station.name : 'Unknown Station',
        stationAddress: station ? station.location.address : ''
      };
    }));

    res.json({ success: true, bookings: populated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error fetching upcoming bookings' });
  }
});

// @route   GET /api/bookings/history
// @desc    Get user's booking history (past, cancelled, or completed)
// @access  Private
router.get('/history', protect, async (req, res) => {
  try {
    const now = new Date();
    const bookings = await Booking.find({
      userId: req.user.id,
      $or: [
        { status: { $in: ['cancelled', 'completed'] } },
        { scheduledTime: { $lt: now } }
      ]
    }).sort({ scheduledTime: -1 });

    const populated = await Promise.all(bookings.map(async (booking) => {
      const station = await Station.findById(booking.stationId);
      return {
        ...booking.toObject(),
        stationName: station ? station.name : 'Unknown Station',
        stationAddress: station ? station.location.address : ''
      };
    }));

    res.json({ success: true, bookings: populated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error fetching booking history' });
  }
});

// @route   POST /api/bookings
// @desc    Create a new slot booking
// @access  Private
router.post('/', protect, async (req, res) => {
  const { stationId, slotId, scheduledTime, duration_min, vehicleId, paymentId } = req.body;

  // SEC-028: Validate that paymentId is provided (placeholder — integrate payment provider for full verification).
  if (!paymentId || typeof paymentId !== 'string' || paymentId.trim() === '') {
    return res.status(400).json({ success: false, message: 'A valid payment reference is required to create a booking.' });
  }

  try {
    // 1. SEC-026: Atomic slot availability check + status update to prevent race conditions (TOCTOU fix).
    // This single operation finds the station only if the target slot is 'available',
    // and atomically sets it to 'occupied'. If the slot was already taken, result is null.
    const updatedStation = await Station.findOneAndUpdate(
      {
        _id: stationId,
        'slots.id': slotId,
        'slots.status': 'available'
      },
      {
        $set: { 'slots.$.status': 'occupied' }
      },
      { new: true }
    );

    if (!updatedStation) {
      // Station not found OR slot was already occupied at the moment of the atomic check.
      const station = await Station.findById(stationId);
      if (!station) {
        return res.status(404).json({ success: false, message: 'Charging station not found.' });
      }
      const slot = station.slots.find(s => s.id === slotId);
      if (!slot) {
        return res.status(404).json({ success: false, message: 'Charging slot not found.' });
      }
      return res.status(409).json({ success: false, message: 'Charging slot is already occupied. Please choose another slot.' });
    }

    // 2. Create booking record.
    const booking = await Booking.create({
      userId: req.user.id,
      stationId,
      slotId,
      scheduledTime: new Date(scheduledTime),
      duration_min: parseInt(duration_min) || 60,
      vehicleId,
      paymentId: paymentId.trim()
    });

    // 3. Broadcast status change real-time via Socket.IO.
    const io = req.app.get('io');
    if (io) {
      io.emit('station:status_update', { stationId, slotId, status: 'occupied' });
    }

    // 4. Award carbon points to user.
    const user = await User.findById(req.user.id);
    if (user) {
      user.points = (user.points || 0) + 50;
      if (user.points >= 1000) {
        user.tier = 'gold';
      } else if (user.points >= 500) {
        user.tier = 'silver';
      }
      await user.save();
    }

    res.status(201).json({ success: true, booking });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error creating booking.' });
  }
});

// @route   PUT /api/bookings/:id/cancel
// @desc    Cancel an active slot booking
// @access  Private
router.put('/:id/cancel', protect, async (req, res) => {
  try {
    const booking = await Booking.findOne({ _id: req.id || req.params.id, userId: req.user.id });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    booking.status = 'cancelled';
    await booking.save();

    // Release slot status in Charging Station
    const station = await Station.findOne({ _id: booking.stationId });
    if (station) {
      const slot = station.slots.find(s => s.id === booking.slotId);
      if (slot) {
        slot.status = 'available';
        await station.save();

        // Broadcast status change real-time via Socket.IO
        const io = req.app.get('io');
        if (io) {
          io.emit('station:status_update', { 
            stationId: booking.stationId, 
            slotId: booking.slotId, 
            status: 'available' 
          });
          console.log(`📡 [Socket Broadcast] Status updated for Station: ${booking.stationId}, Slot: ${booking.slotId} to: available`);
        }
      }
    }

    res.json({ success: true, message: 'Booking cancelled successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error cancelling booking.' });
  }
});

export default router;
