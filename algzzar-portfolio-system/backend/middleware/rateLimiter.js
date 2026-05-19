const rateLimit = require('express-rate-limit');
const config = require('../config/config');

const createLimiter = (options) =>
  rateLimit({
    windowMs: config.rateLimit.windowMs,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        status: 'error',
        message: 'Too many requests. Please try again later.',
      });
    },
    ...options,
  });

// General API limiter
const apiLimiter = createLimiter({
  max: config.rateLimit.max,
  message: 'Too many API requests from this IP.',
});

// Strict limiter for auth endpoints
const authLimiter = createLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: config.rateLimit.authMax,
  skipSuccessfulRequests: true,
});

// Contact form limiter
const contactLimiter = createLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
});

module.exports = { apiLimiter, authLimiter, contactLimiter };
