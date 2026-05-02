const express = require('express');
const router = express.Router();
const {
  getFines,
  getMemberFines,
  payFine,
  waiveFine,
  getFineStats,
  notifyFine
} = require('../controllers/fineController');
const { protect, protectAny } = require('../middleware/authMiddleware');

// Read operations - accessible to both
router.get('/', protectAny, getFines);
router.get('/member/:memberId', protectAny, getMemberFines);

// Admin operations - librarian only
router.get('/stats', protect, getFineStats);
router.post('/payment', protect, payFine);
router.patch('/:id/waive', protect, waiveFine);
router.post('/:id/notify', protect, notifyFine);

module.exports = router;
