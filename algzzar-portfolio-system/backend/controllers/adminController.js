const Project = require('../models/Project');
const About = require('../models/About');
const Skill = require('../models/Skill');
const Experience = require('../models/Experience');
const Message = require('../models/Message');
const User = require('../models/User');
const { asyncHandler, AppError, sendSuccess } = require('../utils/helpers');
const { deleteFile } = require('../utils/upload');
const slugify = require('slugify');
const path = require('path');

// ── Dashboard ────────────────────────────────────────────────

exports.getDashboardStats = asyncHandler(async (req, res) => {
  const [
    totalProjects,
    visibleProjects,
    totalMessages,
    unreadMessages,
    totalSkills,
  ] = await Promise.all([
    Project.countDocuments(),
    Project.countDocuments({ isVisible: true }),
    Message.countDocuments(),
    Message.countDocuments({ isRead: false }),
    Skill.countDocuments(),
  ]);

  const recentMessages = await Message.find()
    .sort({ createdAt: -1 })
    .limit(5)
    .select('name email subject isRead createdAt');

  const topProjects = await Project.find({ isVisible: true })
    .sort({ views: -1 })
    .limit(5)
    .select('title slug views thumbnailImage');

  sendSuccess(res, {
    stats: {
      totalProjects,
      visibleProjects,
      totalMessages,
      unreadMessages,
      totalSkills,
    },
    recentMessages,
    topProjects,
  });
});

// ── Projects ─────────────────────────────────────────────────

exports.getProjects = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search, category } = req.query;
  const filter = {};
  if (search) filter.title = { $regex: search, $options: 'i' };
  if (category) filter.category = category;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [projects, total] = await Promise.all([
    Project.find(filter).sort({ order: 1, createdAt: -1 }).skip(skip).limit(parseInt(limit)),
    Project.countDocuments(filter),
  ]);

  sendSuccess(res, {
    projects,
    pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) },
  });
});

exports.getProject = asyncHandler(async (req, res, next) => {
  const project = await Project.findById(req.params.id);
  if (!project) return next(new AppError('Project not found', 404));
  sendSuccess(res, { project });
});

exports.createProject = asyncHandler(async (req, res) => {
  const data = { ...req.body };

  // Handle uploaded images
  if (req.files?.length) {
    data.images = req.files.map((f) => `/uploads/projects/${f.filename}`);
    data.thumbnailImage = data.images[0];
  }

  // Auto-generate slug
  data.slug = slugify(data.title, { lower: true, strict: true });

  // Parse JSON fields if sent as strings (multipart)
  ['techStack', 'links'].forEach((field) => {
    if (typeof data[field] === 'string') {
      try { data[field] = JSON.parse(data[field]); } catch {}
    }
  });

  const project = await Project.create(data);
  sendSuccess(res, { project }, 'Project created', 201);
});

exports.updateProject = asyncHandler(async (req, res, next) => {
  const project = await Project.findById(req.params.id);
  if (!project) return next(new AppError('Project not found', 404));

  const data = { ...req.body };

  if (req.files?.length) {
    // Delete old images
    project.images?.forEach((img) => deleteFile(path.join('public', img)));
    data.images = req.files.map((f) => `/uploads/projects/${f.filename}`);
    data.thumbnailImage = data.images[0];
  }

  if (data.title) {
    data.slug = slugify(data.title, { lower: true, strict: true });
  }

  ['techStack', 'links'].forEach((field) => {
    if (typeof data[field] === 'string') {
      try { data[field] = JSON.parse(data[field]); } catch {}
    }
  });

  const updated = await Project.findByIdAndUpdate(req.params.id, data, {
    new: true,
    runValidators: true,
  });

  sendSuccess(res, { project: updated }, 'Project updated');
});

exports.deleteProject = asyncHandler(async (req, res, next) => {
  const project = await Project.findById(req.params.id);
  if (!project) return next(new AppError('Project not found', 404));
  project.images?.forEach((img) => deleteFile(path.join('public', img)));
  await project.deleteOne();
  sendSuccess(res, {}, 'Project deleted');
});

exports.toggleProjectVisibility = asyncHandler(async (req, res, next) => {
  const project = await Project.findById(req.params.id);
  if (!project) return next(new AppError('Project not found', 404));
  project.isVisible = !project.isVisible;
  await project.save();
  sendSuccess(res, { isVisible: project.isVisible });
});

