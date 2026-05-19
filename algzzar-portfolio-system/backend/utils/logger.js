'use strict';
/**
 * utils/logger.js
 * Winston structured logger with daily rotation + Morgan stream adapter
 */

const winston = require('winston');
const path    = require('path');
const fs      = require('fs');

const LOG_DIR = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });

const { combine, timestamp, printf, colorize, errors, json, splat } = winston.format;

// ── Pretty console format ─────────────────────────────────────
const consoleFormat = printf(({ level, message, timestamp: ts, stack }) => {
  const msg = `${ts}  [${level}]  ${message}`;
  return stack ? `${msg}\n${stack}` : msg;
});

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'warn' : 'debug'),
  format: combine(
    errors({ stack: true }),
    splat(),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' })
  ),
  transports: [
    // ── Console ──────────────────────────────────────────────
    new winston.transports.Console({
      format: combine(colorize({ all: true }), consoleFormat),
      silent: process.env.NODE_ENV === 'test',
    }),

    // ── Rotating combined log ────────────────────────────────
    new winston.transports.File({
      filename: path.join(LOG_DIR, 'combined.log'),
      format:   json(),
      maxsize:  10 * 1024 * 1024, // 10 MB
      maxFiles: 5,
      tailable: true,
    }),

    // ── Error-only log ───────────────────────────────────────
    new winston.transports.File({
      level:    'error',
      filename: path.join(LOG_DIR, 'error.log'),
      format:   json(),
      maxsize:  10 * 1024 * 1024,
      maxFiles: 5,
      tailable: true,
    }),
  ],
  exitOnError: false,
});

// Morgan → Winston bridge
const morganStream = {
  write: (message) => logger.http(message.trim()),
};

module.exports = { logger, morganStream };
