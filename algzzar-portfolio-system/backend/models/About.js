'use strict';
/**
 * models/About.js — Singleton about/profile document
 */
const mongoose = require('mongoose');

const aboutSchema = new mongoose.Schema(
  {
    name:             { type: String, trim: true, default: 'Ahmed Algzzar' },
    title:            { type: String, trim: true, default: 'Graphic Designer & Video Editor' },
    tagline:          { type: String, trim: true },
    bio:              { type: String, trim: true },
    bioShort:         { type: String, trim: true, maxlength: 300 },
    yearsExperience:  { type: Number, default: 3 },
    projectsCount:    { type: Number, default: 0 },
    specialization:   { type: String, trim: true },
    style:            { type: String, trim: true },

    avatar: {
      url:      { type: String },
      publicId: { type: String },
    },

    resume: { type: String },   // URL or Cloudinary path

    email:            { type: String, trim: true, lowercase: true },
    phone:            { type: String, trim: true },
    location:         { type: String, trim: true },
    availableForWork: { type: Boolean, default: true },

    // SEO
    seoTitle:       { type: String, trim: true },
    seoDescription: { type: String, trim: true },

    // Social links embedded here as well (mirror of SocialLink collection)
    socialLinks: [
      {
        platform: { type: String },
        label:    { type: String },
        url:      { type: String },
        icon:     { type: String },
        order:    { type: Number, default: 0 },
      },
    ],

    // Singleton guard — only one About document allowed
    _singleton: { type: String, default: 'about', unique: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('About', aboutSchema);
