const mongoose = require('mongoose');

const socialLinkSchema = new mongoose.Schema(
  {
    platform: {
      type: String,
      required: true,
      enum: ['linkedin', 'instagram', 'facebook', 'twitter', 'behance', 'dribbble', 'youtube', 'tiktok', 'other'],
    },
    label: { type: String, trim: true },
    url: { type: String, required: true, trim: true },
    icon: { type: String }, // SVG path or icon name
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    showInFooter: { type: Boolean, default: true },
    showInContact: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SocialLink', socialLinkSchema);
