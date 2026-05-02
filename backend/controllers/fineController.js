const Fine = require('../models/Fine');
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');
const AdminNotification = require('../models/AdminNotification');

// @desc    Get all fines
// @route   GET /api/fines
// @access  Private
const getFines = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      isPaid, 
      memberId,
      startDate,
      endDate 
    } = req.query;
    
    const skip = (page - 1) * limit;

    const query = {};
    if (isPaid !== undefined) query.isPaid = isPaid === 'true';
    if (memberId) query.memberId = memberId;
    
    if (startDate || endDate) {
      query.createdDate = {};
      if (startDate) query.createdDate.$gte = new Date(startDate);
      if (endDate) query.createdDate.$lte = new Date(endDate);
    }

    const fines = await Fine.find(query)
      .populate('memberId', 'name memberId phone email')
      .populate('bookId', 'title author accessionNumber')
      .populate('transactionId', 'issueDate dueDate returnDate')
      .populate('collectedBy', 'name')
      .populate('waivedBy', 'name')
      .sort('-createdDate')
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Fine.countDocuments(query);

    res.json({
      success: true,
      data: fines,
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

// @desc    Get fines for a specific member
// @route   GET /api/fines/member/:memberId
// @access  Private
const getMemberFines = async (req, res, next) => {
  try {
    let memberId = req.params.memberId;
    
    // If student is making the request, use their ID
    if (req.student) {
      memberId = req.student._id;
    }
    
    const fines = await Fine.find({ memberId })
      .populate('bookId', 'title author')
      .populate('transactionId', 'issueDate dueDate returnDate')
      .sort('-createdDate');

    const totalFines = fines.reduce((sum, fine) => sum + fine.amount, 0);
    const paidFines = fines.reduce((sum, fine) => sum + fine.paidAmount, 0);
    const waivedFines = fines.reduce((sum, fine) => sum + fine.waivedAmount, 0);
    const outstanding = totalFines - paidFines - waivedFines;

    res.json({
      success: true,
      data: fines,
      summary: {
        totalFines,
        paidFines,
        waivedFines,
        outstanding,
        count: fines.length
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Pay fine
// @route   POST /api/fines/payment
// @access  Private
const payFine = async (req, res, next) => {
  try {
    const { fineId, amount, paymentMethod } = req.body;

    if (!fineId || !amount || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Fine ID, amount, and payment method are required'
      });
    }

    const fine = await Fine.findById(fineId);

    if (!fine) {
      return res.status(404).json({
        success: false,
        message: 'Fine not found'
      });
    }

    if (fine.isPaid) {
      return res.status(400).json({
        success: false,
        message: 'Fine already paid'
      });
    }

    const outstanding = fine.amount - fine.paidAmount - fine.waivedAmount;

    // Enforce full payment only - no partial payments allowed
    if (amount !== outstanding) {
      return res.status(400).json({
        success: false,
        message: `Full payment required. Outstanding amount is Rs ${outstanding}`
      });
    }

    // Generate receipt number
    const receiptNumber = `RCP${Date.now()}${Math.floor(Math.random() * 1000)}`;

    await fine.markAsPaid(amount, paymentMethod, req.user.id, receiptNumber);

    // Update transaction fine status
    await Transaction.findByIdAndUpdate(fine.transactionId, {
      finePaid: fine.isPaid
    });

    await fine.populate([
      { path: 'memberId', select: 'name memberId' },
      { path: 'bookId', select: 'title author' },
      { path: 'collectedBy', select: 'name' }
    ]);

    // Create admin notification for fine payment
    await AdminNotification.create({
      title: 'Fine Paid',
      message: `${fine.memberId.name} (${fine.memberId.memberId}) paid Rs. ${amount.toFixed(2)} for "${fine.bookId.title}". Receipt: ${receiptNumber}`,
      type: 'fine_alert'
    });

    res.json({
      success: true,
      message: 'Payment recorded successfully',
      data: fine
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Waive fine
// @route   PATCH /api/fines/:id/waive
// @access  Private
const waiveFine = async (req, res, next) => {
  try {
    const { amount, reason } = req.body;

    if (!amount || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Amount and reason are required'
      });
    }

    const fine = await Fine.findById(req.params.id);

    if (!fine) {
      return res.status(404).json({
        success: false,
        message: 'Fine not found'
      });
    }

    const outstanding = fine.amount - fine.paidAmount - fine.waivedAmount;

    if (amount > outstanding) {
      return res.status(400).json({
        success: false,
        message: `Waiver amount exceeds outstanding fine (Rs ${outstanding})`
      });
    }

    await fine.waiveFine(amount, reason, req.user.id);

    // Update transaction fine status
    await Transaction.findByIdAndUpdate(fine.transactionId, {
      fineWaived: true,
      finePaid: fine.isPaid
    });

    await fine.populate([
      { path: 'memberId', select: 'name memberId' },
      { path: 'bookId', select: 'title author' },
      { path: 'waivedBy', select: 'name' }
    ]);

    // Create admin notification for fine waiver
    await AdminNotification.create({
      title: 'Fine Waived',
      message: `Rs. ${amount.toFixed(2)} waived for ${fine.memberId.name} (${fine.memberId.memberId}) - "${fine.bookId.title}". Reason: ${reason}`,
      type: 'fine_alert'
    });

    res.json({
      success: true,
      message: 'Fine waived successfully',
      data: fine
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get fine statistics
// @route   GET /api/fines/stats
// @access  Private
const getFineStats = async (req, res, next) => {
  try {
    const totalFines = await Fine.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
          collected: { $sum: '$paidAmount' },
          waived: { $sum: '$waivedAmount' }
        }
      }
    ]);

    const unpaidCount = await Fine.countDocuments({ isPaid: false });
    const paidCount = await Fine.countDocuments({ isPaid: true });

    const stats = totalFines[0] || { total: 0, collected: 0, waived: 0 };
    const outstanding = stats.total - stats.collected - stats.waived;

    res.json({
      success: true,
      data: {
        totalFines: stats.total,
        collected: stats.collected,
        waived: stats.waived,
        outstanding,
        unpaidCount,
        paidCount
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Notify member about fine
// @route   POST /api/fines/:id/notify
// @access  Private
const notifyFine = async (req, res, next) => {
  try {
    const fine = await Fine.findById(req.params.id)
      .populate('memberId', 'name email phone')
      .populate('bookId', 'title author');

    if (!fine) {
      return res.status(404).json({
        success: false,
        message: 'Fine not found'
      });
    }

    if (fine.isPaid) {
      return res.status(400).json({
        success: false,
        message: 'This fine has already been paid'
      });
    }

    const outstanding = fine.amount - fine.paidAmount - fine.waivedAmount;

    // Create notification for the member
    await Notification.create({
      memberId: fine.memberId._id,
      title: 'Outstanding Fine Payment Reminder',
      message: `You have an outstanding fine of Rs ${outstanding.toFixed(2)} for the book "${fine.bookId.title}" by ${fine.bookId.author}. Please visit the library to clear your fine. Reason: ${fine.reason}`,
      type: 'fine',
      relatedId: fine._id,
      relatedType: 'fine'
    });

    res.json({
      success: true,
      message: 'Member notified successfully about the fine'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getFines,
  getMemberFines,
  payFine,
  waiveFine,
  getFineStats,
  notifyFine
};
