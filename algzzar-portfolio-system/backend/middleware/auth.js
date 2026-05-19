const jwt = require('jsonwebtoken');
const config = require('../config/config');
const { AppError, asyncHandler } = require('../utils/helpers');
// Import your User model — adjust path to match existing model
const User = require('../models/User');

/**
 * Verifies the access token from Authorization header or cookie.
 * Attaches req.user on success.
 */
const protect = asyncHandler(async (req, res, next) => {
  let token;

  // 1. Check Authorization header
  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }
  // 2. Fallback: httpOnly cookie
  else if (req.cookies?.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    return next(new AppError('Authentication required. Please log in.', 401));
  }

  let decoded;
  try {
    decoded = jwt.verify(token, config.jwt.secret);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(new AppError('Session expired. Please refresh your token.', 401));
    }
    return next(new AppError('Invalid token. Please log in again.', 401));
  }

  const user = await User.findById(decoded.id).select('-password -refreshTokens');
  if (!user) {
    return next(new AppError('User no longer exists.', 401));
  }

  if (user.passwordChangedAfter && user.passwordChangedAfter(decoded.iat)) {
    return next(new AppError('Password recently changed. Please log in again.', 401));
  }

  req.user = user;
  next();
});

/**
 * Restricts access to admin role only.
 * Must be used AFTER protect middleware.
 */
const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return next(new AppError('Access denied. Admin privileges required.', 403));
  }
  next();
};

/**
 * Optionally attach user if token present, but don't block if missing.
 */
const optionalAuth = asyncHandler(async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.accessToken) {
    token = req.cookies.accessToken;
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, config.jwt.secret);
      req.user = await User.findById(decoded.id).select('-password -refreshTokens');
    } catch {
      // Silent — just don't attach user
    }
  }
  next();
});

module.exports = { protect, adminOnly, optionalAuth };
