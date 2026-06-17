import express from 'express';
import protect from '../middleware/auth.js';
import Session from '../models/Session.js';
import Station from '../models/Station.js';
import AnalyticsSummary from '../models/AnalyticsSummary.js';

const router = express.Router();

// Helper function to update or create user's cumulative analytics summary record in MongoDB
export async function updateUserAnalyticsSummary(userId) {
  try {
    const sessions = await Session.find({ userId, status: 'completed' });
    const totalKwh = sessions.reduce((sum, s) => sum + (s.energy_delivered_kwh || 0), 0);
    const totalCost = sessions.reduce((sum, s) => sum + (s.total_cost || 0), 0);
    
    // Nexon EV Max emission savings rate: approx 0.8kg CO2 saved per kWh
    const totalCo2Saved = Math.round(totalKwh * 0.8 * 10) / 10;
    
    // Compute average driving consumption (Wh/km). Assume Nexon EV Max base of 165Wh/km
    const avgEfficiency_whKm = 165;

    const summary = await AnalyticsSummary.findOneAndUpdate(
      { userId },
      {
        totalKwh: Math.round(totalKwh * 10) / 10,
        totalCost: Math.round(totalCost),
        totalCo2Saved,
        avgEfficiency_whKm,
        sessionsCount: sessions.length,
        lastUpdated: new Date()
      },
      { upsert: true, new: true }
    );
    return summary;
  } catch (err) {
    console.error('❌ [Analytics Update] Failed to update summary:', err.message);
    return null;
  }
}

// @route   GET /api/analytics/energy
// @desc    Get energy consumption analytics
// @access  Private
router.get('/energy', protect, async (req, res) => {
  try {
    // Sync summary in DB
    const summary = await updateUserAnalyticsSummary(req.user.id);
    const sessions = await Session.find({ userId: req.user.id, status: 'completed' });
    
    // Aggregate by day of week
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const energyByDay = { 'Mon': 0, 'Tue': 0, 'Wed': 0, 'Thu': 0, 'Fri': 0, 'Sat': 0, 'Sun': 0 };
    
    sessions.forEach(session => {
      const dayName = days[new Date(session.start_time).getDay()];
      if (energyByDay[dayName] !== undefined) {
        energyByDay[dayName] += session.energy_delivered_kwh || 0;
      }
    });

    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    // Use real values or fallback to mock defaults if database has zero telemetry logged yet
    const data = labels.map(l => {
      const val = Math.round(energyByDay[l] * 10) / 10;
      return val > 0 ? val : Math.round(10 + Math.random() * 25);
    });

    const totalKwh = summary ? summary.totalKwh : data.reduce((a, b) => a + b, 0);

    res.json({
      success: true,
      labels,
      data,
      total_kwh: totalKwh || data.reduce((a, b) => a + b, 0)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error fetching energy analytics' });
  }
});

// @route   GET /api/analytics/spending
// @desc    Get spending cost analytics
// @access  Private
router.get('/spending', protect, async (req, res) => {
  try {
    const summary = await updateUserAnalyticsSummary(req.user.id);
    const sessions = await Session.find({ userId: req.user.id, status: 'completed' });

    // Aggregate by day
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const spendingByDay = { 'Mon': 0, 'Tue': 0, 'Wed': 0, 'Thu': 0, 'Fri': 0, 'Sat': 0, 'Sun': 0 };

    sessions.forEach(session => {
      const dayName = days[new Date(session.start_time).getDay()];
      if (spendingByDay[dayName] !== undefined) {
        spendingByDay[dayName] += session.total_cost || 0;
      }
    });

    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const history = labels.map(l => {
      const cost = Math.round(spendingByDay[l]);
      return {
        label: l,
        cost: cost > 0 ? cost : (Math.random() > 0.3 ? Math.round(100 + Math.random() * 400) : 0)
      };
    });

    const totalSpent = summary ? summary.totalCost : history.reduce((sum, h) => sum + h.cost, 0);

    res.json({
      success: true,
      total_spent: totalSpent || history.reduce((sum, h) => sum + h.cost, 0),
      breakdown: [
        { name: 'Fast Charging', value: 65 },
        { name: 'Slow Charging', value: 25 },
        { name: 'Parking Fees', value: 10 }
      ],
      history
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error fetching spending analytics' });
  }
});

// @route   GET /api/analytics/co2
// @desc    Get environmental savings metrics
// @access  Private
router.get('/co2', protect, async (req, res) => {
  try {
    const summary = await updateUserAnalyticsSummary(req.user.id);
    const co2Saved = summary ? summary.totalCo2Saved : 124.5;
    const treesEquivalent = Math.round(co2Saved / 22); // 1 mature tree absorbs ~22kg CO2 per year
    const forestKm = Math.round((co2Saved / 100) * 100) / 100;

    res.json({
      success: true,
      co2_saved_kg: co2Saved || 124.5,
      equivalences: {
        trees: treesEquivalent || 4,
        forest_km: forestKm || 1.25
      },
      chart_data: [
        { month: 'Jan', saved: Math.round((co2Saved || 124.5) * 0.1) },
        { month: 'Feb', saved: Math.round((co2Saved || 124.5) * 0.15) },
        { month: 'Mar', saved: Math.round((co2Saved || 124.5) * 0.25) },
        { month: 'Apr', saved: Math.round((co2Saved || 124.5) * 0.2) },
        { month: 'May', saved: Math.round((co2Saved || 124.5) * 0.3) }
      ]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error fetching environmental analytics' });
  }
});

// @route   GET /api/analytics/history
// @desc    Get user's completed charging session histories
// @access  Private
router.get('/history', protect, async (req, res) => {
  try {
    const sessions = await Session.find({ userId: req.user.id, status: 'completed' }).sort({ createdAt: -1 });
    
    const populated = await Promise.all(sessions.map(async (s) => {
      const station = await Station.findById(s.stationId);
      return {
        _id: s._id,
        stationName: station ? station.name : 'VoltGrid Supercharger',
        stationAddress: station ? station.location.address : 'Hiranandani Gardens, Powai, Mumbai',
        energyDelivered: s.energy_delivered_kwh || 35.5,
        cost: s.total_cost || 532.5,
        durationMins: s.end_time ? Math.round((new Date(s.end_time) - new Date(s.start_time)) / 60000) : 45,
        date: s.start_time
      };
    }));

    res.json({ success: true, history: populated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error fetching completed charging history' });
  }
});

// @route   GET /api/analytics/efficiency
// @desc    Get user's vehicle driving efficiency parameters
// @access  Private
router.get('/efficiency', protect, async (req, res) => {
  try {
    const summary = await AnalyticsSummary.findOne({ userId: req.user.id });
    const avgEfficiency = summary ? summary.avgEfficiency_whKm : 165;

    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    // Generate daily efficiency variations (Wh/km)
    const data = labels.map((l, idx) => {
      const daysOffset = [0, 8, -5, 15, -2, 25, 10]; // simulated variation per day
      return avgEfficiency + daysOffset[idx];
    });

    res.json({
      success: true,
      labels,
      data,
      average_wh_km: avgEfficiency,
      hvac_impact_percent: 12,
      speed_impact_percent: 15,
      performance_score: 92
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error fetching vehicle efficiency analytics' });
  }
});

export default router;
