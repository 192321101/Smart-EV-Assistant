import jwt from 'jsonwebtoken';
import { isTokenBlocked } from './tokenBlocklist.js';

// SEC-001: Fail fast at startup if JWT_SECRET is not configured.
if (!process.env.JWT_SECRET) {
  console.error('❌ [FATAL] JWT_SECRET environment variable is not set. Server cannot start securely.');
  process.exit(1);
}

const protect = (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];

      // SEC-005: Reject tokens that have been explicitly revoked (logged-out).
      if (isTokenBlocked(token)) {
        return res.status(401).json({ success: false, message: 'Token has been revoked. Please log in again.' });
      }

      // SEC-001: No fallback secret — use only the env variable.
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = decoded; // Contains id and other payload fields
      next();
    } catch (error) {
      return res.status(401).json({ success: false, message: 'Unauthorized, token verification failed' });
    }
  } else {
    res.status(401).json({ success: false, message: 'No authorization token provided' });
  }
};

export default protect;
