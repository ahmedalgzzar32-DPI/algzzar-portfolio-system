const fs = require('fs');
const path = require('path');

/**
 * Delete a file from the uploads directory
 * @param {string} fileUrl - The URL path like /uploads/filename.jpg
 */
const deleteFile = (fileUrl) => {
  try {
    if (!fileUrl) return;
    const filename = path.basename(fileUrl);
    const filePath = path.join(process.cwd(), 'uploads', filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (err) {
    console.error('[FileUtils] Failed to delete file:', err.message);
  }
};

/**
 * Get file size in human-readable format
 */
const formatFileSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

module.exports = { deleteFile, formatFileSize };
