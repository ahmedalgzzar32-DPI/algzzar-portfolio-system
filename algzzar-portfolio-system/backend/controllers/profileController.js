const Profile = require('../models/Profile');
const { createError } = require('../utils/errorHandler');
const { deleteFile } = require('../utils/fileUtils');

// @desc    Get public profile
// @route   GET /api/profile
// @access  Public
exports.getProfile = async (req, res, next) => {
  try {
    let profile = await Profile.findOne().select('-__v');

    if (!profile) {
      return next(createError(404, 'Profile not found'));
    }

    res.status(200).json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
};

// @desc    Get profile for admin editing
// @route   GET /api/admin/profile
// @access  Private
exports.adminGetProfile = async (req, res, next) => {
  try {
    let profile = await Profile.findOne();

    if (!profile) {
      // Return empty template
      profile = {};
    }

    res.status(200).json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
};

// @desc    Create or update profile (upsert)
// @route   PUT /api/admin/profile
// @access  Private
exports.upsertProfile = async (req, res, next) => {
  try {
    const updates = { ...req.body };

    // Handle avatar upload
    if (req.file) {
      const existing = await Profile.findOne();
      if (existing?.avatar && existing.avatar.startsWith('/uploads/')) {
        deleteFile(existing.avatar);
      }
      updates.avatar = `/uploads/${req.file.filename}`;
    }

    // Parse JSON strings from FormData
    ['skills', 'socialLinks', 'experience', 'education', 'services'].forEach((field) => {
      if (typeof updates[field] === 'string') {
        try {
          updates[field] = JSON.parse(updates[field]);
        } catch (_) {}
      }
    });

    const profile = await Profile.findOneAndUpdate(
      {},
      { $set: updates },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: profile,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Upload resume PDF
// @route   POST /api/admin/profile/resume
// @access  Private
exports.uploadResume = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(createError(400, 'No file uploaded'));
    }

    const existing = await Profile.findOne();
    if (existing?.resume && existing.resume.startsWith('/uploads/')) {
      deleteFile(existing.resume);
    }

    const profile = await Profile.findOneAndUpdate(
      {},
      { $set: { resume: `/uploads/${req.file.filename}` } },
      { new: true, upsert: true }
    );

    res.status(200).json({
      success: true,
      message: 'Resume uploaded successfully',
      data: { resume: profile.resume },
    });
  } catch (err) {
    next(err);
  }
};
