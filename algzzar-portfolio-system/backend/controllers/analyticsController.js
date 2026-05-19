const Project = require('../models/Project');
const Contact = require('../models/Contact');
const Visit = require('../models/Visit');

// @desc    Get dashboard analytics overview
// @route   GET /api/admin/analytics
// @access  Private
exports.getAnalytics = async (req, res, next) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalProjects,
      publishedProjects,
      totalMessages,
      unreadMessages,
      recentMessages,
      topProjects,
      visitsLast30Days,
      visitsLast7Days,
    ] = await Promise.all([
      Project.countDocuments(),
      Project.countDocuments({ status: 'published' }),
      Contact.countDocuments(),
      Contact.countDocuments({ read: false }),
      Contact.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      Project.find({ status: 'published' })
        .sort('-views')
        .limit(5)
        .select('title slug views thumbnail'),
      Visit.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      Visit.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
    ]);

    // Visit trend (last 14 days)
    const visitTrend = await Visit.aggregate([
      { $match: { createdAt: { $gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) } } },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Messages per day (last 14 days)
    const messageTrend = await Contact.aggregate([
      { $match: { createdAt: { $gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalProjects,
          publishedProjects,
          draftProjects: totalProjects - publishedProjects,
          totalMessages,
          unreadMessages,
          recentMessages,
          visitsLast30Days,
          visitsLast7Days,
        },
        topProjects,
        visitTrend,
        messageTrend,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Record a portfolio visit (called from frontend)
// @route   POST /api/analytics/visit
// @access  Public
exports.recordVisit = async (req, res, next) => {
  try {
    const { page = '/', referrer, userAgent } = req.body;

    await Visit.create({
      page,
      referrer: referrer || null,
      ip: req.ip,
      userAgent: userAgent || req.headers['user-agent'],
    });

    res.status(200).json({ success: true });
  } catch (err) {
    // Non-critical — don't block the request
    res.status(200).json({ success: true });
  }
};
