const Project = require('../models/Project');
const About = require('../models/About');
const Skill = require('../models/Skill');
const Experience = require('../models/Experience');
const Message = require('../models/Message');
const { asyncHandler, sendSuccess, AppError } = require('../utils/helpers');

// GET /api/portfolio/projects
exports.getProjects = asyncHandler(async (req, res) => {
  const { category, featured, page = 1, limit = 12 } = req.query;

  const filter = { isVisible: true };
  if (category && category !== 'all') filter.category = category;
  if (featured === 'true') filter.isFeatured = true;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [projects, total] = await Promise.all([
    Project.find(filter)
      .sort({ order: 1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-__v'),
    Project.countDocuments(filter),
  ]);

  // Unique categories for filter tabs
  const categories = await Project.distinct('category', { isVisible: true });

  sendSuccess(res, {
    projects,
    categories: ['all', ...categories],
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / parseInt(limit)),
    },
  });
});

// GET /api/portfolio/projects/:slug
exports.getProjectBySlug = asyncHandler(async (req, res, next) => {
  const project = await Project.findOne({
    slug: req.params.slug,
    isVisible: true,
  });

  if (!project) {
    return next(new AppError('Project not found', 404));
  }

  // Increment view count
  await Project.findByIdAndUpdate(project._id, { $inc: { views: 1 } });

  // Get adjacent projects for prev/next navigation
  const [prev, next_] = await Promise.all([
    Project.findOne({ isVisible: true, order: { $lt: project.order } })
      .sort({ order: -1 })
      .select('title slug thumbnailImage'),
    Project.findOne({ isVisible: true, order: { $gt: project.order } })
      .sort({ order: 1 })
      .select('title slug thumbnailImage'),
  ]);

  sendSuccess(res, { project, prev, next: next_ });
});

// GET /api/portfolio/about
exports.getAbout = asyncHandler(async (req, res, next) => {
  const about = await About.findOne().select('-__v');
  if (!about) return next(new AppError('About section not configured yet', 404));
  sendSuccess(res, { about });
});

// GET /api/portfolio/skills
exports.getSkills = asyncHandler(async (req, res) => {
  const skills = await Skill.find({ isVisible: true }).sort({ category: 1, order: 1 });

  // Group by category
  const grouped = skills.reduce((acc, skill) => {
    if (!acc[skill.category]) acc[skill.category] = [];
    acc[skill.category].push(skill);
    return acc;
  }, {});

  sendSuccess(res, { skills, grouped });
});

// GET /api/portfolio/experience
exports.getExperience = asyncHandler(async (req, res) => {
  const experience = await Experience.find({ isVisible: true }).sort({ startDate: -1 });
  sendSuccess(res, { experience });
});

// GET /api/portfolio/stats
exports.getStats = asyncHandler(async (req, res) => {
  const [projectCount, skillCount, experienceYears] = await Promise.all([
    Project.countDocuments({ isVisible: true }),
    Skill.countDocuments({ isVisible: true }),
    Experience.aggregate([
      { $match: { isVisible: true } },
      {
        $group: {
          _id: null,
          earliest: { $min: '$startDate' },
        },
      },
    ]),
  ]);

  const yearsExperience = experienceYears.length
    ? Math.floor(
        (Date.now() - new Date(experienceYears[0].earliest).getTime()) /
          (1000 * 60 * 60 * 24 * 365)
      )
    : 0;

  sendSuccess(res, {
    stats: {
      projects: projectCount,
      skills: skillCount,
      yearsExperience,
    },
  });
});

// POST /api/portfolio/contact
exports.submitContact = asyncHandler(async (req, res) => {
  const { name, email, subject, message } = req.body;

  await Message.create({
    name,
    email,
    subject: subject || 'Portfolio Contact',
    message,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  sendSuccess(res, {}, 'Message sent successfully. I will get back to you soon!', 201);
});
