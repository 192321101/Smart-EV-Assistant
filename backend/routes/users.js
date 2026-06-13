import express from 'express';
import protect from '../middleware/auth.js';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// SEC-015: Reusable password strength validator.
const isStrongPassword = (pwd) => {
  return (
    typeof pwd === 'string' &&
    pwd.length >= 8 &&
    /[A-Z]/.test(pwd) &&
    /[0-9]/.test(pwd) &&
    /[^A-Za-z0-9]/.test(pwd)
  );
};

// SEC-014: Allowed image MIME types and their magic byte signatures.
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MIME_TO_EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/gif': 'gif', 'image/webp': 'webp' };
const MAGIC_BYTES = {
  'image/jpeg': [0xFF, 0xD8, 0xFF],
  'image/png':  [0x89, 0x50, 0x4E, 0x47],
  'image/gif':  [0x47, 0x49, 0x46],
  'image/webp': [0x52, 0x49, 0x46, 0x46] // 'RIFF'
};

const validateImageMagicBytes = (buffer, mimeType) => {
  const expected = MAGIC_BYTES[mimeType];
  if (!expected) return false;
  return expected.every((byte, i) => buffer[i] === byte);
};

// @route   GET /api/users/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User profile not found' });
    }
    
    res.json({
      success: true,
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        evModel: user.evModel,
        role: user.role,
        points: user.points,
        tier: user.tier,
        profileImage: user.profileImage,
        targetCharge: user.targetCharge,
        allowPush: user.allowPush,
        allowSmsAlert: user.allowSmsAlert
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error retrieving profile' });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile (name, email, phone)
// @access  Private
router.put('/profile', protect, async (req, res) => {
  const { name, email, phone } = req.body;

  if (!name || name.trim() === '') {
    return res.status(400).json({ success: false, message: 'Name cannot be empty.' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
  }

  try {
    const userExists = await User.findOne({ email });
    if (userExists && userExists._id.toString() !== req.user.id) {
      return res.status(400).json({ success: false, message: 'Email address is already in use by another account.' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.name = name;
    user.email = email;
    if (phone !== undefined) user.phone = phone;

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        evModel: user.evModel,
        role: user.role,
        points: user.points,
        tier: user.tier,
        profileImage: user.profileImage,
        targetCharge: user.targetCharge,
        allowPush: user.allowPush,
        allowSmsAlert: user.allowSmsAlert
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error updating profile' });
  }
});

// @route   PUT /api/users/password
// @desc    Change password
// @access  Private
router.put('/password', protect, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: 'Current and new passwords are required.' });
  }

  // SEC-015: Enforce strong password policy on change.
  if (!isStrongPassword(newPassword)) {
    return res.status(400).json({
      success: false,
      message: 'New password must be at least 8 characters and include an uppercase letter, a number, and a special character.'
    });
  }

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error updating password' });
  }
});

// @route   PUT /api/users/preferences
// @desc    Update notification preferences
// @access  Private
router.put('/preferences', protect, async (req, res) => {
  const { targetCharge, allowPush, allowSmsAlert } = req.body;

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (targetCharge !== undefined) {
      const tc = Number(targetCharge);
      if (tc < 50 || tc > 100) {
        return res.status(400).json({ success: false, message: 'Target charge limit must be between 50% and 100%.' });
      }
      user.targetCharge = tc;
    }

    if (allowPush !== undefined) user.allowPush = !!allowPush;
    if (allowSmsAlert !== undefined) user.allowSmsAlert = !!allowSmsAlert;

    await user.save();

    res.json({
      success: true,
      message: 'Preferences updated successfully',
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        evModel: user.evModel,
        role: user.role,
        points: user.points,
        tier: user.tier,
        profileImage: user.profileImage,
        targetCharge: user.targetCharge,
        allowPush: user.allowPush,
        allowSmsAlert: user.allowSmsAlert
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error updating preferences' });
  }
});

// @route   POST /api/users/profile-image
// @desc    Upload profile image (Base64)
// @access  Private
router.post('/profile-image', protect, async (req, res) => {
  const { image } = req.body;

  if (!image) {
    return res.status(400).json({ success: false, message: 'No image data provided.' });
  }

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // SEC-014: Decode Base64 and validate MIME type + magic bytes before writing to disk.
    const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    let imageBuffer;
    let mimeType = 'image/png';

    if (matches && matches.length === 3) {
      mimeType = matches[1].toLowerCase();
      imageBuffer = Buffer.from(matches[2], 'base64');
    } else {
      // Raw base64 without data-URI prefix — assume PNG.
      imageBuffer = Buffer.from(image, 'base64');
    }

    // SEC-014: Reject disallowed MIME types.
    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid file type. Only JPEG, PNG, GIF, and WebP images are accepted.`
      });
    }

    // SEC-014: Validate actual file content via magic bytes.
    if (!validateImageMagicBytes(imageBuffer, mimeType)) {
      return res.status(400).json({
        success: false,
        message: 'File content does not match declared image type. Upload rejected.'
      });
    }

    // Limit file size to 5MB.
    if (imageBuffer.length > 5 * 1024 * 1024) {
      return res.status(400).json({ success: false, message: 'Image size must be less than 5MB.' });
    }

    // SEC-014: Extension derived from whitelisted MIME map only — never from raw user input.
    const extension = MIME_TO_EXT[mimeType] || 'png';

    // Ensure upload directory exists.
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filename = `avatar-${user._id}-${Date.now()}.${extension}`;
    const filepath = path.join(uploadDir, filename);

    fs.writeFileSync(filepath, imageBuffer);

    const profileImageUrl = `/uploads/${filename}`;
    user.profileImage = profileImageUrl;
    await user.save();

    res.json({
      success: true,
      message: 'Profile image updated successfully',
      profileImage: profileImageUrl,
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        evModel: user.evModel,
        role: user.role,
        points: user.points,
        tier: user.tier,
        profileImage: user.profileImage,
        targetCharge: user.targetCharge,
        allowPush: user.allowPush,
        allowSmsAlert: user.allowSmsAlert
      }
    });
  } catch (err) {
    console.error('❌ [Profile Image Upload] Error:', err.message);
    res.status(500).json({ success: false, message: 'Server error uploading profile image.' });
  }
});

export default router;
