const express = require('express');
const { body, validationResult } = require('express-validator');
const Message = require('../models/Message');
const { protect } = require('../middleware/auth');

const router = express.Router();

// POST /api/messages  — public contact form submission
router.post(
  '/',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('body').notEmpty().withMessage('Message body is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    try {
      const message = await Message.create({
        ...req.body,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });
      res.status(201).json({ success: true, message: 'Message sent successfully', data: { id: message._id } });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

// GET /api/messages  (admin)
router.get('/', protect, async (req, res) => {
  try {
    const { read, starred, archived, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (read !== undefined) filter.isRead = read === 'true';
    if (starred !== undefined) filter.isStarred = starred === 'true';
    filter.isArchived = archived === 'true';

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [messages, total, unreadCount] = await Promise.all([
      Message.find(filter).sort('-createdAt').skip(skip).limit(parseInt(limit)),
      Message.countDocuments(filter),
      Message.countDocuments({ isRead: false, isArchived: false }),
    ]);

    res.json({ success: true, total, unreadCount, data: messages });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/messages/:id  (admin) — mark read, star, archive
router.put('/:id', protect, async (req, res) => {
  try {
    const msg = await Message.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!msg) return res.status(404).json({ success: false, message: 'Message not found' });
    res.json({ success: true, data: msg });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/messages/:id  (admin)
router.delete('/:id', protect, async (req, res) => {
  try {
    await Message.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Message deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
