const express = require('express');
const router = express.Router();
const {
  issueBook,
  returnBook,
  renewBook,
  getTransactions,
  getIssuedBooks,
  getTransaction
} = require('../controllers/transactionController');
const { protect, protectAny } = require('../middleware/authMiddleware');

// Read operations - accessible to both librarians and students
router.get('/', protectAny, getTransactions);
router.get('/issued', protectAny, getIssuedBooks);
router.get('/:id', protectAny, getTransaction);

// Write operations - librarian only
router.post('/issue', protect, issueBook);
router.post('/return', protect, returnBook);
router.post('/renew', protect, renewBook);

module.exports = router;
