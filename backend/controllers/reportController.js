const Book = require('../models/Book');
const Member = require('../models/Member');
const Transaction = require('../models/Transaction');
const Fine = require('../models/Fine');
const Reservation = require('../models/Reservation');
const OverdueService = require('../services/overdueService');

// @desc    Reset all data (fines, reservations, transactions)
// @route   DELETE /api/reports/reset-data
// @access  Private (Admin only)
const resetAllData = async (req, res, next) => {
  try {
    // Delete all fines
    await Fine.deleteMany({});
    
    // Delete all reservations
    await Reservation.deleteMany({});
    
    // Delete all transactions
    await Transaction.deleteMany({});
    
    // Update all books to Available status
    await Book.updateMany({}, { 
      status: 'Available',
      issuedTo: null,
      dueDate: null 
    });
    
    // Reset all members' borrowed books count
    await Member.updateMany({}, { 
      currentBorrowedBooks: 0,
      isBlocked: false 
    });

    res.json({
      success: true,
      message: 'All data has been reset successfully',
      deleted: {
        fines: true,
        reservations: true,
        transactions: true
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get dashboard statistics
// @route   GET /api/reports/dashboard
// @access  Private
const getDashboardStats = async (req, res, next) => {
  try {
    // Book statistics
    const totalBooks = await Book.countDocuments();
    const availableBooks = await Book.countDocuments({ status: 'Available' });
    const issuedBooks = await Transaction.countDocuments({ 
      status: { $in: ['Issued', 'Overdue'] } 
    });

    // Member statistics (only approved members with completed profiles)
    const totalMembers = await Member.countDocuments({
      registrationStatus: 'approved',
      profileCompleted: true
    });
    const activeMembers = await Member.countDocuments({ 
      registrationStatus: 'approved',
      profileCompleted: true,
      currentBorrowedBooks: { $gt: 0 } 
    });
    const blockedMembers = await Member.countDocuments({ 
      registrationStatus: 'approved',
      profileCompleted: true,
      isBlocked: true 
    });

    // Overdue books
    const overdueBooks = await Transaction.countDocuments({ 
      status: 'Overdue' 
    });

    // Today's transactions
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayIssued = await Transaction.countDocuments({
      issueDate: { $gte: today, $lt: tomorrow }
    });

    const todayReturned = await Transaction.countDocuments({
      returnDate: { $gte: today, $lt: tomorrow },
      status: 'Returned'
    });

    // Fine statistics
    const fineStats = await Fine.aggregate([
      {
        $group: {
          _id: null,
          totalFines: { $sum: '$amount' },
          collected: { $sum: '$paidAmount' },
          outstanding: { 
            $sum: { 
              $subtract: [
                '$amount', 
                { $add: ['$paidAmount', '$waivedAmount'] }
              ] 
            } 
          }
        }
      }
    ]);

    const fines = fineStats[0] || { totalFines: 0, collected: 0, outstanding: 0 };

    // Recent transactions
    const recentTransactions = await Transaction.find()
      .populate('bookId', 'title author')
      .populate('memberId', 'name memberId')
      .populate('issuedBy', 'name')
      .sort('-issueDate')
      .limit(10);

    // Borrowing trend (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const borrowingTrend = await Transaction.aggregate([
      {
        $match: {
          issueDate: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$issueDate' } },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Popular categories
    const popularCategories = await Transaction.aggregate([
      {
        $match: {
          issueDate: { $gte: sevenDaysAgo }
        }
      },
      {
        $lookup: {
          from: 'books',
          localField: 'bookId',
          foreignField: '_id',
          as: 'book'
        }
      },
      {
        $unwind: '$book'
      },
      {
        $group: {
          _id: '$book.category',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 5
      }
    ]);

    // Pending reservations
    const pendingReservations = await Reservation.countDocuments({ 
      status: 'Pending' 
    });

    res.json({
      success: true,
      data: {
        books: {
          total: totalBooks,
          available: availableBooks,
          issued: issuedBooks
        },
        members: {
          total: totalMembers,
          active: activeMembers,
          blocked: blockedMembers
        },
        overdueBooks,
        today: {
          issued: todayIssued,
          returned: todayReturned
        },
        fines,
        recentTransactions,
        borrowingTrend,
        popularCategories,
        pendingReservations
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get overdue books report
// @route   GET /api/reports/overdue
// @access  Private
const getOverdueReport = async (req, res, next) => {
  try {
    const overdueTransactions = await Transaction.find({ 
      status: 'Overdue' 
    })
      .populate('bookId', 'title author accessionNumber')
      .populate('memberId', 'name memberId phone email department')
      .populate('issuedBy', 'name')
      .sort('dueDate');

    // Calculate fines for each
    const transactionsWithFines = overdueTransactions.map(transaction => {
      const daysOverdue = Math.ceil(
        (new Date() - new Date(transaction.dueDate)) / (1000 * 60 * 60 * 24)
      );
      const calculatedFine = transaction.calculateFine();
      
      return {
        ...transaction.toObject(),
        daysOverdue,
        calculatedFine
      };
    });

    res.json({
      success: true,
      data: transactionsWithFines,
      count: transactionsWithFines.length
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get popular books report
// @route   GET /api/reports/popular-books
// @access  Private
const getPopularBooksReport = async (req, res, next) => {
  try {
    const { startDate, endDate, limit = 20 } = req.query;

    const matchQuery = {};
    if (startDate || endDate) {
      matchQuery.issueDate = {};
      if (startDate) matchQuery.issueDate.$gte = new Date(startDate);
      if (endDate) matchQuery.issueDate.$lte = new Date(endDate);
    }

    const popularBooks = await Transaction.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$bookId',
          issueCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'books',
          localField: '_id',
          foreignField: '_id',
          as: 'book'
        }
      },
      {
        $unwind: '$book'
      },
      {
        $project: {
          title: '$book.title',
          author: '$book.author',
          category: '$book.category',
          accessionNumber: '$book.accessionNumber',
          issueCount: 1
        }
      },
      {
        $sort: { issueCount: -1 }
      },
      {
        $limit: parseInt(limit)
      }
    ]);

    res.json({
      success: true,
      data: popularBooks
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get transactions report
// @route   GET /api/reports/transactions
// @access  Private
const getTransactionsReport = async (req, res, next) => {
  try {
    const { startDate, endDate, status, department } = req.query;

    const matchQuery = {};
    
    if (startDate || endDate) {
      matchQuery.issueDate = {};
      if (startDate) matchQuery.issueDate.$gte = new Date(startDate);
      if (endDate) matchQuery.issueDate.$lte = new Date(endDate);
    }

    if (status) {
      matchQuery.status = status;
    }

    let transactions = await Transaction.find(matchQuery)
      .populate('bookId', 'title author category')
      .populate('memberId', 'name memberId department memberType')
      .populate('issuedBy', 'name')
      .populate('returnedBy', 'name')
      .sort('-issueDate');

    // Filter by department if specified
    if (department) {
      transactions = transactions.filter(t => 
        t.memberId && t.memberId.department === department
      );
    }

    // Summary statistics
    const summary = {
      totalTransactions: transactions.length,
      issued: transactions.filter(t => t.status === 'Issued').length,
      returned: transactions.filter(t => t.status === 'Returned').length,
      overdue: transactions.filter(t => t.status === 'Overdue').length,
      totalFines: transactions.reduce((sum, t) => sum + (t.fine || 0), 0)
    };

    res.json({
      success: true,
      data: transactions,
      summary
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get member activity report
// @route   GET /api/reports/member-activity
// @access  Private
const getMemberActivityReport = async (req, res, next) => {
  try {
    const { startDate, endDate, memberType, department } = req.query;

    const matchQuery = {};
    
    if (startDate || endDate) {
      matchQuery.issueDate = {};
      if (startDate) matchQuery.issueDate.$gte = new Date(startDate);
      if (endDate) matchQuery.issueDate.$lte = new Date(endDate);
    }

    const memberActivity = await Transaction.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$memberId',
          totalBorrowed: { $sum: 1 },
          currentlyBorrowed: {
            $sum: {
              $cond: [
                { $in: ['$status', ['Issued', 'Overdue']] },
                1,
                0
              ]
            }
          },
          overdue: {
            $sum: {
              $cond: [{ $eq: ['$status', 'Overdue'] }, 1, 0]
            }
          }
        }
      },
      {
        $lookup: {
          from: 'members',
          localField: '_id',
          foreignField: '_id',
          as: 'member'
        }
      },
      {
        $unwind: '$member'
      },
      {
        $project: {
          name: '$member.name',
          memberId: '$member.memberId',
          memberType: '$member.memberType',
          department: '$member.department',
          totalBorrowed: 1,
          currentlyBorrowed: 1,
          overdue: 1
        }
      },
      {
        $sort: { totalBorrowed: -1 }
      }
    ]);

    // Filter by memberType and department if specified
    let filteredActivity = memberActivity;
    if (memberType) {
      filteredActivity = filteredActivity.filter(m => m.memberType === memberType);
    }
    if (department) {
      filteredActivity = filteredActivity.filter(m => m.department === department);
    }

    res.json({
      success: true,
      data: filteredActivity
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get fine collection report
// @route   GET /api/reports/fine-collection
// @access  Private
const getFineCollectionReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const matchQuery = {};
    
    if (startDate || endDate) {
      matchQuery.paidDate = {};
      if (startDate) matchQuery.paidDate.$gte = new Date(startDate);
      if (endDate) matchQuery.paidDate.$lte = new Date(endDate);
    }

    const fineCollection = await Fine.find(matchQuery)
      .populate('memberId', 'name memberId department')
      .populate('bookId', 'title author')
      .populate('collectedBy', 'name')
      .sort('-paidDate');

    // Summary
    const summary = {
      totalFines: fineCollection.reduce((sum, f) => sum + f.amount, 0),
      collected: fineCollection.reduce((sum, f) => sum + f.paidAmount, 0),
      waived: fineCollection.reduce((sum, f) => sum + f.waivedAmount, 0),
      outstanding: fineCollection.reduce((sum, f) => 
        sum + (f.amount - f.paidAmount - f.waivedAmount), 0
      ),
      count: fineCollection.length
    };

    // Collection by payment method
    const byPaymentMethod = fineCollection.reduce((acc, fine) => {
      if (fine.paymentMethod) {
        acc[fine.paymentMethod] = (acc[fine.paymentMethod] || 0) + fine.paidAmount;
      }
      return acc;
    }, {});

    res.json({
      success: true,
      data: fineCollection,
      summary,
      byPaymentMethod
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Generate overdue fines manually
// @route   POST /api/reports/generate-overdue-fines
// @access  Private
const generateOverdueFines = async (req, res, next) => {
  try {
    const result = await OverdueService.generateOverdueFines();
    
    res.json({
      success: true,
      message: 'Overdue fines generation completed',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  getOverdueReport,
  getPopularBooksReport,
  getTransactionsReport,
  getMemberActivityReport,
  getFineCollectionReport,
  generateOverdueFines,
  resetAllData
};
