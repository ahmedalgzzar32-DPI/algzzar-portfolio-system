const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true },
    originalName: { type: String },
    url: { type: String, required: true },
    publicId: { type: String, required: true }, // Cloudinary public_id
    resourceType: { type: String, enum: ['image', 'video', 'raw'], default: 'image' },
    format: { type: String },
    size: { type: Number }, // bytes
    width: { type: Number },
    height: { type: Number },
    duration: { type: Number }, // seconds, for videos
    folder: { type: String, default: 'general' },
    tags: [{ type: String }],
    altText: { type: String },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Media', mediaSchema);
