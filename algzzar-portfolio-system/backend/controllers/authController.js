const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/User');
const config = require('../config/config');
const { asyncHandler, AppError, sendSuccess } = require('../utils/helpers');
const logger = require('../utils/logger');

// ── Token helpers ────────────────────────────────────────────

const signAccessToken = (id) =>
  jwt.sign({ id }, config.jwt.secret, { expiresIn: config.jwt.accessExpiry });

const signRefreshToken = (id) =>
  jwt.sign({ id }, config.jwt.refreshSecret, { expiresIn: config.jwt.refreshExpiry });

const cookieOptions = {
  httpOnly: true,
  secure: config.isProd,
  sameSite: config.isProd ? 'strict' : 'lax',
  path: '/',
};

const setTokenCookies = (res, accessToken, refreshToken) => {
  res.cookie('accessToken', accessToken, {
    ...cookieOptions,
    maxAge: 15 * 60 * 1000, // 15 min
  });
  res.cookie('refreshToken', refreshToken, {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

// ── Controllers ──────────────────────────────────────────────

exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return next(new AppError('Invalid email or password', 401));
  }

  const accessToken = signAccessToken(user._id);
  const refreshToken = signRefreshToken(user._id);

  // Store hashed refresh token
  const hashedRefresh = crypto.createHash('sha256').update(refreshToken).digest('hex');
  user.refreshTokens = user.refreshTokens || [];
  user.refreshTokens.push({ token: hashedRefresh, createdAt: new Date() });
  // Keep only last 5 sessions
  if (user.refreshTokens.length > 5) {
    user.refreshTokens = user.refreshTokens.slice(-5);
  }
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  setTokenCookies(res, accessToken, refreshToken);

  logger.info(`Admin login: ${user.email}`);

  sendSuccess(res, {
    accessToken,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
    },
  }, 'Login successful');
});

exports.refreshToken = asyncHandler(async (req, res, next) => {
  const token = req.cookies?.refreshToken || req.body?.refreshToken;

  if (!token) {
    return next(new AppError('Refresh token required', 401));
  }

  let decoded;
  try {
    decoded = jwt.verify(token, config.jwt.refreshSecret);
  } catch {
    return next(new AppError('Invalid or expired refresh token', 401));
  }

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({
    _id: decoded.id,
    'refreshTokens.token': hashedToken,
  });

  if (!user) {
    return next(new AppError('Refresh token revoked or not found', 401));
  }

  const newAccessToken = signAccessToken(user._id);
  const newRefreshToken = signRefreshToken(user._id);

  // Rotate: remove old, add new
  const newHashedRefresh = crypto.createHash('sha256').update(newRefreshToken).digest('hex');
  user.refreshTokens = user.refreshTokens.filter((t) => t.token !== hashedToken);
  user.refreshTokens.push({ token: newHashedRefresh, createdAt: new Date() });
  await user.save({ validateBeforeSave: false });

  setTokenCookies(res, newAccessToken, newRefreshToken);

  sendSuccess(res, { accessToken: newAccessToken }, 'Token refreshed');
});

exports.logout = asyncHandler(async (req, res, next) => {
  const token = req.cookies?.refreshToken || req.body?.refreshToken;

  if (token) {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    req.user.refreshTokens = (req.user.refreshTokens || []).filter(
      (t) => t.token !== hashedToken
    );
    await req.user.save({ validateBeforeSave: false });
  }

  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');

  sendSuccess(res, {}, 'Logged out successfully');
});

exports.getMe = asyncHandler(async (req, res) => {
  sendSuccess(res, { user: req.user });
});

exports.changePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+password');
  if (!(await bcrypt.compare(currentPassword, user.password))) {
    return next(new AppError('Current password is incorrect', 400));
  }

  user.password = await bcrypt.hash(newPassword, 12);
  user.passwordChangedAt = new Date();
  user.refreshTokens = []; // Invalidate all sessions
  await user.save({ validateBeforeSave: false });

  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');

  sendSuccess(res, {}, 'Password changed. Please log in again.');
});
