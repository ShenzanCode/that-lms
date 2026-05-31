/**
 * Image URL Utility
 * Generates absolute URLs for uploaded images
 * Works in both development and production
 */

const getBaseUrl = (req) => {
  // For production, use environment variable or construct from request
  if (process.env.BASE_URL) {
    return process.env.BASE_URL;
  }
  
  // For development, construct from request
  const protocol = req.protocol;
  const host = req.get('host');
  return `${protocol}://${host}`;
};

const isAbsoluteUrl = (value) => /^https?:\/\//i.test(value);

/**
 * Generate full URL for member photo
 * @param {string} filename - Photo filename from database
 * @param {object} req - Express request object
 * @returns {string|null} - Full URL or null if no filename
 */
const getMemberPhotoUrl = (filename, req) => {
  if (!filename) return null;

  if (isAbsoluteUrl(filename)) {
    return filename;
  }
  
  const baseUrl = getBaseUrl(req);
  
  // If filename already includes the full path (starts with /uploads), use it as-is
  if (filename.startsWith('/uploads/') || filename.startsWith('uploads/')) {
    const cleanPath = filename.startsWith('/') ? filename : `/${filename}`;
    return `${baseUrl}${cleanPath}`;
  }
  
  // Otherwise, assume it's just the filename and construct the full path
  return `${baseUrl}/uploads/member-photos/${filename}`;
};

/**
 * Generate full URL for book cover
 * @param {string} filename - Cover filename from database
 * @param {object} req - Express request object
 * @returns {string|null} - Full URL or null if no filename
 */
const getBookCoverUrl = (filename, req) => {
  if (!filename) return null;

  if (isAbsoluteUrl(filename)) {
    return filename;
  }
  
  const baseUrl = getBaseUrl(req);
  
  // If filename already includes the full path (starts with /uploads), use it as-is
  if (filename.startsWith('/uploads/') || filename.startsWith('uploads/')) {
    const cleanPath = filename.startsWith('/') ? filename : `/${filename}`;
    return `${baseUrl}${cleanPath}`;
  }
  
  // Otherwise, assume it's just the filename and construct the full path
  return `${baseUrl}/uploads/book-covers/${filename}`;
};

/**
 * Format member object with full image URLs
 * @param {object} member - Member document from database
 * @param {object} req - Express request object
 * @returns {object} - Member object with full URLs
 */
const formatMemberWithImageUrls = (member, req) => {
  const memberObj = member.toObject ? member.toObject() : member;
  
  return {
    ...memberObj,
    photo: getMemberPhotoUrl(memberObj.photo, req),
    photoFilename: memberObj.photo, // Keep original filename for reference
  };
};

module.exports = {
  getBaseUrl,
  isAbsoluteUrl,
  getMemberPhotoUrl,
  getBookCoverUrl,
  formatMemberWithImageUrls
};
