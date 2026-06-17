import express from 'express';
import protect from '../middleware/auth.js';
import Session from '../models/Session.js';
import Station from '../models/Station.js';
import { updateUserAnalyticsSummary } from './analytics.js';

const router = express.Router();

// @route   GET /api/sessions
// @desc    Get user charging sessions
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const sessions = await Session.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json({ success: true, sessions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error fetching sessions' });
  }
});

// @route   POST /api/sessions/start
// @desc    Start an active charging session
// @access  Private
router.post('/start', protect, async (req, res) => {
  const { vehicleId, stationId, slotId } = req.body;

  try {
    // End any current active sessions for the user to keep database clean
    await Session.updateMany({ userId: req.user.id, status: 'active' }, { status: 'completed', end_time: new Date() });

    // Mark slot as occupied in station schema
    const station = await Station.findOne({ _id: stationId });
    if (station) {
      const slot = station.slots.find(s => s.id === slotId);
      if (slot) {
        slot.status = 'occupied';
        await station.save();

        // Broadcast occupancy status change via Socket.IO
        const io = req.app.get('io');
        if (io) {
          io.emit('station:status_update', { stationId, slotId, status: 'occupied' });
        }
      }
    }

    const session = await Session.create({
      userId: req.user.id,
      vehicleId,
      stationId,
      slotId,
      status: 'active',
      start_time: new Date(),
      energy_delivered_kwh: 0,
      total_cost: 0
    });

    res.status(201).json({ success: true, session });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error starting charging session' });
  }
});

// @route   PUT /api/sessions/:id/end
// @desc    Terminate an active charging session
// @access  Private
router.put('/:id/end', protect, async (req, res) => {
  try {
    const session = await Session.findOne({ _id: req.id || req.params.id, userId: req.user.id });

    if (!session) {
      return res.status(404).json({ success: false, message: 'Active session not found' });
    }

    session.status = 'completed';
    session.end_time = new Date();
    await session.save();

    // Release slot status in station schema
    const station = await Station.findOne({ _id: session.stationId });
    if (station) {
      const slot = station.slots.find(s => s.id === session.slotId);
      if (slot) {
        slot.status = 'available';
        await station.save();

        // Broadcast release status change via Socket.IO
        const io = req.app.get('io');
        if (io) {
          io.emit('station:status_update', { stationId: session.stationId, slotId: session.slotId, status: 'available' });
        }
      }
    }

    // Refresh database summary statistics in MongoDB
    await updateUserAnalyticsSummary(req.user.id);

    res.json({ success: true, message: 'Session stopped successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error ending charging session' });
  }
});

export default router;
