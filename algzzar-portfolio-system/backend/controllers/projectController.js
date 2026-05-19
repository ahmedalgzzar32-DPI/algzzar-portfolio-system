const Project = require('../models/Project');
const { createError } = require('../utils/errorHandler');
const { deleteFile } = require('../utils/fileUtils');

// @desc    Get all projects (public - only published)
// @route   GET /api/projects
// @access  Public
exports.getProjects = async (req, res, next) => {
  try {
    const { category, featured, limit = 20, page = 1, sort = '-createdAt' } = req.query;

    const query = { status: 'published' };
    if (category) query.category = category;
    if (featured === 'true') query.featured = true;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [projects, total] = await Promise.all([
      Project.find(query)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .select('-__v'),
      Project.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      count: projects.length,
      total,
      pages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      data: projects,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single project by slug (public)
// @route   GET /api/projects/:slug
// @access  Public
exports.getProjectBySlug = async (req, res, next) => {
  try {
    const project = await Project.findOne({
      slug: req.params.slug,
      status: 'published',
    });

    if (!project) {
      return next(createError(404, 'Project not found'));
    }

    // Increment views
    project.views = (project.views || 0) + 1;
    await project.save({ validateBeforeSave: false });

    res.status(200).json({ success: true, data: project });
  } catch (err) {
    next(err);
  }
};

// ─── ADMIN ROUTES ──────────────────────────────────────────────────────────────

// @desc    Get ALL projects (admin - all statuses)
// @route   GET /api/admin/projects
// @access  Private
exports.adminGetProjects = async (req, res, next) => {
  try {
    const { status, category, search, limit = 20, page = 1 } = req.query;

    const query = {};
    if (status) query.status = status;
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [projects, total] = await Promise.all([
      Project.find(query)
        .sort('-createdAt')
        .skip(skip)
        .limit(parseInt(limit))
        .select('-__v'),
      Project.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      count: projects.length,
      total,
      pages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      data: projects,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single project (admin - any status)
// @route   GET /api/admin/projects/:id
// @access  Private
exports.adminGetProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return next(createError(404, 'Project not found'));
    res.status(200).json({ success: true, data: project });
  } catch (err) {
    next(err);
  }
};

// @desc    Create project
// @route   POST /api/admin/projects
// @access  Private
exports.createProject = async (req, res, next) => {
  try {
    const projectData = { ...req.body };

    // Handle uploaded thumbnail
    if (req.file) {
      projectData.thumbnail = `/uploads/${req.file.filename}`;
    }

    // Parse arrays/objects if sent as JSON strings (from FormData)
    ['tags', 'techStack', 'images', 'links'].forEach((field) => {
      if (typeof projectData[field] === 'string') {
        try {
          projectData[field] = JSON.parse(projectData[field]);
        } catch (_) {}
      }
    });

    const project = await Project.create(projectData);

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: project,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update project
// @route   PUT /api/admin/projects/:id
// @access  Private
exports.updateProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return next(createError(404, 'Project not found'));

    const updates = { ...req.body };

    if (req.file) {
      // Delete old thumbnail if it's a local upload
      if (project.thumbnail && project.thumbnail.startsWith('/uploads/')) {
        deleteFile(project.thumbnail);
      }
      updates.thumbnail = `/uploads/${req.file.filename}`;
    }

    ['tags', 'techStack', 'images', 'links'].forEach((field) => {
      if (typeof updates[field] === 'string') {
        try {
          updates[field] = JSON.parse(updates[field]);
        } catch (_) {}
      }
    });

    const updated = await Project.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: 'Project updated successfully',
      data: updated,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete project
// @route   DELETE /api/admin/projects/:id
// @access  Private
exports.deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return next(createError(404, 'Project not found'));

    // Cleanup files
    if (project.thumbnail && project.thumbnail.startsWith('/uploads/')) {
      deleteFile(project.thumbnail);
    }
    if (project.images?.length) {
      project.images.forEach((img) => {
        if (img.startsWith('/uploads/')) deleteFile(img);
      });
    }

    await project.deleteOne();

    res.status(200).json({ success: true, message: 'Project deleted successfully' });
  } catch (err) {
    next(err);
  }
};

// @desc    Toggle featured status
// @route   PATCH /api/admin/projects/:id/featured
// @access  Private
exports.toggleFeatured = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return next(createError(404, 'Project not found'));

    project.featured = !project.featured;
    await project.save();

    res.status(200).json({
      success: true,
      message: `Project ${project.featured ? 'featured' : 'unfeatured'}`,
      data: { featured: project.featured },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update project status
// @route   PATCH /api/admin/projects/:id/status
// @access  Private
exports.updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['published', 'draft', 'archived'].includes(status)) {
      return next(createError(400, 'Invalid status value'));
    }

    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!project) return next(createError(404, 'Project not found'));

    res.status(200).json({
      success: true,
      message: `Project status updated to ${status}`,
      data: { status: project.status },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get project categories + stats
// @route   GET /api/admin/projects/stats
// @access  Private
exports.getProjectStats = async (req, res, next) => {
  try {
    const stats = await Project.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalViews: { $sum: '$views' },
        },
      },
    ]);

    const categoryStats = await Project.aggregate([
      { $match: { status: 'published' } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    res.status(200).json({
      success: true,
      data: { statusStats: stats, categoryStats },
    });
  } catch (err) {
    next(err);
  }
};
