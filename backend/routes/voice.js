import express from 'express';
import protect from '../middleware/auth.js';
import VoiceLog from '../models/VoiceLog.js';
import { generateConversationalReply } from '../utils/voiceAssistant.js';
import Vehicle from '../models/Vehicle.js';
import Telemetry from '../models/Telemetry.js';
import Station from '../models/Station.js';

const router = express.Router();

// @route   GET /api/voice/history
// @desc    Get user conversation logs
// @access  Private
router.get('/history', protect, async (req, res) => {
  try {
    const logs = await VoiceLog.find({ userId: req.user.id }).sort({ createdAt: 1 }).limit(50);
    res.json({ success: true, history: logs });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error fetching voice command logs.' });
  }
});

// @route   POST /api/voice/command
// @desc    Process text voice command and save to database logs
// @access  Private
router.post('/command', protect, async (req, res) => {
  const { command } = req.body;

  if (!command) {
    return res.status(400).json({ success: false, message: 'Command text is required.' });
  }

  try {
    // 1. Log driver query
    await VoiceLog.create({
      userId: req.user.id,
      sender: 'user',
      text: command
    });

    // Fetch user vehicle & telemetry details
    const vehicle = await Vehicle.findOne({ userId: req.user.id, isDefault: true }) || await Vehicle.findOne({ userId: req.user.id });
    const telemetry = await Telemetry.findOne({ userId: req.user.id });

    // Fetch nearby stations for coordinates
    let userCoords = [80.0945, 13.0473]; // Default: Poonamallee
    if (telemetry && telemetry.location && telemetry.location.coordinates) {
      userCoords = telemetry.location.coordinates;
    }

    const stations = await Station.find({
      'location.coordinates': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: userCoords
          },
          $maxDistance: 5000000
        }
      }
    }).limit(5);

    // Check for battery update command
    const cleanCmd = command.toLowerCase().trim();
    const updateBatteryMatch = cleanCmd.match(/(?:set|update|change|is)\s+(?:my\s+)?(?:current\s+)?(?:battery|charge|percentage|soc)(?:\s+(?:battery|charge|percentage|soc))*\s+(?:to|as)\s+(\d+)/i) ||
                               ((cleanCmd.includes('battery') || cleanCmd.includes('charge') || cleanCmd.includes('soc')) && cleanCmd.match(/(\d+)\s*(?:percent|%)/i));

    if (updateBatteryMatch) {
      const targetPercent = parseInt(updateBatteryMatch[1], 10);
      if (targetPercent >= 0 && targetPercent <= 100) {
        if (vehicle) {
          const capacity = vehicle.batteryCapacity_kWh || 40.5;
          const calculatedRange = Math.round(capacity * 6.5 * (targetPercent / 100));
          
          vehicle.currentCharge_percent = targetPercent;
          vehicle.range_km = calculatedRange;
          await vehicle.save();

          await Telemetry.findOneAndUpdate(
            { vehicleId: vehicle._id },
            { batteryPercent: targetPercent, range_km: calculatedRange },
            { upsert: true, new: true }
          );

          if (telemetry) {
            telemetry.batteryPercent = targetPercent;
            telemetry.range_km = calculatedRange;
          }
        }
      }
    }

    // 2. Generate conversational reply with live context
    const result = generateConversationalReply(command, command, vehicle, telemetry, stations);

    // 3. Log assistant reply
    await VoiceLog.create({
      userId: req.user.id,
      sender: 'assistant',
      text: result.text
    });

    res.json({
      success: true,
      reply: result.text,
      intent: result.intent,
      action: result.action,
      targetPage: result.targetPage,
      params: result.params
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error processing voice command.' });
  }
});

export default router;
