const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getOverdueReport,
  getPopularBooksReport,
  getTransactionsReport,
  getMemberActivityReport,
  getFineCollectionReport,
  generateOverdueFines,
  resetAllData
} = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/dashboard', getDashboardStats);
router.get('/overdue', getOverdueReport);
router.get('/popular-books', getPopularBooksReport);
router.get('/transactions', getTransactionsReport);
router.get('/member-activity', getMemberActivityReport);
router.get('/fine-collection', getFineCollectionReport);
router.post('/generate-overdue-fines', generateOverdueFines);
router.delete('/reset-data', resetAllData);

module.exports = router;
