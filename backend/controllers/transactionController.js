const Transaction = require('../models/Transaction');
const Book = require('../models/Book');
const Member = require('../models/Member');
const Fine = require('../models/Fine');
const Settings = require('../models/Settings');
const Notification = require('../models/Notification');
const AdminNotification = require('../models/AdminNotification');
const { calculateDueDate, calculateFine } = require('../utils/helpers');

// @desc    Issue book to member
// @route   POST /api/transactions/issue
// @access  Private
const issueBook = async (req, res, next) => {
  try {
    const { bookId, memberId, accessionNumber } = req.body;

    // Validate required fields
    if (!bookId || !memberId) {
      return res.status(400).json({
        success: false,
        message: 'Book ID and Member ID are required'
      });
    }

    // Check if book exists and is available
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    if (book.availableCopies <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Book is not available'
      });
    }

    // Check if member exists and can borrow
    const member = await Member.findById(memberId);
    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }

    if (member.isBlocked) {
      return res.status(400).json({
        success: false,
        message: `Member is blocked: ${member.blockReason}`
      });
    }

    if (new Date() > member.validUntil) {
      return res.status(400).json({
        success: false,
        message: 'Member membership has expired'
      });
    }

    if (member.currentBorrowedBooks >= member.borrowingLimit) {
      return res.status(400).json({
        success: false,
        message: `Member has reached borrowing limit (${member.borrowingLimit})`
      });
    }

    // Check for unpaid fines
    const unpaidFines = await Fine.countDocuments({
      memberId: member._id,
      isPaid: false
    });

    if (unpaidFines > 0) {
      return res.status(400).json({
        success: false,
        message: 'Member has unpaid fines. Please clear dues before issuing new books.'
      });
    }

    // Calculate due date
    const dueDate = await calculateDueDate(member.memberType);

    // Get max renewals from settings
    const settings = await Settings.getSettings();
    const maxRenewals = settings.renewalSettings.maxRenewals || 2;

    // Create transaction
    const transaction = await Transaction.create({
      bookId: book._id,
      memberId: member._id,
      accessionNumber: accessionNumber || book.accessionNumber,
      issueDate: new Date(),
      dueDate,
      status: 'Issued',
      issuedBy: req.user.id,
      maxRenewals: maxRenewals
    });

    // Update book available copies
    book.availableCopies -= 1;
    if (book.availableCopies === 0) {
      book.status = 'Not Available';
    }
    await book.save();

    // Update member borrowed count
    member.currentBorrowedBooks += 1;
    member.totalBooksBorrowed += 1;
    await member.save();

    // Create notification for book issued
    await Notification.create({
      memberId: member._id,
      title: 'Book Issued Successfully',
      message: `"${book.title}" has been issued to you. Please return it by ${dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}.`,
      type: 'general',
      relatedType: 'transaction',
      relatedId: transaction._id
    });

    // Create admin notification for book issue
    await AdminNotification.create({
      title: 'Book Issued',
      message: `"${book.title}" issued to ${member.name} (${member.memberId}). Due date: ${dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}.`,
      type: 'general'
    });

    // Populate transaction for response
    await transaction.populate([
      { path: 'bookId', select: 'title author accessionNumber' },
      { path: 'memberId', select: 'name memberId memberType' },
      { path: 'issuedBy', select: 'name' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Book issued successfully',
      data: transaction
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Return book
// @route   POST /api/transactions/return
// @access  Private
const returnBook = async (req, res, next) => {
  try {
    const { transactionId, condition, notes } = req.body;

    if (!transactionId) {
      return res.status(400).json({
        success: false,
        message: 'Transaction ID is required'
      });
    }

    // Find transaction
    const transaction = await Transaction.findById(transactionId)
      .populate('bookId')
      .populate('memberId');

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    if (transaction.status === 'Returned') {
      return res.status(400).json({
        success: false,
        message: 'Book already returned'
      });
    }

    // Check for ALL existing fines for this transaction (paid or unpaid)
    const allExistingFines = await Fine.find({
      transactionId: transaction._id
    });

    // Note: We allow book return even with unpaid fines
    // The fine will remain unpaid and prevent future borrowing

    const returnDate = new Date();
    
    // Calculate fine if overdue - BUT only create if no fine exists yet
    let fine = 0;
    const hasOverdueFine = allExistingFines.some(f => f.reason === 'Overdue');
    
    if (returnDate > transaction.dueDate && !hasOverdueFine) {
      // Only create fine if one doesn't already exist
      const settings = await Settings.getSettings();
      fine = await calculateFine(transaction.dueDate, returnDate);
      
      // Create fine record
      if (fine > 0) {
        await Fine.create({
          transactionId: transaction._id,
          memberId: transaction.memberId._id,
          bookId: transaction.bookId._id,
          amount: fine,
          reason: 'Overdue',
          description: `Book returned ${Math.ceil((returnDate - transaction.dueDate) / (1000 * 60 * 60 * 24))} days late`
        });
      }
    } else if (hasOverdueFine) {
      // If fine already exists (and was paid), use 0 for new fine
      fine = 0;
    }

    // Update transaction
    transaction.returnDate = returnDate;
    transaction.status = 'Returned';
    transaction.fine = fine;
    transaction.returnedBy = req.user.id;
    if (notes) {
      transaction.notes = notes;
    }
    await transaction.save();

    // Update book
    const book = transaction.bookId;
    book.availableCopies += 1;
    if (book.availableCopies > 0 && book.status === 'Not Available') {
      book.status = 'Available';
    }
    if (condition) {
      book.condition = condition;
    }
    await book.save();

    // Update member
    const member = transaction.memberId;
    member.currentBorrowedBooks -= 1;
    await member.save();

    // Calculate days late for notifications
    const daysLate = fine > 0 ? Math.ceil((returnDate - transaction.dueDate) / (1000 * 60 * 60 * 24)) : 0;

    // Create notification for book returned
    const notificationMessage = fine > 0 
      ? `"${book.title}" has been returned successfully. A fine of Rs. ${fine.toFixed(2)} has been applied for ${daysLate} day(s) delay.`
      : `"${book.title}" has been returned successfully. Thank you for returning on time!`;
    
    await Notification.create({
      memberId: member._id,
      title: 'Book Returned',
      message: notificationMessage,
      type: fine > 0 ? 'fine' : 'general',
      relatedType: 'transaction',
      relatedId: transaction._id
    });

    // Create admin notification for book return
    await AdminNotification.create({
      title: fine > 0 ? 'Book Returned - Fine Applied' : 'Book Returned',
      message: fine > 0 
        ? `"${book.title}" returned by ${member.name} (${member.memberId}). ${daysLate} day(s) late. Fine: Rs. ${fine.toFixed(2)}`
        : `"${book.title}" returned by ${member.name} (${member.memberId}) on time.`,
      type: fine > 0 ? 'fine_alert' : 'general'
    });

    // Populate for response
    await transaction.populate([
      { path: 'returnedBy', select: 'name' }
    ]);

    res.json({
      success: true,
      message: fine > 0 ? `Book returned with fine of Rs ${fine}` : 'Book returned successfully',
      data: {
        transaction,
        fine
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Renew book
// @route   POST /api/transactions/renew
// @access  Private
const renewBook = async (req, res, next) => {
  try {
    const { transactionId } = req.body;

    if (!transactionId) {
      return res.status(400).json({
        success: false,
        message: 'Transaction ID is required'
      });
    }

    const transaction = await Transaction.findById(transactionId)
      .populate('memberId');

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    if (transaction.status !== 'Issued') {
      return res.status(400).json({
        success: false,
        message: 'Only issued books can be renewed'
      });
    }

    // Check if renewal limit reached
    if (transaction.renewCount >= transaction.maxRenewals) {
      return res.status(400).json({
        success: false,
        message: `Maximum renewal limit (${transaction.maxRenewals}) reached`
      });
    }

    // Check if book is overdue
    if (new Date() > transaction.dueDate) {
      return res.status(400).json({
        success: false,
        message: 'Cannot renew overdue books. Please return and re-issue.'
      });
    }

    // Check for unpaid fines
    const unpaidFines = await Fine.countDocuments({
      memberId: transaction.memberId._id,
      isPaid: false
    });

    if (unpaidFines > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot renew. Member has unpaid fines.'
      });
    }

    // Get renewal period from settings
    const settings = await Settings.getSettings();
    const renewalPeriod = settings.renewalSettings.renewalPeriod || 7;

    // Extend due date
    const newDueDate = new Date(transaction.dueDate);
    newDueDate.setDate(newDueDate.getDate() + renewalPeriod);

    transaction.dueDate = newDueDate;
    transaction.renewCount += 1;
    await transaction.save();

    await transaction.populate([
      { path: 'bookId', select: 'title author' },
      { path: 'memberId', select: 'name memberId' }
    ]);

    res.json({
      success: true,
      message: 'Book renewed successfully',
      data: transaction
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all transactions
// @route   GET /api/transactions
// @access  Private
const getTransactions = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      memberId,
      bookId,
      startDate,
      endDate,
      sortBy = '-issueDate'
    } = req.query;

    const query = {};

    if (status) {
      query.status = status;
    }

    if (memberId) {
      query.memberId = memberId;
    }

    if (bookId) {
      query.bookId = bookId;
    }

    if (startDate || endDate) {
      query.issueDate = {};
      if (startDate) query.issueDate.$gte = new Date(startDate);
      if (endDate) query.issueDate.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;

    const transactions = await Transaction.find(query)
      .populate('bookId', 'title author accessionNumber')
      .populate('memberId', 'name memberId memberType')
      .populate('issuedBy', 'name')
      .populate('returnedBy', 'name')
      .sort(sortBy)
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Transaction.countDocuments(query);

    res.json({
      success: true,
      data: transactions,
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

// @desc    Get all currently issued books
// @route   GET /api/transactions/issued
// @access  Private
const getIssuedBooks = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, memberId } = req.query;
    const skip = (page - 1) * limit;

    let query = { status: { $in: ['Issued', 'Overdue'] } };

    // If student is making the request, filter by their ID
    if (req.student) {
      query.memberId = req.student._id;
    } else if (memberId) {
      // Librarian can filter by memberId
      query.memberId = memberId;
    }

    // First, get all transactions to filter by search
    let transactions = await Transaction.find(query)
      .populate('bookId', 'title author accessionNumber category')
      .populate('memberId', 'name memberId memberType phone')
      .populate('issuedBy', 'name')
      .sort('dueDate');

    // Update overdue status
    const now = new Date();
    for (let transaction of transactions) {
      if (transaction.status === 'Issued' && now > transaction.dueDate) {
        transaction.status = 'Overdue';
        await transaction.save();
      }
    }

    // Apply search filter if provided
    if (search) {
      const searchLower = search.toLowerCase();
      transactions = transactions.filter(transaction => {
        const bookTitle = transaction.bookId?.title?.toLowerCase() || '';
        const bookAuthor = transaction.bookId?.author?.toLowerCase() || '';
        const accessionNumber = transaction.accessionNumber?.toLowerCase() || '';
        const memberName = transaction.memberId?.name?.toLowerCase() || '';
        const memberId = transaction.memberId?.memberId?.toLowerCase() || '';
        
        return bookTitle.includes(searchLower) ||
               bookAuthor.includes(searchLower) ||
               accessionNumber.includes(searchLower) ||
               memberName.includes(searchLower) ||
               memberId.includes(searchLower);
      });
    }

    // Apply pagination after filtering
    const total = transactions.length;
    const paginatedTransactions = transactions.slice(skip, skip + parseInt(limit));

    res.json({
      success: true,
      data: paginatedTransactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single transaction
// @route   GET /api/transactions/:id
// @access  Private
const getTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate('bookId')
      .populate('memberId')
      .populate('issuedBy', 'name')
      .populate('returnedBy', 'name');

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    res.json({
      success: true,
      data: transaction
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  issueBook,
  returnBook,
  renewBook,
  getTransactions,
  getIssuedBooks,
  getTransaction
};
