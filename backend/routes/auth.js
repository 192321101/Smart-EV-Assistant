import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = express.Router();

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'supersecretjwtkeyforevassistant123!', {
    expiresIn: '30d'
  });
};

// @route   POST /api/auth/register
// @desc    Register a new driver user
router.post('/register', async (req, res) => {
  const { name, email, password, phone, evModel, role } = req.body;

  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists with this email' });
    }

    // Validate role input, fallback to 'driver'
    const validRoles = ['driver', 'admin', 'station_operator'];
    const finalRole = (role && validRoles.includes(role.toLowerCase())) ? role.toLowerCase() : 'driver';

    // Generate a default OTP for email verification (for prototype demo, default to '123456')
    const otp = '123456';
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    const user = await User.create({
      name,
      email,
      password,
      phone,
      evModel: finalRole === 'driver' ? evModel : undefined,
      role: finalRole,
      points: 100, // Gift 100 initial carbon points
      tier: 'bronze',
      otp,
      otpExpires
    });

    console.log(`✉️ [OTP Simulator] Verification OTP for ${email}: ${otp}`);

    const token = generateToken(user._id);

    // Return accessToken and user matching frontend AuthContext expectation
    res.status(201).json({
      success: true,
      message: 'Registration successful! Verification OTP sent.',
      accessToken: token,
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        evModel: user.evModel,
        role: user.role,
        points: user.points,
        tier: user.tier
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error during registration' });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user and get token
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      accessToken: token,
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        evModel: user.evModel,
        role: user.role,
        points: user.points,
        tier: user.tier
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
});

// @route   POST /api/auth/verify-otp
// @desc    Verify OTP for account activation / validation
router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.otp !== otp || user.otpExpires < Date.now()) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP code' });
    }

    // Clear OTP details upon verification
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    const token = generateToken(user._id);

    res.json({
      success: true,
      accessToken: token,
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        evModel: user.evModel,
        role: user.role,
        points: user.points,
        tier: user.tier
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error during OTP verification' });
  }
});

// @route   POST /api/auth/forgot-password
// @desc    Send OTP to reset password
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ success: false, message: 'Email not found in system' });
    }

    const resetOtp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = resetOtp;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry
    await user.save();

    console.log(`✉️ [OTP Simulator] Password Reset OTP for ${email}: ${resetOtp}`);

    res.json({
      success: true,
      message: 'Password reset OTP has been simulated and printed to server logs.'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error during forgot password flow' });
  }
});

// @route   POST /api/auth/reset-password
// @desc    Reset password using OTP validation
router.post('/reset-password', async (req, res) => {
  const { email, otp, newPassword } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.otp !== otp || user.otpExpires < Date.now()) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP code' });
    }

    // Set new password (will be hashed by pre-save middleware)
    user.password = newPassword;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Password has been reset successfully'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error during password reset' });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user session
router.post('/logout', (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

export default router;
