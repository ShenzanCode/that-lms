const express = require('express');
const router = express.Router();
const { protectStudent } = require('../middleware/authMiddleware');
const { uploadStudentProfile } = require('../middleware/uploadMiddleware');
const {
  register,
  login,
  submitProfile,
  updateProfile,
  getMe
} = require('../controllers/studentAuthController');

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.use(protectStudent);
router.put('/profile-setup', uploadStudentProfile, submitProfile);
router.put('/profile', uploadStudentProfile, updateProfile);
router.get('/me', getMe);

module.exports = router;
