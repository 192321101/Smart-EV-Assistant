import express from 'express';
import protect from '../middleware/auth.js';
import User from '../models/User.js';

const router = express.Router();

const MOCK_LEADERS = [
  { name: 'Priya Sharma', points: 1420, tier: 'gold' },
  { name: 'Ananya Goel', points: 1100, tier: 'gold' },
  { name: 'Rohan Mehta', points: 950, tier: 'silver' },
  { name: 'Vikram Singh', points: 720, tier: 'silver' }
];

// @route   GET /api/rewards/leaderboard
// @desc    Get carbon points ranking leaderboard
// @access  Private
router.get('/leaderboard', protect, async (req, res) => {
  try {
    const dbUsers = await User.find({}).select('name points tier').sort({ points: -1 }).limit(10);
    
    // Combine real DB drivers with mock competitors to present a complete ranking
    let leaderboard = dbUsers.map(u => ({
      name: u.name,
      points: u.points,
      tier: u.tier
    }));

    // Seed mock entries if DB is empty / sparse
    MOCK_LEADERS.forEach(mock => {
      const exists = leaderboard.some(l => l.name === mock.name);
      if (!exists) {
        leaderboard.push(mock);
      }
    });

    // Re-sort and attach rank indices
    leaderboard.sort((a, b) => b.points - a.points);
    const rankedLeaderboard = leaderboard.map((item, idx) => ({
      rank: idx + 1,
      name: item.name,
      points: item.points,
      tier: item.tier
    }));

    res.json({ success: true, leaderboard: rankedLeaderboard });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error retrieving leaderboard' });
  }
});

// @route   POST /api/rewards/redeem
// @desc    Deduct points for active vouchers
// @access  Private
router.post('/redeem', protect, async (req, res) => {
  const { pointsToRedeem } = req.body;

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const cost = parseInt(pointsToRedeem) || 0;
    if (user.points < cost) {
      return res.status(400).json({ success: false, message: `Insufficient carbon coins balance. Needed: ${cost}` });
    }

    // Deduct points
    user.points = Math.max(0, user.points - cost);
    await user.save();

    const voucherCode = `VOLT-REDEEM-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    res.json({
      success: true,
      couponCode: voucherCode,
      message: 'Voucher successfully unlocked using your Carbon Coins!',
      userPoints: user.points
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error during reward redemption' });
  }
});

export default router;