exports.toggleFeatured = asyncHandler(async (req, res, next) => {
  const project = await Project.findById(req.params.id);
  if (!project) return next(new AppError('Project not found', 404));
  project.isFeatured = !project.isFeatured;
  await project.save();
  sendSuccess(res, { isFeatured: project.isFeatured });
});

// ── About ────────────────────────────────────────────────────

exports.getAbout = asyncHandler(async (req, res) => {
  const about = await About.findOne();
  sendSuccess(res, { about });
});

exports.updateAbout = asyncHandler(async (req, res) => {
  const data = { ...req.body };

  if (req.files?.avatar?.[0]) {
    data.avatar = `/uploads/avatars/${req.files.avatar[0].filename}`;
  } else if (req.file && req.file.fieldname === 'avatar') {
    data.avatar = `/uploads/avatars/${req.file.filename}`;
  }

  if (req.files?.resume?.[0]) {
    data.resumeUrl = `/uploads/resumes/${req.files.resume[0].filename}`;
  }

  const about = await About.findOneAndUpdate({}, data, {
    new: true,
    upsert: true,
    runValidators: true,
  });

  sendSuccess(res, { about }, 'About section updated');
});

// ── Skills ───────────────────────────────────────────────────

exports.getSkills = asyncHandler(async (req, res) => {
  const skills = await Skill.find().sort({ category: 1, order: 1 });
  sendSuccess(res, { skills });
});

exports.createSkill = asyncHandler(async (req, res) => {
  const skill = await Skill.create(req.body);
  sendSuccess(res, { skill }, 'Skill created', 201);
});

exports.updateSkill = asyncHandler(async (req, res, next) => {
  const skill = await Skill.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!skill) return next(new AppError('Skill not found', 404));
  sendSuccess(res, { skill }, 'Skill updated');
});

exports.deleteSkill = asyncHandler(async (req, res, next) => {
  const skill = await Skill.findByIdAndDelete(req.params.id);
  if (!skill) return next(new AppError('Skill not found', 404));
  sendSuccess(res, {}, 'Skill deleted');
});

// ── Experience ───────────────────────────────────────────────

exports.getExperience = asyncHandler(async (req, res) => {
  const experience = await Experience.find().sort({ startDate: -1 });
  sendSuccess(res, { experience });
});

exports.createExperience = asyncHandler(async (req, res) => {
  const exp = await Experience.create(req.body);
  sendSuccess(res, { experience: exp }, 'Experience created', 201);
});

exports.updateExperience = asyncHandler(async (req, res, next) => {
  const exp = await Experience.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!exp) return next(new AppError('Experience not found', 404));
  sendSuccess(res, { experience: exp }, 'Experience updated');
});

exports.deleteExperience = asyncHandler(async (req, res, next) => {
  const exp = await Experience.findByIdAndDelete(req.params.id);
  if (!exp) return next(new AppError('Experience not found', 404));
  sendSuccess(res, {}, 'Experience deleted');
});

// ── Messages ─────────────────────────────────────────────────

exports.getMessages = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, unread } = req.query;
  const filter = {};
  if (unread === 'true') filter.isRead = false;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [messages, total] = await Promise.all([
    Message.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
    Message.countDocuments(filter),
  ]);
  sendSuccess(res, { messages, pagination: { total, page: parseInt(page), limit: parseInt(limit) } });
});

exports.getMessage = asyncHandler(async (req, res, next) => {
  const message = await Message.findById(req.params.id);
  if (!message) return next(new AppError('Message not found', 404));
  if (!message.isRead) { message.isRead = true; await message.save(); }
  sendSuccess(res, { message });
});

exports.markMessageRead = asyncHandler(async (req, res, next) => {
  const message = await Message.findByIdAndUpdate(req.params.id, { isRead: true }, { new: true });
  if (!message) return next(new AppError('Message not found', 404));
  sendSuccess(res, { message });
});

exports.deleteMessage = asyncHandler(async (req, res, next) => {
  const message = await Message.findByIdAndDelete(req.params.id);
  if (!message) return next(new AppError('Message not found', 404));
  sendSuccess(res, {}, 'Message deleted');
});

// ── Profile ──────────────────────────────────────────────────

exports.updateProfile = asyncHandler(async (req, res) => {
  const allowedFields = ['name', 'email'];
  const updates = {};
  allowedFields.forEach((f) => { if (req.body[f]) updates[f] = req.body[f]; });

  if (req.file) {
    updates.avatar = `/uploads/avatars/${req.file.filename}`;
  }

  const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
  sendSuccess(res, { user }, 'Profile updated');
});
