'use strict';
/**
 * models/Experience.js — Work / education timeline
 */
const mongoose = require('mongoose');

const experienceSchema = new mongoose.Schema(
  {
    type:        { type: String, enum: ['work', 'education', 'freelance'], default: 'work' },
    title:       { type: String, required: true, trim: true },
    organization:{ type: String, trim: true },
    location:    { type: String, trim: true },
    description: { type: String, trim: true },
    highlights:  [{ type: String, trim: true }],
    startDate:   { type: Date, required: true },
    endDate:     { type: Date },               // null = present
    isCurrent:   { type: Boolean, default: false },
    isVisible:   { type: Boolean, default: true },
    order:       { type: Number, default: 0 },
    logo:        { type: String },             // URL
  },
  { timestamps: true }
);

// Virtual: duration in months
experienceSchema.virtual('durationMonths').get(function () {
  const end = this.endDate || new Date();
  return Math.round((end - this.startDate) / (1000 * 60 * 60 * 24 * 30));
});

experienceSchema.set('toJSON',   { virtuals: true });
experienceSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Experience', experienceSchema);
