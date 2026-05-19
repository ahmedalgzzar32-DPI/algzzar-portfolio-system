'use strict';
/**
 * models/Contact.js — Alias for Message used by some controllers
 */
const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema(
  {
    name:       { type: String, required: true, trim: true },
    email:      { type: String, required: true, lowercase: true, trim: true },
    phone:      { type: String, trim: true },
    subject:    { type: String, trim: true, default: 'No subject' },
    message:    { type: String, required: true, trim: true },
    read:       { type: Boolean, default: false },
    isStarred:  { type: Boolean, default: false },
    isArchived: { type: Boolean, default: false },
    ip:         { type: String },
    userAgent:  { type: String },
    repliedAt:  { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Contact', contactSchema);
