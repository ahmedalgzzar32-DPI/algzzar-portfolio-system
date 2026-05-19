'use strict';
/**
 * server.js — HTTP Server Entry Point
 * Algzzar Portfolio System · Production-Ready
 *
 * Boot order:
 *   1. Load environment variables
 *   2. Validate config
 *   3. Connect to MongoDB
 *   4. Start HTTP server
 *   5. Register graceful-shutdown handlers
 */

// ── 1. Environment ────────────────────────────────────────────
require('dotenv').config();

// ── 2. Internal Imports (after env is loaded) ─────────────────
const http         = require('http');
const app          = require('./app');
const connectDB    = require('./config/database');
const { logger }   = require('./utils/logger');
const config       = require('./config/config');

// ── Unhandled Rejection / Exception Guards ────────────────────
process.on('uncaughtException', (err) => {
  logger.error(`💥 UNCAUGHT EXCEPTION: ${err.message}\n${err.stack}`);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  const msg = reason instanceof Error ? reason.stack : String(reason);
  logger.error(`💥 UNHANDLED REJECTION: ${msg}`);
  // Give the server a chance to finish in-flight requests
  shutdown(1);
});

// ── Server ────────────────────────────────────────────────────
const PORT   = config.port;
const server = http.createServer(app);

// Keep-alive tuning for production
server.keepAliveTimeout    = 65_000; // > typical LB idle timeout
server.headersTimeout      = 66_000;

// ── Graceful Shutdown ─────────────────────────────────────────
let isShuttingDown = false;

async function shutdown(code = 0, signal = 'SIGTERM') {
  if (isShuttingDown) return;
  isShuttingDown = true;

  logger.warn(`\n⚠️  ${signal} received — graceful shutdown started...`);

  // Stop accepting new connections
  server.close(async () => {
    logger.info('HTTP server closed');

    try {
      const mongoose = require('mongoose');
      await mongoose.connection.close(false);
      logger.info('MongoDB connection closed');
    } catch (err) {
      logger.error(`Error closing MongoDB: ${err.message}`);
    }

    logger.info('✅ Shutdown complete');
    process.exit(code);
  });

  // Force kill if shutdown takes too long
  setTimeout(() => {
    logger.error('⏱  Shutdown timeout — forcing exit');
    process.exit(1);
  }, 15_000).unref();
}

['SIGTERM', 'SIGINT', 'SIGHUP'].forEach((signal) => {
  process.on(signal, () => shutdown(0, signal));
});

// ── Boot ──────────────────────────────────────────────────────
(async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Seed initial admin if needed
    await seedAdmin();

    // Start listening
    server.listen(PORT, () => {
      logger.info('═══════════════════════════════════════════════');
      logger.info(`🎬  ALGZZAR PORTFOLIO SYSTEM`);
      logger.info(`🚀  Server    : http://localhost:${PORT}`);
      logger.info(`🌍  Env       : ${config.env}`);
      logger.info(`🏥  Health    : http://localhost:${PORT}/health`);
      logger.info(`📡  API Base  : http://localhost:${PORT}/api`);
      logger.info('═══════════════════════════════════════════════');
    });

  } catch (err) {
    logger.error(`Failed to boot: ${err.message}\n${err.stack}`);
    process.exit(1);
  }
})();

// ── Admin Seed ────────────────────────────────────────────────
async function seedAdmin() {
  if (!config.admin.email || !config.admin.defaultPassword) return;

  try {
    const User = require('./models/User');
    const bcrypt = require('bcryptjs');
    const existing = await User.findOne({ email: config.admin.email });

    if (!existing) {
      const hashed = await bcrypt.hash(config.admin.defaultPassword, 12);
      await User.create({
        name:     'Ahmed Algzzar',
        email:    config.admin.email,
        password: hashed,
        role:     'admin',
      });
      logger.info(`✅ Admin account seeded: ${config.admin.email}`);
    }
  } catch (err) {
    logger.warn(`Admin seed skipped: ${err.message}`);
  }
}

module.exports = server; // expose for testing
