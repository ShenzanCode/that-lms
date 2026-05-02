const express = require('express');
const router = express.Router();
const {
  getBooks,
  getBook,
  createBook,
  updateBook,
  deleteBook,
  searchBooks,
  bulkImportBooks,
  bulkDeleteBooks,
  getBookCategories
} = require('../controllers/bookController');
const { protect, protectAny } = require('../middleware/authMiddleware');
const { upload, handleMulterError } = require('../middleware/uploadMiddleware');

// Read routes - accessible to both librarians and students
router.get('/', protectAny, getBooks);
router.get('/search', protectAny, searchBooks);
router.get('/categories', protectAny, getBookCategories);
router.get('/:id', protectAny, getBook);

// Write routes - librarian only
router.post('/', protect, upload.single('coverImage'), handleMulterError, createBook);
router.put('/:id', protect, upload.single('coverImage'), handleMulterError, updateBook);
router.post('/bulk-import', protect, bulkImportBooks);
router.delete('/bulk-delete', protect, bulkDeleteBooks);
router.delete('/:id', protect, deleteBook);

module.exports = router;
