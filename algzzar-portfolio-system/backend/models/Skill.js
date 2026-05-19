const mongoose = require('mongoose');

const skillSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    icon: { type: String }, // emoji
    tools: [{ type: String, trim: true }],
    proficiency: { type: Number, min: 0, max: 100, default: 90 },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Skill', skillSchema);
