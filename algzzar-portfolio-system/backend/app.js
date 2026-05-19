'use strict';
/**
 * app.js — Express application factory
 * Algzzar Portfolio System · Production-Ready
 */

const express        = require('express');
const helmet         = require('helmet');
const cors           = require('cors');
const compression    = require('compression');
const morgan         = require('morgan');
const cookieParser   = require('cookie-parser');
const mongoSanitize  = require('express-mongo-sanitize');
const rateLimit      = require('express-rate-limit');
const path           = require('path');

const config                   = require('./config/config');
const { logger, morganStream } = require('./utils/logger');
const errorHandler             = require('./middleware/errorHandler');
const { notFound }             = require('./middleware/errorHandler');
const { apiLimiter }           = require('./middleware/rateLimiter');

// ── Route Modules ────────────────────────────────────────────
const authRoutes      = require('./routes/auth.routes');
const adminRoutes     = require('./routes/admin.routes');
const portfolioRoutes = require('./routes/portfolio.routes');
const projectRoutes   = require('./routes/projects');
const messageRoutes   = require('./routes/messages');
const categoryRoutes  = require('./routes/categories');

// ── App Init ─────────────────────────────────────────────────
const app = express();

// ── Trust Proxy (for accurate IP behind Nginx/load balancer)
app.set('trust proxy', 1);

// ── Security: Helmet ─────────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy:  { policy: 'cross-origin' },
    crossOriginEmbedderPolicy:  false,
    contentSecurityPolicy: config.isProd
      ? {
          directives: {
            defaultSrc:  ["'self'"],
            scriptSrc:   ["'self'", 'https://res.cloudinary.com'],
            styleSrc:    ["'self'", "'unsafe-inline'"],
            imgSrc:      ["'self'", 'data:', 'https://res.cloudinary.com'],
            connectSrc:  ["'self'"],
            fontSrc:     ["'self'", 'https://fonts.googleapis.com'],
            objectSrc:   ["'none'"],
            upgradeInsecureRequests: [],
          },
        }
      : false,
  })
);

// ── CORS ─────────────────────────────────────────────────────
const corsOptions = {
  origin(origin, callback) {
    // Allow server-to-server or same-origin
    if (!origin) return callback(null, true);
    const allowed = config.cors.origin;
    if (allowed.includes('*') || allowed.includes(origin)) {
      return callback(null, true);
    }
    callback(new Error(`CORS: Origin "${origin}" not allowed`));
  },
  credentials:     true,
  methods:         ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders:  ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders:  ['X-Total-Count'],
  maxAge:          86_400, // 24 h pre-flight cache
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// ── Compression ───────────────────────────────────────────────
app.use(compression({ level: 6, threshold: 1024 }));

// ── HTTP Request Logging (Morgan → Winston) ───────────────────
const morganFormat = config.isProd
  ? ':remote-addr :method :url :status :res[content-length] - :response-time ms'
  : 'dev';
app.use(morgan(morganFormat, { stream: morganStream }));

// ── Body Parsing ─────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Cookie Parser ─────────────────────────────────────────────
app.use(cookieParser(process.env.COOKIE_SECRET || process.env.JWT_SECRET));

// ── MongoDB Query Sanitization (NoSQL injection protection) ───
app.use(mongoSanitize());

// ── Static Files ─────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  maxAge: config.isProd ? '7d' : 0,
  etag:   true,
}));

// ── Global API Rate Limiter ───────────────────────────────────
app.use('/api/', apiLimiter);

// ── Health Check ─────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.status(200).json({
    status:    'ok',
    timestamp: new Date().toISOString(),
    env:       config.env,
    uptime:    Math.floor(process.uptime()),
  });
});

// ── API Routes ────────────────────────────────────────────────
app.use('/api/auth',      authRoutes);
app.use('/api/admin',     adminRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/projects',  projectRoutes);
app.use('/api/messages',  messageRoutes);
app.use('/api/categories',categoryRoutes);

// ── 404 Handler ───────────────────────────────────────────────
app.use(notFound);

// ── Global Error Handler ─────────────────────────────────────
app.use(errorHandler);

module.exports = app;
