const mongoose = require('mongoose');
const slugify = require('slugify');

const projectSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, unique: true },
    description: { type: String, trim: true },
    shortDescription: { type: String, trim: true, maxlength: 200 },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    tags: [{ type: String, trim: true }],

    // Media
    coverImage: {
      url: { type: String },
      publicId: { type: String }, // Cloudinary public_id for deletion
    },
    images: [
      {
        url: { type: String },
        publicId: { type: String },
        caption: { type: String },
      },
    ],
    videoUrl: { type: String },

    // Display
    isFeatured: { type: Boolean, default: false },
    isLarge: { type: Boolean, default: false }, // For large grid items
    order: { type: Number, default: 0 },
    isPublished: { type: Boolean, default: true },

    // Stats
    views: { type: Number, default: 0 },

    // Client info (optional)
    client: { type: String, trim: true },
    year: { type: Number },
    tools: [{ type: String, trim: true }],

    // Links
    liveUrl: { type: String },
    behanceUrl: { type: String },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

projectSchema.pre('save', function (next) {
  if (this.isModified('title') && !this.slug) {
    this.slug = slugify(this.title, { lower: true, strict: true });
  }
  next();
});

// Increment views
projectSchema.methods.incrementViews = function () {
  this.views += 1;
  return this.save({ validateBeforeSave: false });
};

// Index for search
projectSchema.index({ title: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('Project', projectSchema);
