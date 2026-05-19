/**
 * Wraps async route handlers to catch errors and forward to Express error middleware.
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Operational error with HTTP status code.
 */
class AppError extends Error {
  constructor(message, statusCode = 500, errors = null) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    this.errors = errors;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Standard API response helpers.
 */
const sendSuccess = (res, data = {}, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    status: 'success',
    message,
    data,
  });
};

const sendError = (res, message = 'An error occurred', statusCode = 500, errors = null) => {
  const payload = { status: 'error', message };
  if (errors) payload.errors = errors;
  return res.status(statusCode).json(payload);
};

module.exports = { asyncHandler, AppError, sendSuccess, sendError };
