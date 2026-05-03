const Reservation = require('../models/Reservation');
const Book = require('../models/Book');
const Member = require('../models/Member');
const Notification = require('../models/Notification');
const AdminNotification = require('../models/AdminNotification');

// @desc    Get all reservations
// @route   GET /api/reservations
// @access  Private
const getReservations = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, bookId, memberId } = req.query;
    const skip = (page - 1) * limit;

    const query = {};
    
    // If student is making the request, filter by their ID
    if (req.student) {
      query.memberId = req.student._id;
    } else {
      // Librarian can filter by memberId if provided
      if (memberId) query.memberId = memberId;
    }
    
    if (status) query.status = status;
    if (bookId) query.bookId = bookId;

    const reservations = await Reservation.find(query)
      .populate('bookId', 'title author accessionNumber')
      .populate('memberId', 'name memberId phone email')
      .populate('createdBy', 'name')
      .sort('-reservationDate')
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Reservation.countDocuments(query);

    res.json({
      success: true,
      data: reservations,
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

// @desc    Create reservation
// @route   POST /api/reservations
// @access  Private
const createReservation = async (req, res, next) => {
  try {
    let { bookId, memberId, notes } = req.body;

    // If student is making the request, use their ID
    if (req.student) {
      memberId = req.student._id;
    }

    // Check if book exists
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    // Check if member exists
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
        message: 'Member is blocked'
      });
    }

    // Check if book is available
    const isBookAvailable = book.availableCopies > 0;

    // If student is requesting and book is available, they should visit library instead
    if (req.student && isBookAvailable) {
      return res.status(400).json({
        success: false,
        message: 'This book is currently available in the library. Please visit the library to issue it directly.'
      });
    }

    // Check for existing active reservation
    const existingReservation = await Reservation.findOne({
      bookId,
      memberId,
      status: { $in: ['Pending', 'Notified', 'Active'] }
    });

    if (existingReservation) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active reservation for this book'
      });
    }

    // Get next priority number
    const lastReservation = await Reservation.findOne({ 
      bookId, 
      status: 'Pending' 
    }).sort('-priority');
    
    const priority = lastReservation ? lastReservation.priority + 1 : 1;

    // Determine initial status: Always 'Pending' for student requests as per user requirement
    // Librarians can create 'Active' reservations directly
    const initialStatus = req.student ? 'Pending' : (isBookAvailable ? 'Active' : 'Pending');

    const reservation = await Reservation.create({
      bookId,
      memberId,
      notes,
      priority,
      status: initialStatus,
      createdBy: req.user?.id || req.student?._id
    });

    await reservation.populate([
      { path: 'bookId', select: 'title author' },
      { path: 'memberId', select: 'name memberId' }
    ]);

    // Create admin notification for new reservation
    await AdminNotification.create({
      title: 'New Book Reservation',
      message: `${reservation.memberId.name} (${reservation.memberId.memberId}) has reserved "${reservation.bookId.title}" by ${reservation.bookId.author}. Status: ${initialStatus}`,
      type: 'reservation'
    });

    res.status(201).json({
      success: true,
      message: isBookAvailable 
        ? 'Reservation created successfully' 
        : 'Reservation request sent for admin approval',
      data: reservation
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete/Cancel reservation
// @route   DELETE /api/reservations/:id
// @access  Private
const deleteReservation = async (req, res, next) => {
  try {
    const reservation = await Reservation.findById(req.params.id);

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Reservation not found'
      });
    }

    if (reservation.status === 'Fulfilled') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete fulfilled reservation'
      });
    }

    reservation.status = 'Cancelled';
    await reservation.save();

    res.json({
      success: true,
      message: 'Reservation cancelled successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Notify member about available book
// @route   PATCH /api/reservations/:id/notify
// @access  Private
const notifyReservation = async (req, res, next) => {
  try {
    const Notification = require('../models/Notification');
    const reservation = await Reservation.findById(req.params.id)
      .populate('memberId', 'name email phone')
      .populate('bookId', 'title author');

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Reservation not found'
      });
    }

    if (reservation.status !== 'Pending' && reservation.status !== 'Active') {
      return res.status(400).json({
        success: false,
        message: 'Can only notify pending or active reservations'
      });
    }

    reservation.status = 'Notified';
    reservation.notifiedDate = new Date();
    await reservation.save();

    // Create notification for the member
    await Notification.create({
      memberId: reservation.memberId._id,
      title: 'Book Available for Collection',
      message: `Good news! The book "${reservation.bookId.title}" by ${reservation.bookId.author} is now available for issue. Please visit the library to borrow the book.`,
      type: 'reservation',
      relatedId: reservation._id,
      relatedType: 'reservation'
    });

    // Here you can add email/SMS notification logic
    // await sendNotificationEmail(reservation.memberId.email, reservation.bookId.title);

    res.json({
      success: true,
      message: 'Member notified successfully',
      data: reservation
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark reservation as fulfilled
// @route   PATCH /api/reservations/:id/fulfill
// @access  Private
const fulfillReservation = async (req, res, next) => {
  try {
    const reservation = await Reservation.findById(req.params.id);

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Reservation not found'
      });
    }

    reservation.status = 'Fulfilled';
    reservation.fulfilledDate = new Date();
    await reservation.save();

    res.json({
      success: true,
      message: 'Reservation marked as fulfilled',
      data: reservation
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve reservation request
// @route   PATCH /api/reservations/:id/approve
// @access  Private (Admin/Librarian)
const approveReservation = async (req, res, next) => {
  try {
    const reservation = await Reservation.findById(req.params.id)
      .populate('bookId', 'title author')
      .populate('memberId', 'name memberId');

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Reservation not found'
      });
    }

    if (reservation.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: 'Can only approve pending reservations'
      });
    }

    reservation.status = 'Active';
    await reservation.save();

    // Create notification for approved reservation
    await Notification.create({
      memberId: reservation.memberId._id,
      title: 'Reservation Approved',
      message: `Your reservation request for "${reservation.bookId.title}" by ${reservation.bookId.author} has been approved. We will notify you when the book becomes available.`,
      type: 'reservation',
      relatedId: reservation._id,
      relatedType: 'reservation'
    });

    // Create admin notification for approved reservation
    await AdminNotification.create({
      title: 'Reservation Approved',
      message: `Reservation for "${reservation.bookId.title}" by ${reservation.memberId.name} has been approved.`,
      type: 'reservation'
    });

    res.json({
      success: true,
      message: 'Reservation approved successfully',
      data: reservation
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reject reservation request
// @route   PATCH /api/reservations/:id/reject
// @access  Private (Admin/Librarian)
const rejectReservation = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const reservation = await Reservation.findById(req.params.id)
      .populate('bookId', 'title author')
      .populate('memberId', 'name memberId');

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Reservation not found'
      });
    }

    if (reservation.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: 'Can only reject pending reservations'
      });
    }

    reservation.status = 'Cancelled';
    if (reason) {
      reservation.notes = reservation.notes 
        ? `${reservation.notes}\nRejection Reason: ${reason}` 
        : `Rejection Reason: ${reason}`;
    }
    await reservation.save();

    // Create notification for rejected reservation
    const rejectionMessage = reason 
      ? `Your reservation request for "${reservation.bookId.title}" by ${reservation.bookId.author} has been rejected. Reason: ${reason}`
      : `Your reservation request for "${reservation.bookId.title}" by ${reservation.bookId.author} has been rejected. Please contact the library for more information.`;
    
    await Notification.create({
      memberId: reservation.memberId._id,
      title: 'Reservation Rejected',
      message: rejectionMessage,
      type: 'reservation',
      relatedId: reservation._id,
      relatedType: 'reservation'
    });

    res.json({
      success: true,
      message: 'Reservation rejected successfully',
      data: reservation
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getReservations,
  createReservation,
  deleteReservation,
  notifyReservation,
  fulfillReservation,
  approveReservation,
  rejectReservation
};
