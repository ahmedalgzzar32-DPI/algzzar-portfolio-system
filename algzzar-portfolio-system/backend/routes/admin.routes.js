const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const adminController = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/auth');
const { uploadProjectImages, uploadAvatar, uploadResume } = require('../utils/upload');
const validate = require('../middleware/validate');

// All admin routes require auth
router.use(protect, adminOnly);

// ── Dashboard ────────────────────────────────────────────────
router.get('/dashboard', adminController.getDashboardStats);

// ── Projects ─────────────────────────────────────────────────
router.get('/projects', adminController.getProjects);
router.post(
  '/projects',
  uploadProjectImages.array('images', 10),
  [
    body('title').trim().notEmpty().withMessage('Title required'),
    body('description').trim().notEmpty().withMessage('Description required'),
    body('category').notEmpty().withMessage('Category required'),
  ],
  validate,
  adminController.createProject
);
router.get('/projects/:id', adminController.getProject);
router.put(
  '/projects/:id',
  uploadProjectImages.array('images', 10),
  validate,
  adminController.updateProject
);
router.delete('/projects/:id', adminController.deleteProject);
router.patch('/projects/:id/toggle', adminController.toggleProjectVisibility);
router.patch('/projects/:id/featured', adminController.toggleFeatured);

// ── About / Profile ──────────────────────────────────────────
router.get('/about', adminController.getAbout);
router.put(
  '/about',
  uploadAvatar.single('avatar'),
  uploadResume.single('resume'),
  adminController.updateAbout
);

// ── Skills ───────────────────────────────────────────────────
router.get('/skills', adminController.getSkills);
router.post('/skills', adminController.createSkill);
router.put('/skills/:id', adminController.updateSkill);
router.delete('/skills/:id', adminController.deleteSkill);

// ── Experience ───────────────────────────────────────────────
router.get('/experience', adminController.getExperience);
router.post('/experience', adminController.createExperience);
router.put('/experience/:id', adminController.updateExperience);
router.delete('/experience/:id', adminController.deleteExperience);

// ── Messages / Contact ───────────────────────────────────────
router.get('/messages', adminController.getMessages);
router.get('/messages/:id', adminController.getMessage);
router.patch('/messages/:id/read', adminController.markMessageRead);
router.delete('/messages/:id', adminController.deleteMessage);

// ── Profile Settings ─────────────────────────────────────────
router.put(
  '/profile',
  uploadAvatar.single('avatar'),
  adminController.updateProfile
);

module.exports = router;
