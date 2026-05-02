const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create uploads directory if it doesn't exist
const uploadDir = './uploads';
const bookCoversDir = './uploads/book-covers';
const memberPhotosDir = './uploads/member-photos';
const adminPhotosDir = './uploads/admin-photos';
const studentDocumentsDir = './uploads/student-documents';

[uploadDir, bookCoversDir, memberPhotosDir, adminPhotosDir, studentDocumentsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.fieldname === 'photo') {
      cb(null, memberPhotosDir);
    } else if (file.fieldname === 'adminPhoto') {
      cb(null, adminPhotosDir);
    } else if (file.fieldname === 'coverImage') {
      cb(null, bookCoversDir);
    } else if (file.fieldname === 'document') {
      cb(null, studentDocumentsDir);
    } else {
      cb(null, uploadDir);
    }
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

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
