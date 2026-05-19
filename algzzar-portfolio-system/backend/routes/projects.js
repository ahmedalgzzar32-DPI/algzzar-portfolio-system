const express = require('express');
const { body, validationResult } = require('express-validator');
const Project = require('../models/Project');
const { cloudinary, uploadProject } = require('../config/cloudinary');
const { protect } = require('../middleware/auth');

const router = express.Router();

// ─── PUBLIC ───────────────────────────────────────────────────────────────────

// GET /api/projects  — fetch all published projects
router.get('/', async (req, res) => {
  try {
    const { category, featured, limit, page = 1, sort = '-order' } = req.query;
    const filter = { isPublished: true };

    if (category) filter.category = category;
    if (featured === 'true') filter.isFeatured = true;

    const lim = parseInt(limit) || 50;
    const skip = (parseInt(page) - 1) * lim;

    const [projects, total] = await Promise.all([
      Project.find(filter)
        .populate('category', 'name slug icon')
        .sort(sort)
        .skip(skip)
        .limit(lim)
        .lean(),
      Project.countDocuments(filter),
    ]);

    res.json({ success: true, total, page: parseInt(page), data: projects });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/projects/:id  — single project (also increments views)
router.get('/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate('category', 'name slug icon');
    if (!project || !project.isPublished) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    await project.incrementViews();
    res.json({ success: true, data: project });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── ADMIN ────────────────────────────────────────────────────────────────────

// POST /api/projects  — create project (with optional cover image)
router.post(
  '/',
  protect,
  uploadProject.single('coverImage'),
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('category').notEmpty().withMessage('Category is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    try {
      const data = { ...req.body };

      if (req.file) {
        data.coverImage = { url: req.file.path, publicId: req.file.filename };
      }

      // Parse arrays if sent as JSON strings
      if (typeof data.tags === 'string') data.tags = JSON.parse(data.tags);
      if (typeof data.tools === 'string') data.tools = JSON.parse(data.tools);

      const project = await Project.create(data);
      const populated = await project.populate('category', 'name slug icon');

      res.status(201).json({ success: true, data: populated });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

// PUT /api/projects/:id  — edit project
router.put(
  '/:id',
  protect,
  uploadProject.single('coverImage'),
  async (req, res) => {
    try {
      const project = await Project.findById(req.params.id);
      if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

      const data = { ...req.body };
      if (typeof data.tags === 'string') data.tags = JSON.parse(data.tags);
      if (typeof data.tools === 'string') data.tools = JSON.parse(data.tools);

      // Handle new cover image
      if (req.file) {
        // Delete old image from Cloudinary
        if (project.coverImage?.publicId) {
          await cloudinary.uploader.destroy(project.coverImage.publicId).catch(() => {});
        }
        data.coverImage = { url: req.file.path, publicId: req.file.filename };
      }

      const updated = await Project.findByIdAndUpdate(req.params.id, data, {
        new: true,
        runValidators: true,
      }).populate('category', 'name slug icon');

      res.json({ success: true, data: updated });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

// DELETE /api/projects/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    // Delete images from Cloudinary
    const deleteJobs = [];
    if (project.coverImage?.publicId) {
      deleteJobs.push(cloudinary.uploader.destroy(project.coverImage.publicId));
    }
    project.images.forEach((img) => {
      if (img.publicId) deleteJobs.push(cloudinary.uploader.destroy(img.publicId));
    });
    await Promise.allSettled(deleteJobs);

    await project.deleteOne();

    res.json({ success: true, message: 'Project deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/projects/:id/images  — add extra images to a project
router.post('/:id/images', protect, uploadProject.array('images', 10), async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    const newImages = req.files.map((f) => ({ url: f.path, publicId: f.filename }));
    project.images.push(...newImages);
    await project.save();

    res.json({ success: true, data: project });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/projects/admin/all  — admin: see all projects including unpublished
router.get('/admin/all', protect, async (req, res) => {
  try {
    const projects = await Project.find({})
      .populate('category', 'name slug icon')
      .sort('-createdAt');
    res.json({ success: true, data: projects });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
