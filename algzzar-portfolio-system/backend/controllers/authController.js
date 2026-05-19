const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');
const { createError } = require('../utils/errorHandler');
const { sendTokenCookie, clearTokenCookie } = require('../utils/tokenUtils');

// @desc    Register admin (first-time setup only)
// @route   POST /api/auth/register
// @access  Public (but protected by SETUP_KEY env var)
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, setupKey } = req.body;

    if (setupKey !== process.env.ADMIN_SETUP_KEY) {
      return next(createError(403, 'Invalid setup key'));
    }

    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return next(createError(409, 'Admin already registered'));
    }

    const admin = await Admin.create({ name, email, password });
    sendTokenCookie(res, admin._id);

    res.status(201).json({
      success: true,
      message: 'Admin registered successfully',
      data: { id: admin._id, name: admin.name, email: admin.email },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Login admin
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(createError(400, 'Please provide email and password'));
    }

    const admin = await Admin.findOne({ email }).select('+password');
    if (!admin) {
      return next(createError(401, 'Invalid credentials'));
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return next(createError(401, 'Invalid credentials'));
    }

    // Update last login
    admin.lastLogin = Date.now();
    await admin.save({ validateBeforeSave: false });

    sendTokenCookie(res, admin._id);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        avatar: admin.avatar,
        lastLogin: admin.lastLogin,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Logout admin
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res, next) => {
  try {
    clearTokenCookie(res);
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
};

// @desc    Get current admin profile
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const admin = await Admin.findById(req.admin.id);
    res.status(200).json({ success: true, data: admin });
  } catch (err) {
    next(err);
  }
};

// @desc    Update admin profile
// @route   PUT /api/auth/me
// @access  Private
exports.updateMe = async (req, res, next) => {
  try {
    const { name, email, currentPassword, newPassword } = req.body;
    const admin = await Admin.findById(req.admin.id).select('+password');

    if (newPassword) {
      if (!currentPassword) {
        return next(createError(400, 'Please provide your current password'));
      }
      const isMatch = await admin.comparePassword(currentPassword);
      if (!isMatch) {
        return next(createError(401, 'Current password is incorrect'));
      }
      admin.password = newPassword;
    }

    if (name) admin.name = name;
    if (email) admin.email = email;

    await admin.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: { id: admin._id, name: admin.name, email: admin.email },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Refresh JWT token
// @route   GET /api/auth/refresh
// @access  Private
exports.refreshToken = async (req, res, next) => {
  try {
    sendTokenCookie(res, req.admin.id);
    res.status(200).json({ success: true, message: 'Token refreshed' });
  } catch (err) {
    next(err);
  }
};
