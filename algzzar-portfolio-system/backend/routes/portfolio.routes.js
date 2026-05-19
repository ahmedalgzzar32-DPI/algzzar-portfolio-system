const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const portfolioController = require('../controllers/portfolioController');
const { contactLimiter } = require('../middleware/rateLimiter');
const validate = require('../middleware/validate');

// GET /api/portfolio/projects
router.get('/projects', portfolioController.getProjects);

// GET /api/portfolio/projects/:slug
router.get('/projects/:slug', portfolioController.getProjectBySlug);

// GET /api/portfolio/about
router.get('/about', portfolioController.getAbout);

// GET /api/portfolio/skills
router.get('/skills', portfolioController.getSkills);

// GET /api/portfolio/experience
router.get('/experience', portfolioController.getExperience);

// GET /api/portfolio/stats  (for animated counters)
router.get('/stats', portfolioController.getStats);

// POST /api/portfolio/contact
router.post(
  '/contact',
  contactLimiter,
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('message')
      .trim()
      .isLength({ min: 10, max: 2000 })
      .withMessage('Message must be 10–2000 characters'),
  ],
  validate,
  portfolioController.submitContact
);

module.exports = router;
