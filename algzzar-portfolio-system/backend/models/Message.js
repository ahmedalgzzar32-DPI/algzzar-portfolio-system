const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    subject: { type: String, trim: true },
    body: { type: String, required: true, trim: true },
    isRead: { type: Boolean, default: false },
    isStarred: { type: Boolean, default: false },
    isArchived: { type: Boolean, default: false },
    ipAddress: { type: String },
    userAgent: { type: String },
    repliedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Message', messageSchema);
