import express from 'express';
import protect from '../middleware/auth.js';
import Notification from '../models/Notification.js';

const router = express.Router();

// @route   GET /api/notifications
// @desc    Get user notifications
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json({ success: true, notifications });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error fetching notifications' });
  }
});

// @route   PUT /api/notifications/read-all
// @desc    Mark all notifications as read
// @access  Private
router.put('/read-all', protect, async (req, res) => {
  try {
    await Notification.updateMany({ userId: req.user.id }, { isRead: true });
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error marking notifications read' });
  }
});

// @route   PUT /api/notifications/:id/read
// @desc    Mark specific notification as read
// @access  Private
router.put('/:id/read', protect, async (req, res) => {
  try {
    const notif = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { isRead: true },
      { new: true }
    );
    if (!notif) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    res.json({ success: true, notification: notif });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error marking notification read' });
  }
});

export default router;
