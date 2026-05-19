const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const config = require('../config/config');
const { AppError } = require('../utils/helpers');

// Ensure upload dirs exist
const uploadDirs = ['projects', 'avatars', 'resumes'].map((dir) => {
  const p = path.join(config.upload.uploadDir, dir);
  fs.mkdirSync(p, { recursive: true });
  return p;
});

const storageFor = (subfolder) =>
  multer.diskStorage({
    destination: (req, file, cb) => {
      const dest = path.join(config.upload.uploadDir, subfolder);
      cb(null, dest);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${subfolder}-${uuidv4()}${ext}`);
    },
  });

const imageFilter = (req, file, cb) => {
  if (config.upload.allowedImageTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Only image files (JPEG, PNG, WebP, GIF) are allowed', 400), false);
  }
};

const docFilter = (req, file, cb) => {
  if (config.upload.allowedDocTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Only PDF files are allowed', 400), false);
  }
};

const limits = { fileSize: config.upload.maxFileSize };

// Project images (single or multiple)
const uploadProjectImages = multer({
  storage: storageFor('projects'),
  fileFilter: imageFilter,
  limits,
});

// Admin avatar
const uploadAvatar = multer({
  storage: storageFor('avatars'),
  fileFilter: imageFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB for avatars
});

// Resume / CV
const uploadResume = multer({
  storage: storageFor('resumes'),
  fileFilter: docFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// Delete a file from disk
const deleteFile = (filePath) => {
  const fullPath = path.resolve(filePath);
  fs.unlink(fullPath, (err) => {
    if (err && err.code !== 'ENOENT') {
      console.error(`Failed to delete file: ${fullPath}`, err);
    }
  });
};

module.exports = { uploadProjectImages, uploadAvatar, uploadResume, deleteFile };
