const multer = require('multer');
const storage = multer.memoryStorage();

// File filter
const fileFilter = (req, file, cb) => {
  // Accept images only
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

// Multer configuration
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 // 5MB default
  }
});

// Error handling middleware for multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 5MB'
      });
    }
    return res.status(400).json({
      success: false,
      message: err.message
    });
  } else if (err) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  next();
};

// Middleware for member photo upload
const uploadMemberPhoto = upload.single('photo');

// Middleware for book cover upload
const uploadBookCover = upload.single('coverImage');

// Middleware for admin photo upload
const uploadAdminPhoto = upload.single('adminPhoto');

// Middleware for student profile with photo and document
const uploadStudentProfile = upload.fields([
  { name: 'photo', maxCount: 1 },
  { name: 'document', maxCount: 1 }
]);

module.exports = { 
  upload, 
  handleMulterError,
  uploadMemberPhoto,
  uploadBookCover,
  uploadAdminPhoto,
  uploadStudentProfile
};
