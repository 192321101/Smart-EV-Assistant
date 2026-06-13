import express from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import { blockToken } from '../middleware/tokenBlocklist.js';

const router = express.Router();

// SEC-015: Password strength validator — min 8 chars, 1 upper, 1 digit, 1 special char.
const isStrongPassword = (pwd) => {
  return (
    typeof pwd === 'string' &&
    pwd.length >= 8 &&
    /[A-Z]/.test(pwd) &&
    /[0-9]/.test(pwd) &&
    /[^A-Za-z0-9]/.test(pwd)
  );
};

// SEC-001: No hardcoded fallback. JWT_SECRET must be set (enforced at startup in auth middleware).
// SEC-006: Reduced from 30d to 7d to limit the attack window.
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '7d'
  });
};

// @route   POST /api/auth/register
// @desc    Register a new driver user
router.post('/register', async (req, res) => {
  // SEC-003: `role` is intentionally excluded — all self-registrations are drivers.
  const { name, email, password, phone, evModel } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
  }

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists with this email' });
    }

    // SEC-004: Generate a cryptographically random 6-digit OTP.
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    // SEC-003: Role is always 'driver' — never read from client input.
    const user = await User.create({
      name,
      email,
      password,
      phone,
      evModel,
      role: 'driver',
      points: 100,
      tier: 'bronze',
      otp,
      otpExpires
    });

    // SEC-007: OTP is NOT logged. In production, send via email/SMS service.
    console.log(`✉️ [OTP Simulator] Verification OTP dispatched for new account registration.`);

    const token = generateToken(user._id);

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
    console.error('[Register] Server error during registration');
    res.status(500).json({ success: false, message: 'Server error during registration' });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user and get token
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    console.log(`🔑 [Login Debug] Email: "${email}", Found User: ${user ? 'Yes' : 'No'}`);
    if (user) {
      const match = await user.comparePassword(password);
      console.log(`🔑 [Login Debug] Match result: ${match}, Entered pwd: "${password}", DB Hash: "${user.password}"`);
    }

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
    console.error('[Login] Server error during login');
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
    console.error('[Verify OTP] Server error during OTP verification');
    res.status(500).json({ success: false, message: 'Server error during OTP verification' });
  }
});

// @route   POST /api/auth/forgot-password
// @desc    Send OTP to reset password
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (user) {
      // SEC-004: Cryptographically random OTP.
      const resetOtp = crypto.randomInt(100000, 999999).toString();
      user.otp = resetOtp;
      user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
      await user.save();

      // SEC-007: OTP is NOT logged to the console. In production, send via email/SMS.
      console.log(`✉️ [OTP Simulator] Password reset OTP dispatched.`);
    }

    // SEC-024: Always return 200 regardless of whether the email exists (prevents user enumeration).
    res.json({
      success: true,
      message: 'If that email is registered, a password reset OTP has been sent.'
    });
  } catch (err) {
    console.error('[Forgot Password] Server error');
    res.status(500).json({ success: false, message: 'Server error during forgot password flow' });
  }
});

// @route   POST /api/auth/reset-password
// @desc    Reset password using OTP validation
router.post('/reset-password', async (req, res) => {
  const { email, otp, newPassword } = req.body;

  // SEC-015: Enforce password strength on reset.
  if (!isStrongPassword(newPassword)) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 8 characters and include an uppercase letter, a number, and a special character.'
    });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.otp !== otp || user.otpExpires < Date.now()) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP code' });
    }

    user.password = newPassword;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.json({ success: true, message: 'Password has been reset successfully' });
  } catch (err) {
    console.error('[Reset Password] Server error');
    res.status(500).json({ success: false, message: 'Server error during password reset' });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user — revoke current JWT token
router.post('/logout', (req, res) => {
  // SEC-005: Add the token to the in-memory blocklist so it cannot be reused.
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    blockToken(token);
  }
  res.json({ success: true, message: 'Logged out successfully' });
});

export default router;
