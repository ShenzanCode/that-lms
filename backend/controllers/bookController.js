const Book = require('../models/Book');
const Transaction = require('../models/Transaction');
const { generateAccessionNumber } = require('../utils/helpers');

// @desc    Get all books with filtering, sorting, pagination
// @route   GET /api/books
// @access  Private
const getBooks = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      category,
      status,
      department,
      sortBy = '-createdAt'
    } = req.query;

    // Build query
    const query = {};

    if (search) {
      // Escape special regex characters for exact matching
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      
      // Create regex pattern for exact word matching
      // This will match the search term as a whole word or phrase
      const searchPattern = new RegExp(`\\b${escapedSearch}\\b`, 'i');
      
      query.$or = [
        { title: { $regex: escapedSearch, $options: 'i' } },
        { author: { $regex: escapedSearch, $options: 'i' } },
        { isbn: { $regex: escapedSearch, $options: 'i' } },
        { accessionNumber: { $regex: escapedSearch, $options: 'i' } }
      ];
    }

    if (category && category.trim() !== '') {
      // Case-insensitive category matching
      // Escape special regex characters in category name
      const escapedCategory = category.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.category = { $regex: new RegExp(`^${escapedCategory}$`, 'i') };
    }

    if (status && status.trim() !== '') {
      query.status = status;
    }

    if (department) {
      query.department = department;
    }

    // Execute query with pagination
    const skip = (page - 1) * limit;
    
    const books = await Book.find(query)
      .sort(sortBy)
      .limit(parseInt(limit))
      .skip(skip)
      .populate('addedBy', 'name username');

    const total = await Book.countDocuments(query);

    res.json({
      success: true,
      data: books,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single book
// @route   GET /api/books/:id
// @access  Private
const getBook = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id).populate('addedBy', 'name username');

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    // Get issue history
    const issueHistory = await Transaction.find({ bookId: book._id })
      .populate('memberId', 'name memberId')
      .populate('issuedBy', 'name')
      .sort('-issueDate')
      .limit(10);

    res.json({
      success: true,
      data: {
        ...book.toObject(),
        issueHistory
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new book
// @route   POST /api/books
// @access  Private
const createBook = async (req, res, next) => {
  try {
    const bookData = { ...req.body };

    // Add cover image if uploaded
    if (req.file) {
      bookData.coverImage = `/uploads/book-covers/${req.file.filename}`;
    }

    // Generate accession number if not provided
    if (!bookData.accessionNumber) {
      bookData.accessionNumber = generateAccessionNumber(
        bookData.category,
        bookData.publicationYear
      );
    }

    // Set added by
    bookData.addedBy = req.user.id;

    // Ensure availableCopies matches totalCopies for new book
    bookData.availableCopies = bookData.totalCopies || 1;

    const book = await Book.create(bookData);

    res.status(201).json({
      success: true,
      message: 'Book created successfully',
      data: book
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update book
// @route   PUT /api/books/:id
// @access  Private
const updateBook = async (req, res, next) => {
  try {
    let book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    const updateData = { ...req.body };

    // Handle image removal
    if (req.body.removeImage === 'true') {
      updateData.coverImage = null;
    }
    // Add new cover image if uploaded
    else if (req.file) {
      updateData.coverImage = `/uploads/book-covers/${req.file.filename}`;
    }

    // Remove the removeImage flag from updateData
    delete updateData.removeImage;

    // Convert string numbers to integers
    if (updateData.totalCopies !== undefined) {
      updateData.totalCopies = parseInt(updateData.totalCopies);
    }
    if (updateData.availableCopies !== undefined) {
      updateData.availableCopies = parseInt(updateData.availableCopies);
    }

    // Handle totalCopies and availableCopies updates
    if (updateData.totalCopies !== undefined || updateData.availableCopies !== undefined) {
      const newTotalCopies = updateData.totalCopies !== undefined ? updateData.totalCopies : book.totalCopies;
      const newAvailableCopies = updateData.availableCopies !== undefined ? updateData.availableCopies : book.availableCopies;
      
      // Ensure availableCopies doesn't exceed totalCopies
      if (newAvailableCopies > newTotalCopies) {
        updateData.availableCopies = newTotalCopies;
      }
      
      // Update status based on availableCopies (only for Available/Not Available status)
      if (book.status === 'Available' || book.status === 'Not Available') {
        const finalAvailableCopies = updateData.availableCopies !== undefined ? updateData.availableCopies : newAvailableCopies;
        if (finalAvailableCopies <= 0) {
          updateData.status = 'Not Available';
        } else {
          updateData.status = 'Available';
        }
      }
    }

    book = await Book.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Book updated successfully',
      data: book
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete book
// @route   DELETE /api/books/:id
// @access  Private
const deleteBook = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    // Check if book is currently issued
    const issuedTransactions = await Transaction.countDocuments({
      bookId: book._id,
      status: { $in: ['Issued', 'Overdue'] }
    });

    if (issuedTransactions > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete book with active issues'
      });
    }

    await book.deleteOne();

    res.json({
      success: true,
      message: 'Book deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Search books
// @route   GET /api/books/search
// @access  Private
const searchBooks = async (req, res, next) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const books = await Book.find({
      $text: { $search: q }
    }, {
      score: { $meta: 'textScore' }
    })
      .sort({ score: { $meta: 'textScore' } })
      .limit(20);

    res.json({
      success: true,
      data: books,
      count: books.length
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Bulk import books from Excel/CSV
// @route   POST /api/books/bulk-import
// @access  Private
const bulkImportBooks = async (req, res, next) => {
  try {
    const { books } = req.body;

    if (!Array.isArray(books) || books.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of books'
      });
    }

    const results = {
      inserted: [],
      updated: [],
      failed: [],
      totalRows: books.length,
      totalCopies: 0
    };

    // Process each book
    for (const bookData of books) {
      try {
        // Ensure category is set - this is required
        if (!bookData.category || !bookData.category.trim()) {
          bookData.category = 'Miscellaneous';
          console.log(`⚠️  Book "${bookData.title}" has no category, setting to: Miscellaneous`);
        }
        
        // Debug: Log first few books to see what data we're receiving
        if (results.inserted.length === 0 && results.updated.length === 0) {
          console.log('Sample book data received:', {
            title: bookData.title,
            category: bookData.category,
            accessionNumber: bookData.accessionNumber,
            price: bookData.price,
            edition: bookData.edition,
            author: bookData.author
          });
        }
        
        // Use provided accession number or generate one
        // Frontend now sends Sr.No as accessionNumber
        if (!bookData.accessionNumber) {
          bookData.accessionNumber = generateAccessionNumber(
            bookData.category,
            bookData.publicationYear
          );
          console.log(`Generated accession number for "${bookData.title}": ${bookData.accessionNumber}`);
        } else {
          console.log(`Using provided accession number for "${bookData.title}": ${bookData.accessionNumber}`);
        }

        bookData.addedBy = req.user.id;
        bookData.availableCopies = bookData.totalCopies || 1;

        // Check if book already exists (by title + author)
        const existingBook = await Book.findOne({
          title: { $regex: new RegExp(`^${bookData.title}$`, 'i') },
          author: { $regex: new RegExp(`^${bookData.author}$`, 'i') }
        });

        if (existingBook) {
          // Book exists - update copy count
          existingBook.totalCopies += bookData.totalCopies;
          existingBook.availableCopies += bookData.totalCopies;
          await existingBook.save();
          
          results.updated.push({ 
            title: existingBook.title,
            author: existingBook.author,
            copiesAdded: bookData.totalCopies,
            totalCopies: existingBook.totalCopies
          });
          results.totalCopies += bookData.totalCopies;
        } else {
          // New book - create it
          const book = await Book.create(bookData);
          results.inserted.push({ 
            title: book.title,
            author: book.author,
            accessionNumber: book.accessionNumber,
            copies: book.totalCopies
          });
          results.totalCopies += book.totalCopies;
        }
      } catch (error) {
        results.failed.push({ 
          title: bookData.title,
          author: bookData.author,
          edition: bookData.edition,
          category: bookData.category,
          isbn: bookData.isbn,
          accessionNumber: bookData.accessionNumber,
          error: error.message 
        });
      }
    }

    res.status(201).json({
      success: true,
      message: `Imported ${results.inserted.length} new books, updated ${results.updated.length} existing books, ${results.failed.length} failed`,
      data: {
        summary: {
          totalRows: results.totalRows,
          inserted: results.inserted.length,
          updated: results.updated.length,
          failed: results.failed.length,
          totalCopies: results.totalCopies
        },
        details: results
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Bulk delete books
// @route   DELETE /api/books/bulk-delete
// @access  Private
const bulkDeleteBooks = async (req, res, next) => {
  try {
    const { bookIds, deleteAll } = req.body;

    if (deleteAll) {
      // Check if any books are currently issued
      const issuedBooks = await Transaction.find({
        status: 'issued'
      }).distinct('book');

      if (issuedBooks.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Cannot delete all books. ${issuedBooks.length} books are currently issued.`
        });
      }

      const result = await Book.deleteMany({});
      return res.json({
        success: true,
        message: `Successfully deleted ${result.deletedCount} books`,
        data: { deletedCount: result.deletedCount }
      });
    }

    if (!Array.isArray(bookIds) || bookIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of book IDs or set deleteAll to true'
      });
    }

    // Check if any of the selected books are currently issued
    const issuedBooks = await Transaction.find({
      book: { $in: bookIds },
      status: 'issued'
    }).populate('book', 'title accessionNumber');

    if (issuedBooks.length > 0) {
      const issuedTitles = issuedBooks.map(t => t.book.title).join(', ');
      return res.status(400).json({
        success: false,
        message: `Cannot delete books that are currently issued: ${issuedTitles}`
      });
    }

    const result = await Book.deleteMany({
      _id: { $in: bookIds }
    });

    res.json({
      success: true,
      message: `Successfully deleted ${result.deletedCount} books`,
      data: { deletedCount: result.deletedCount }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get book categories
// @route   GET /api/books/categories
// @access  Private
const getBookCategories = async (req, res, next) => {
  try {
    const categories = await Book.distinct('category');

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getBooks,
  getBook,
  createBook,
  updateBook,
  deleteBook,
  searchBooks,
  bulkImportBooks,
  bulkDeleteBooks,
  getBookCategories
};
