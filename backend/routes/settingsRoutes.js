const express = require('express');
const router = express.Router();
const {
  getSettings,
  updateSettings
} = require('../controllers/settingsController');
const { protect, admin } = require('../middleware/authMiddleware');

// Public access to read settings (needed for blocked members to see contact info)
router.get('/', getSettings);

// Only admins can update settings
router.put('/', protect, admin, updateSettings);

module.exports = router;
