require('dotenv').config();

const required = [
  'MONGODB_URI',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
];

const missing = required.filter((key) => !process.env[key]);
if (missing.length > 0) {
  console.error(`❌ Missing required env vars: ${missing.join(', ')}`);
  process.exit(1);
}

module.exports = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 5000,

  db: {
    uri: process.env.MONGODB_URI,
  },

  jwt: {
    secret: process.env.JWT_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  },

  cors: {
    // IMPORTANT FIX: normalize origin into an array safely.
    // process.env values are always strings so .split() is safe here,
    // but we also trim whitespace from each entry and filter empty strings
    // to handle values like 'http://a.com, http://b.com' (space after comma).
    origin: (() => {
      const raw = process.env.CORS_ORIGIN;
      if (!raw) return ['http://localhost:3000', 'http://localhost:5173'];
      return raw.split(',').map((o) => o.trim()).filter(Boolean);
    })(),
  },

  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 10 * 1024 * 1024, // 10MB
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    allowedDocTypes: ['application/pdf'],
    uploadDir: process.env.UPLOAD_DIR || 'uploads',
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW, 10) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
    authMax: parseInt(process.env.AUTH_RATE_LIMIT_MAX, 10) || 10,
  },

  admin: {
    email: process.env.ADMIN_EMAIL,
    defaultPassword: process.env.ADMIN_DEFAULT_PASSWORD,
  },

  isProd: process.env.NODE_ENV === 'production',
  isDev: process.env.NODE_ENV === 'development',
};
