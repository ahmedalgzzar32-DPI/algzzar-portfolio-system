const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema(
  {
    // Identity
    name: { type: String, required: true, trim: true, default: 'Ahmed Algzzar' },
    title: { type: String, trim: true, default: 'Graphic Designer & Video Editor' },
    tagline: { type: String, trim: true },
    bio: { type: String, trim: true },
    bioShort: { type: String, trim: true, maxlength: 300 },
    yearsExperience: { type: Number, default: 3 },
    specialization: { type: String, trim: true },
    style: { type: String, trim: true },

    // Profile image
    avatar: {
      url: { type: String },
      publicId: { type: String },
    },

    // Contact
    email: { type: String, trim: true },
    phone: { type: String, trim: true },
    location: { type: String, trim: true },
    availableForWork: { type: Boolean, default: true },

    // SEO
    seoTitle: { type: String, trim: true },
    seoDescription: { type: String, trim: true },

    // Singleton guard
    _singleton: { type: String, default: 'profile', unique: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Profile', profileSchema);
