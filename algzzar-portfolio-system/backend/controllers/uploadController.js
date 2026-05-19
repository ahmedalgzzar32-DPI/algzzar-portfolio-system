const path = require('path');
const fs = require('fs');
const { createError } = require('../utils/errorHandler');

// @desc    Upload single image
// @route   POST /api/admin/upload/image
// @access  Private
exports.uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(createError(400, 'No image file provided'));
    }

    const fileUrl = `/uploads/${req.file.filename}`;

    res.status(200).json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        url: fileUrl,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Upload multiple images
// @route   POST /api/admin/upload/images
// @access  Private
exports.uploadImages = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return next(createError(400, 'No image files provided'));
    }

    const files = req.files.map((file) => ({
      url: `/uploads/${file.filename}`,
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
    }));

    res.status(200).json({
      success: true,
      message: `${files.length} image(s) uploaded successfully`,
      data: files,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Upload resume/document
// @route   POST /api/admin/upload/document
// @access  Private
exports.uploadDocument = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(createError(400, 'No document file provided'));
    }

    const fileUrl = `/uploads/${req.file.filename}`;

    res.status(200).json({
      success: true,
      message: 'Document uploaded successfully',
      data: {
        url: fileUrl,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete uploaded file
// @route   DELETE /api/admin/upload/:filename
// @access  Private
exports.deleteUpload = async (req, res, next) => {
  try {
    const { filename } = req.params;

    // Prevent directory traversal
    if (filename.includes('..') || filename.includes('/')) {
      return next(createError(400, 'Invalid filename'));
    }

    const filePath = path.join(process.cwd(), 'uploads', filename);

    if (!fs.existsSync(filePath)) {
      return next(createError(404, 'File not found'));
    }

    fs.unlinkSync(filePath);

    res.status(200).json({ success: true, message: 'File deleted successfully' });
  } catch (err) {
    next(err);
  }
};

// @desc    List all uploaded files
// @route   GET /api/admin/upload/list
// @access  Private
exports.listUploads = async (req, res, next) => {
  try {
    const uploadsDir = path.join(process.cwd(), 'uploads');

    if (!fs.existsSync(uploadsDir)) {
      return res.status(200).json({ success: true, data: [] });
    }

    const files = fs.readdirSync(uploadsDir).map((filename) => {
      const filePath = path.join(uploadsDir, filename);
      const stats = fs.statSync(filePath);
      const ext = path.extname(filename).toLowerCase();
      const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif'];

      return {
        filename,
        url: `/uploads/${filename}`,
        size: stats.size,
        isImage: imageExts.includes(ext),
        createdAt: stats.birthtime,
      };
    });

    // Sort newest first
    files.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.status(200).json({ success: true, count: files.length, data: files });
  } catch (err) {
    next(err);
  }
};
