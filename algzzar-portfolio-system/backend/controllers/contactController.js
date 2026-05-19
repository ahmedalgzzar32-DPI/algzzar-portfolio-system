const Contact = require('../models/Contact');
const { createError } = require('../utils/errorHandler');
const nodemailer = require('nodemailer');

// ─── EMAIL TRANSPORTER ────────────────────────────────────────────────────────
const createTransporter = () => {
  if (!process.env.SMTP_HOST) return null;

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

// @desc    Submit contact form (public)
// @route   POST /api/contact
// @access  Public
exports.submitContact = async (req, res, next) => {
  try {
    const { name, email, subject, message, phone } = req.body;

    if (!name || !email || !message) {
      return next(createError(400, 'Name, email, and message are required'));
    }

    // Rate limit: max 3 messages per email per 24h
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentCount = await Contact.countDocuments({
      email,
      createdAt: { $gte: dayAgo },
    });

    if (recentCount >= 3) {
      return next(createError(429, 'Too many messages. Please try again tomorrow.'));
    }

    // Save to DB
    const contact = await Contact.create({
      name,
      email,
      subject: subject || 'No subject',
      message,
      phone,
      ip: req.ip,
    });

    // Send email notification (non-blocking)
    const transporter = createTransporter();
    if (transporter && process.env.ADMIN_EMAIL) {
      transporter
        .sendMail({
          from: `"Portfolio Contact" <${process.env.SMTP_USER}>`,
          to: process.env.ADMIN_EMAIL,
          subject: `📬 New Message: ${subject || 'No subject'} — from ${name}`,
          html: `
            <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #e5e5e5; padding: 40px; border-radius: 12px;">
              <h2 style="color: #c9a84c; margin-bottom: 24px;">New Portfolio Message</h2>
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 8px 0; color: #888; width: 100px;">Name</td><td style="padding: 8px 0;">${name}</td></tr>
                <tr><td style="padding: 8px 0; color: #888;">Email</td><td style="padding: 8px 0;"><a href="mailto:${email}" style="color: #c9a84c;">${email}</a></td></tr>
                ${phone ? `<tr><td style="padding: 8px 0; color: #888;">Phone</td><td style="padding: 8px 0;">${phone}</td></tr>` : ''}
                <tr><td style="padding: 8px 0; color: #888;">Subject</td><td style="padding: 8px 0;">${subject || '—'}</td></tr>
              </table>
              <div style="margin-top: 24px; padding: 20px; background: #111; border-left: 3px solid #c9a84c; border-radius: 4px;">
                <p style="margin: 0; line-height: 1.7;">${message.replace(/\n/g, '<br>')}</p>
              </div>
              <p style="margin-top: 24px; color: #555; font-size: 12px;">Sent from IP: ${req.ip}</p>
            </div>
          `,
        })
        .catch((err) => console.error('Email send error:', err));
    }

    res.status(201).json({
      success: true,
      message: 'Message sent successfully! I will get back to you soon.',
      data: { id: contact._id },
    });
  } catch (err) {
    next(err);
  }
};

// ─── ADMIN ROUTES ──────────────────────────────────────────────────────────────

// @desc    Get all messages (admin)
// @route   GET /api/admin/contacts
// @access  Private
exports.getContacts = async (req, res, next) => {
  try {
    const { read, limit = 20, page = 1 } = req.query;

    const query = {};
    if (read === 'true') query.read = true;
    if (read === 'false') query.read = false;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [contacts, total, unreadCount] = await Promise.all([
      Contact.find(query).sort('-createdAt').skip(skip).limit(parseInt(limit)).select('-__v'),
      Contact.countDocuments(query),
      Contact.countDocuments({ read: false }),
    ]);

    res.status(200).json({
      success: true,
      count: contacts.length,
      total,
      pages: Math.ceil(total / parseInt(limit)),
      unreadCount,
      data: contacts,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single message + mark as read
// @route   GET /api/admin/contacts/:id
// @access  Private
exports.getContact = async (req, res, next) => {
  try {
    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      { $set: { read: true, readAt: new Date() } },
      { new: true }
    );

    if (!contact) return next(createError(404, 'Message not found'));

    res.status(200).json({ success: true, data: contact });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete message
// @route   DELETE /api/admin/contacts/:id
// @access  Private
exports.deleteContact = async (req, res, next) => {
  try {
    const contact = await Contact.findByIdAndDelete(req.params.id);
    if (!contact) return next(createError(404, 'Message not found'));

    res.status(200).json({ success: true, message: 'Message deleted' });
  } catch (err) {
    next(err);
  }
};

// @desc    Mark message as read/unread
// @route   PATCH /api/admin/contacts/:id/read
// @access  Private
exports.markRead = async (req, res, next) => {
  try {
    const { read } = req.body;
    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      { read: !!read, readAt: read ? new Date() : null },
      { new: true }
    );
    if (!contact) return next(createError(404, 'Message not found'));
    res.status(200).json({ success: true, data: { read: contact.read } });
  } catch (err) {
    next(err);
  }
};
