'use strict';
/**
 * middleware/errorHandler.js
 * Centralised Express error handler — never leaks internals in production.
 */

const { logger } = require('../utils/logger');

// ══════════════════════════════════════════════════════════════
// CUSTOM ERROR CLASS
// ══════════════════════════════════════════════════════════════
class AppError extends Error {
  constructor(message, statusCode, code = null) {
    super(message);
    this.statusCode    = statusCode;
    this.status        = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.code          = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// ══════════════════════════════════════════════════════════════
// ERROR TRANSLATORS
// ══════════════════════════════════════════════════════════════
const handleCastError        = (e) => new AppError(`Invalid ${e.path}: ${e.value}`, 400, 'INVALID_ID');
const handleDuplicateKey     = (e) => new AppError(`Duplicate value: "${Object.keys(e.keyValue)[0]}" already exists`, 409, 'DUPLICATE');
const handleValidationError  = (e) => new AppError(Object.values(e.errors).map(v => v.message).join('. '), 422, 'VALIDATION_ERROR');
const handleJWTError         = ()  => new AppError('Invalid token — please log in again', 401, 'INVALID_TOKEN');
const handleJWTExpiredError  = ()  => new AppError('Session expired — please log in again', 401, 'TOKEN_EXPIRED');

// ══════════════════════════════════════════════════════════════
// RESPONSE SERIALISERS
// ══════════════════════════════════════════════════════════════
const sendDevError = (err, res) => res.status(err.statusCode).json({
  status:  err.status,
  code:    err.code,
  message: err.message,
  stack:   err.stack,
});

const sendProdError = (err, res) => {
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status:  err.status,
      code:    err.code,
      message: err.message,
    });
  }
  logger.error(`💥 UNHANDLED: ${err.message}\n${err.stack}`);
  res.status(500).json({ status: 'error', code: 'INTERNAL_ERROR', message: 'Something went wrong.' });
};

// ══════════════════════════════════════════════════════════════
// GLOBAL HANDLER
// ══════════════════════════════════════════════════════════════
const errorHandler = (err, req, res, _next) => {
  err.statusCode = err.statusCode || 500;
  err.status     = err.status     || 'error';

  logger.error(`[${req.method}] ${req.originalUrl} → ${err.statusCode}: ${err.message}`);

  let e = Object.assign(Object.create(Object.getPrototypeOf(err)), err);
  e.message = err.message;

  if (e.name  === 'CastError')         e = handleCastError(e);
  if (e.code  === 11000)               e = handleDuplicateKey(e);
  if (e.name  === 'ValidationError')   e = handleValidationError(e);
  if (e.name  === 'JsonWebTokenError') e = handleJWTError();
  if (e.name  === 'TokenExpiredError') e = handleJWTExpiredError();

  return process.env.NODE_ENV === 'development' ? sendDevError(e, res) : sendProdError(e, res);
};

// 404 catcher — mount BEFORE errorHandler
const notFound = (req, _res, next) => {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404, 'NOT_FOUND'));
};

module.exports = errorHandler;
module.exports.AppError = AppError;
module.exports.notFound = notFound;
