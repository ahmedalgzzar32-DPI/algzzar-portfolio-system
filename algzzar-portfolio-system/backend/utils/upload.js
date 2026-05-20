'use strict';
/**
 * utils/upload.js — Shared Multer Upload Configuration
 * Algzzar Portfolio System · Production-Ready
 *
 * CRITICAL FIXES APPLIED:
 *   1. File location: moved from uploads/upload.js → utils/upload.js
 *      (routes require '../utils/upload' — the old path never resolved)
 *   2. /admin/about now uses uploadAboutFields (.fields()) so avatar + resume
 *      are parsed in a single multipart pass. Two chained multer instances
 *      on one route consume the stream twice and silently drop the 2nd file.
 *   3. deleteFile resolves against an absolute UPLOAD_ROOT so files are
 *      actually removed from disk (old code: path.join('public', img) always
 *      pointed nowhere).
 */

const multer = require('multer');
const path   = require('path');
const fs     = require('fs');
const { v4: uuidv4 } = require('uuid');
const config = require('../config/config');
const { AppError } = require('./helpers');

// ── Upload directory root (absolute) ─────────────────────────────────────────
// config.upload.uploadDir may be a relative string like 'uploads'.
// Resolve it once against the backend root so every path is absolute
// regardless of the cwd when the process starts.
const UPLOAD_ROOT = path.resolve(__dirname, '..', config.upload.uploadDir);

// Ensure required subdirectories exist at startup
['projects', 'avatars', 'resumes'].forEach((sub) => {
  fs.mkdirSync(path.join(UPLOAD_ROOT, sub), { recursive: true });
});

// ── Storage factory ───────────────────────────────────────────────────────────
const storageFor = (subfolder) =>
  multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, path.join(UPLOAD_ROOT, subfolder));
    },
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${subfolder}-${uuidv4()}${ext}`);
    },
  });

// ── File filters ──────────────────────────────────────────────────────────────
const imageFilter = (_req, file, cb) => {
  if (config.upload.allowedImageTypes.includes(file.mimetype)) {
    return cb(null, true);
  }
  cb(new AppError('Only image files (JPEG, PNG, WebP, GIF) are allowed', 400), false);
};

const docFilter = (_req, file, cb) => {
  if (config.upload.allowedDocTypes.includes(file.mimetype)) {
    return cb(null, true);
  }
  cb(new AppError('Only PDF files are allowed for resume upload', 400), false);
};

// Combined filter: routes each field to the correct type validator
const aboutFilter = (req, file, cb) => {
  if (file.fieldname === 'avatar') return imageFilter(req, file, cb);
  if (file.fieldname === 'resume') return docFilter(req, file, cb);
  cb(new AppError(`Unexpected upload field: ${file.fieldname}`, 400), false);
};

// ── Uploader instances ────────────────────────────────────────────────────────

/** Project images — stored in /uploads/projects/ */
const uploadProjectImages = multer({
  storage: storageFor('projects'),
  fileFilter: imageFilter,
  limits: { fileSize: config.upload.maxFileSize },
});

/** Single admin avatar — stored in /uploads/avatars/, 2 MB cap */
const uploadAvatar = multer({
  storage: storageFor('avatars'),
  fileFilter: imageFilter,
  limits: { fileSize: 2 * 1024 * 1024 },
});

/** Single resume/CV — stored in /uploads/resumes/, 5 MB cap */
const uploadResume = multer({
  storage: storageFor('resumes'),
  fileFilter: docFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

/**
 * CRITICAL FIX — /admin/about combined uploader.
 *
 * Uses a single multer instance with .fields() so both the avatar (image)
 * and resume (PDF) are parsed from the same multipart body in one pass.
 *
 * Using two separate middleware (uploadAvatar.single() + uploadResume.single())
 * on the same route is broken: multer reads and destroys the request stream on
 * the first call; the second middleware receives an empty/ended stream and
 * either silently ignores the second file or throws a stream error.
 *
 * The destination callback routes each field to its own subdirectory:
 *   avatar → /uploads/avatars/
 *   resume → /uploads/resumes/
 */
const uploadAboutFields = multer({
  storage: multer.diskStorage({
    destination: (_req, file, cb) => {
      const sub = file.fieldname === 'resume' ? 'resumes' : 'avatars';
      cb(null, path.join(UPLOAD_ROOT, sub));
    },
    filename: (_req, file, cb) => {
      const sub = file.fieldname === 'resume' ? 'resumes' : 'avatars';
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${sub}-${uuidv4()}${ext}`);
    },
  }),
  fileFilter: aboutFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
}).fields([
  { name: 'avatar', maxCount: 1 },
  { name: 'resume', maxCount: 1 },
]);

// ── Safe file deletion ────────────────────────────────────────────────────────
/**
 * CRITICAL FIX — Delete an uploaded file from disk.
 *
 * Previous code: path.join('public', '/uploads/projects/x.jpg')
 *   → 'public//uploads/projects/x.jpg' (relative, never found)
 *
 * Fixed: strip the leading '/uploads/' URL prefix and resolve against
 * UPLOAD_ROOT so the absolute on-disk path is always correct:
 *   '/uploads/projects/projects-uuid.jpg'
 *   → <backend>/uploads/projects/projects-uuid.jpg  ✓
 *
 * Path-traversal guard: refuses to delete anything outside UPLOAD_ROOT.
 *
 * @param {string} fileUrl  URL stored in DB, e.g. '/uploads/projects/x.jpg'
 */
const deleteFile = (fileUrl) => {
  if (!fileUrl || typeof fileUrl !== 'string') return;

  // Remove the leading /uploads/ segment to get subfolder/filename
  const relative = fileUrl.replace(/^\/+uploads\/+/, '');
  if (!relative) return;

  const fullPath = path.resolve(UPLOAD_ROOT, relative);

  // Path-traversal guard: must stay inside UPLOAD_ROOT
  const rootWithSep = UPLOAD_ROOT + path.sep;
  if (!fullPath.startsWith(rootWithSep)) {
    console.error(`[deleteFile] Blocked path traversal attempt: ${fullPath}`);
    return;
  }

  fs.unlink(fullPath, (err) => {
    if (err && err.code !== 'ENOENT') {
      console.error(`[deleteFile] Failed to delete ${fullPath}:`, err.message);
    }
  });
};

module.exports = {
  uploadProjectImages,
  uploadAvatar,
  uploadResume,
  uploadAboutFields,
  deleteFile,
  UPLOAD_ROOT,
};
