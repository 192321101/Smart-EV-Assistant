import jwt from 'jsonwebtoken';

const protect = (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretjwtkeyforevassistant123!');
      
      req.user = decoded; // Contains id and other payload fields
      next();
    } catch (error) {
      console.error('❌ [Auth Middleware] Token verification failed:', error.message);
      res.status(401).json({ success: false, message: 'Unauthorized, token verification failed' });
    }
  } else {
    res.status(401).json({ success: false, message: 'No authorization token provided' });
  }
};

export default protect;
