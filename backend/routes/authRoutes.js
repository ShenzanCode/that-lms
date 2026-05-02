const express = require('express');
const router = express.Router();
const { login, logout, getMe, register, updateProfile } = require('../controllers/authController');
const { protect, admin } = require('../middleware/authMiddleware');
const { uploadAdminPhoto, handleMulterError } = require('../middleware/uploadMiddleware');

// Public routes
router.post('/login', login);

// Protected routes
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);
router.put('/profile', protect, uploadAdminPhoto, handleMulterError, updateProfile);

// Admin only routes
router.post('/register', protect, admin, register);

module.exports = router;
