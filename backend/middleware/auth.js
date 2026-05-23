const jwt = require('jsonwebtoken');
const User = require('../models/User');

const requireAuth = async (req, res, next) => {
  let token = req.cookies?.token;

  // Check for token in headers if cookie is missing
  if (
    !token &&
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, error: 'Not authorized, token missing' });
  }

  try {
    // Decode token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key');

    // Get user from token (exclude password)
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Not authorized, user not found' });
    }

    next();
  } catch (error) {
    console.error('JWT authorization error:', error.message);
    return res.status(401).json({ success: false, error: 'Not authorized, token verification failed' });
  }
};

module.exports = { requireAuth };
