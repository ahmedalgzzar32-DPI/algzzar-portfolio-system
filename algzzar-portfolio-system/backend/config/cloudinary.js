const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Storage for project images
const projectStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'algzzar/projects',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
    transformation: [{ quality: 'auto', fetch_format: 'auto' }],
  },
});

// Storage for profile images
const profileStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'algzzar/profile',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 800, height: 800, crop: 'fill', quality: 'auto' }],
  },
});

// Storage for general media
const mediaStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const isVideo = file.mimetype.startsWith('video/');
    return {
      folder: `algzzar/media`,
      resource_type: isVideo ? 'video' : 'image',
      allowed_formats: isVideo
        ? ['mp4', 'mov', 'avi', 'webm']
        : ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'],
      transformation: isVideo ? [] : [{ quality: 'auto', fetch_format: 'auto' }],
    };
  },
});

const uploadProject = multer({
  storage: projectStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

const uploadProfile = multer({
  storage: profileStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

const uploadMedia = multer({
  storage: mediaStorage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
});

module.exports = { cloudinary, uploadProject, uploadProfile, uploadMedia };
