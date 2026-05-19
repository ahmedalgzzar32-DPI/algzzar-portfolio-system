const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const { createError } = require('../utils/errorHandler');

// ─── PROTECT MIDDLEWARE ────────────────────────────────────────────────────────
const protect = async (req, res, next) => {
  try {
    let token;

    // 1. Try cookie first
    if (req.cookies?.adminToken) {
      token = req.cookies.adminToken;
    }
    // 2. Fall back to Authorization header
    else if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(createError(401, 'Access denied. No token provided.'));
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check admin still exists
    const admin = await Admin.findById(decoded.id).select('-password');
    if (!admin) {
      return next(createError(401, 'Admin account no longer exists'));
    }

    // Attach admin to request
    req.admin = admin;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return next(createError(401, 'Invalid token'));
    }
    if (err.name === 'TokenExpiredError') {
      return next(createError(401, 'Token expired. Please log in again.'));
    }
    next(err);
  }
};

// ─── OPTIONAL AUTH (for public routes that benefit from knowing the admin) ────
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.cookies?.adminToken || 
      (req.headers.authorization?.startsWith('Bearer ') ? 
        req.headers.authorization.split(' ')[1] : null);

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.admin = await Admin.findById(decoded.id).select('-password');
    }
    next();
  } catch (_) {
    // Silently continue without auth
    next();
  }
};

module.exports = { protect, optionalAuth };
