import User from '../models/User.js';

export const adminProtect = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (user && user.role === 'admin') {
      req.adminUser = user;
      next();
    } else {
      res.status(403).json({ success: false, message: 'Access denied: Requires administrator privilege' });
    }
  } catch (err) {
    console.error('❌ [Admin Auth Middleware] Access control error:', err.message);
    res.status(500).json({ success: false, message: 'Server error during admin authorization' });
  }
};
