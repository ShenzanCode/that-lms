const Member = require('../models/Member');
const Transaction = require('../models/Transaction');
const Fine = require('../models/Fine');
const Settings = require('../models/Settings');
const AdminNotification = require('../models/AdminNotification');
const { generateMemberId } = require('../utils/helpers');
const { uploadImageBuffer } = require('../utils/cloudinary');

// @desc    Get all members with filtering, sorting, pagination
// @route   GET /api/members
// @access  Private
const getMembers = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      memberType,
      department,
      isBlocked,
      status,
      sortBy = '-createdAt'
    } = req.query;

    // Build query
    const query = {};

    // Only show approved members with completed profiles in the main members list
    // Exclude pending/rejected students - they should only appear in the pending approvals list
    query.registrationStatus = 'approved';
    query.profileCompleted = true;

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { memberId: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    if (memberType) {
      query.memberType = memberType;
    }

    if (department) {
      query.department = { $regex: department, $options: 'i' };
    }

    if (isBlocked !== undefined && isBlocked !== '') {
      query.isBlocked = isBlocked === 'true';
    }

    // Filter by status (active/available/blocked)
    if (status && status !== '') {
      if (status === 'active') {
        query.isBlocked = false;
        query.currentBorrowedBooks = { $gt: 0 };
      } else if (status === 'available') {
        query.isBlocked = false;
        query.currentBorrowedBooks = 0;
      } else if (status === 'blocked') {
        query.isBlocked = true;
      }
    }

    // Execute query with pagination
    const skip = (page - 1) * limit;
    
    const members = await Member.find(query)
      .sort(sortBy)
      .limit(parseInt(limit))
      .skip(skip)
      .populate('createdBy', 'name username');

    const total = await Member.countDocuments(query);

    res.json({
      success: true,
      data: members,
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

// @desc    Get single member
// @route   GET /api/members/:id
// @access  Private
const getMember = async (req, res, next) => {
  try {
    const member = await Member.findById(req.params.id)
      .populate('createdBy', 'name username');

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }

    // Get current borrowed books
    const currentBooks = await Transaction.find({
      memberId: member._id,
      status: { $in: ['Issued', 'Overdue'] }
    }).populate('bookId', 'title author accessionNumber');

    // Get outstanding fines
    const outstandingFines = await Fine.find({
      memberId: member._id,
      isPaid: false
    }).populate('bookId', 'title');

    const totalOutstanding = outstandingFines.reduce((sum, fine) => 
      sum + (fine.amount - fine.paidAmount - fine.waivedAmount), 0
    );

    res.json({
      success: true,
      data: {
        ...member.toObject(),
        currentBooks,
        outstandingFines,
        totalOutstanding
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new member
// @route   POST /api/members
// @access  Private
const createMember = async (req, res, next) => {
  try {
    const memberData = { ...req.body };

    // Get settings to determine borrowing limit
    const settings = await Settings.getSettings();
    const memberType = memberData.memberType.toLowerCase();
    memberData.borrowingLimit = settings.borrowingLimits[memberType] || 3;

    // Add photo if uploaded
    if (req.file) {
      const uploadedPhoto = await uploadImageBuffer(req.file, 'library-management/member-photos');
      memberData.photo = uploadedPhoto.secure_url;
    }

    // Generate member ID if not provided
    if (!memberData.memberId) {
      memberData.memberId = generateMemberId(
        memberData.memberType,
        memberData.department
      );
    }

    // Set validity date if not provided (1 year from now)
    if (!memberData.validUntil) {
      const validUntil = new Date();
      validUntil.setFullYear(validUntil.getFullYear() + 1);
      memberData.validUntil = validUntil;
    }

    // Set created by
    memberData.createdBy = req.user.id;

    const member = await Member.create(memberData);

    res.status(201).json({
      success: true,
      message: 'Member created successfully',
      data: member
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update member
// @route   PUT /api/members/:id
// @access  Private
const updateMember = async (req, res, next) => {
  try {
    let member = await Member.findById(req.params.id);

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }

    const updateData = { ...req.body };

    // Check if member type is changing and update borrowing limit accordingly
    if (updateData.memberType && updateData.memberType !== member.memberType) {
      const Settings = require('../models/Settings');
      const settings = await Settings.getSettings();
      const memberType = updateData.memberType.toLowerCase();
      const oldBorrowingLimit = member.borrowingLimit;
      updateData.borrowingLimit = settings.borrowingLimits[memberType] || 3;
      
      console.log(`📝 Member type changed from ${member.memberType} to ${updateData.memberType}, updating borrowing limit from ${oldBorrowingLimit} to ${updateData.borrowingLimit}`);
    } else if (updateData.memberType && updateData.memberType === member.memberType) {
      // Same member type - ensure borrowing limit is in sync with current settings
      const Settings = require('../models/Settings');
      const settings = await Settings.getSettings();
      const memberType = member.memberType.toLowerCase();
      const expectedLimit = settings.borrowingLimits[memberType] || 3;
      
      if (member.borrowingLimit !== expectedLimit) {
        updateData.borrowingLimit = expectedLimit;
        console.log(`🔄 Syncing borrowing limit for ${member.memberType} from ${member.borrowingLimit} to ${expectedLimit}`);
      } else {
        // Remove borrowing limit from update if no sync needed
        delete updateData.borrowingLimit;
      }
    } else {
      // Prevent manual borrowing limit updates (only allow when member type changes or sync needed)
      delete updateData.borrowingLimit;
    }

    // Handle photo removal
    if (req.body.removePhoto === 'true') {
      updateData.photo = null;
    }
    // Add new photo if uploaded
    else if (req.file) {
      const uploadedPhoto = await uploadImageBuffer(req.file, 'library-management/member-photos');
      updateData.photo = uploadedPhoto.secure_url;
    }

    // Remove the removePhoto flag from updateData
    delete updateData.removePhoto;

    member = await Member.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Member updated successfully',
      data: member
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Check member status (active books, unpaid fines)
// @route   GET /api/members/:id/status
// @access  Private
const checkMemberStatus = async (req, res, next) => {
  try {
    const member = await Member.findById(req.params.id);

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }

    // Get active transactions with book details
    const activeTransactions = await Transaction.find({
      memberId: member._id,
      status: { $in: ['Issued', 'Overdue'] }
    }).populate('bookId', 'title isbn');

    // Get unpaid fines
    const unpaidFines = await Fine.find({
      memberId: member._id,
      isPaid: false
    });

    const totalUnpaidAmount = unpaidFines.reduce((sum, fine) => sum + fine.amount, 0);

    res.json({
      success: true,
      data: {
        hasActiveBooks: activeTransactions.length > 0,
        activeBookCount: activeTransactions.length,
        activeBooks: activeTransactions.map(t => ({
          title: t.bookId?.title || 'Unknown',
          isbn: t.bookId?.isbn || 'N/A',
          status: t.status,
          issueDate: t.issueDate,
          dueDate: t.dueDate
        })),
        hasUnpaidFines: unpaidFines.length > 0,
        unpaidFineCount: unpaidFines.length,
        totalUnpaidAmount
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete member
// @route   DELETE /api/members/:id
// @access  Private
const deleteMember = async (req, res, next) => {
  try {
    const { force } = req.query; // Allow force delete with query parameter
    const member = await Member.findById(req.params.id);

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }

    // Check if member has active borrows (only if not forced)
    if (force !== 'true') {
      const activeTransactions = await Transaction.countDocuments({
        memberId: member._id,
        status: { $in: ['Issued', 'Overdue'] }
      });

      if (activeTransactions > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete member with active book issues'
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
          message: 'Cannot delete member with unpaid fines'
        });
      }
    }

    // If forced, we proceed with deletion even with active books
    // You might want to handle active transactions here (e.g., mark as lost, auto-return, etc.)
    if (force === 'true') {
      // Return all active books automatically or mark them as lost
      await Transaction.updateMany(
        {
          memberId: member._id,
          status: { $in: ['Issued', 'Overdue'] }
        },
        {
          status: 'Returned',
          returnDate: new Date(),
          actualReturnDate: new Date()
        }
      );

      // Optionally handle unpaid fines (could mark as waived or keep them)
      await Fine.updateMany(
        {
          memberId: member._id,
          isPaid: false
        },
        {
          isPaid: true,
          paidAmount: 0,
          paymentDate: new Date(),
          notes: 'Fine waived due to member deletion'
        }
      );
    }

    await member.deleteOne();

    res.json({
      success: true,
      message: 'Member deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Block member
// @route   PATCH /api/members/:id/block
// @access  Private
const blockMember = async (req, res, next) => {
  try {
    const { reason, force } = req.body;
    const Notification = require('../models/Notification');

    const member = await Member.findById(req.params.id);

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }

    // Check for active books if not forced
    if (!force) {
      const activeTransactions = await Transaction.countDocuments({
        memberId: member._id,
        status: { $in: ['Issued', 'Overdue'] }
      });

      if (activeTransactions > 0) {
        return res.status(400).json({
          success: false,
          message: 'Member has active borrowed books',
          requiresConfirmation: true,
          activeBookCount: activeTransactions
        });
      }
    }

    // Proceed with blocking
    member.isBlocked = true;
    member.blockReason = reason || 'Blocked by librarian';
    await member.save();

    // Create notification for the member
    await Notification.create({
      memberId: member._id,
      title: 'Account Blocked',
      message: `Your library account has been blocked. Reason: ${reason || 'Blocked by librarian'}. Please contact the library administration for more information.`,
      type: 'general'
    });

    res.json({
      success: true,
      message: 'Member blocked successfully',
      data: member
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Unblock member
// @route   PATCH /api/members/:id/unblock
// @access  Private
const unblockMember = async (req, res, next) => {
  try {
    const member = await Member.findByIdAndUpdate(
      req.params.id,
      { 
        isBlocked: false,
        blockReason: null
      },
      { new: true }
    );

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }

    res.json({
      success: true,
      message: 'Member unblocked successfully',
      data: member
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Bulk import members
// @route   POST /api/members/bulk-import
// @access  Private
const bulkImportMembers = async (req, res, next) => {
  try {
    const { members } = req.body;

    if (!Array.isArray(members) || members.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of members'
      });
    }

    const results = {
      success: [],
      failed: []
    };

    for (const memberData of members) {
      try {
        // Generate member ID if not provided
        if (!memberData.memberId) {
          memberData.memberId = generateMemberId(
            memberData.memberType,
            memberData.department
          );
        }

        // Set validity date if not provided
        if (!memberData.validUntil) {
          const validUntil = new Date();
          validUntil.setFullYear(validUntil.getFullYear() + 1);
          memberData.validUntil = validUntil;
        }

        memberData.createdBy = req.user.id;

        const member = await Member.create(memberData);
        results.success.push({ 
          name: member.name, 
          memberId: member.memberId 
        });
      } catch (error) {
        results.failed.push({ 
          name: memberData.name, 
          error: error.message 
        });
      }
    }

    res.status(201).json({
      success: true,
      message: `Imported ${results.success.length} members, ${results.failed.length} failed`,
      data: results
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get member borrowing history
// @route   GET /api/members/:id/history
// @access  Private
const getMemberHistory = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const history = await Transaction.find({ memberId: req.params.id })
      .populate('bookId', 'title author accessionNumber')
      .populate('issuedBy', 'name')
      .populate('returnedBy', 'name')
      .sort('-issueDate')
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Transaction.countDocuments({ memberId: req.params.id });

    res.json({
      success: true,
      data: history,
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

// @desc    Update member photo
// @route   PATCH /api/members/:id/photo
// @access  Private
const updateMemberPhoto = async (req, res, next) => {
  try {
    const member = await Member.findById(req.params.id);
    
    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }

    // Handle photo removal
    if (req.body.removePhoto === 'true') {
      member.photo = null;
      await member.save();
      
      return res.json({
        success: true,
        message: 'Photo removed successfully',
        data: member
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No photo file provided'
      });
    }

    // Update member photo
    const uploadedPhoto = await uploadImageBuffer(req.file, 'library-management/member-photos');
    member.photo = uploadedPhoto.secure_url;
    await member.save();

    res.json({
      success: true,
      message: 'Photo updated successfully',
      data: member
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get pending members (students waiting for approval)
// @route   GET /api/members/pending
// @access  Private
const getPendingMembers = async (req, res, next) => {
  try {
    const pendingMembers = await Member.find({
      registrationStatus: 'pending',
      profileCompleted: true
    })
      .sort('-createdAt')
      .select('+password');

    res.json({
      success: true,
      count: pendingMembers.length,
      data: pendingMembers
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve member
// @route   PATCH /api/members/:id/approve
// @access  Private (Librarian)
const approveMember = async (req, res, next) => {
  try {
    const member = await Member.findById(req.params.id);

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }

    if (member.registrationStatus !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Member is not in pending status'
      });
    }

    member.registrationStatus = 'approved';
    member.approvedBy = req.user.id;
    member.approvedDate = Date.now();
    await member.save();

    // Create admin notification for member approval
    await AdminNotification.create({
      title: 'Member Approved',
      message: `${member.name} (${member.memberId}) - ${member.memberType} registration approved.`,
      type: 'general'
    });

    res.json({
      success: true,
      message: 'Member approved successfully',
      data: member
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reject member
// @route   PATCH /api/members/:id/reject
// @access  Private (Librarian)
const rejectMember = async (req, res, next) => {
  try {
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a rejection reason'
      });
    }

    const member = await Member.findById(req.params.id);

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }

    if (member.registrationStatus !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Member is not in pending status'
      });
    }

    member.registrationStatus = 'rejected';
    member.rejectionReason = reason;
    await member.save();

    // Create admin notification for member rejection
    await AdminNotification.create({
      title: 'Member Registration Rejected',
      message: `${member.name} (${member.email}) registration rejected. Reason: ${reason}`,
      type: 'general'
    });

    res.json({
      success: true,
      message: 'Member rejected',
      data: member
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMembers,
  getMember,
  createMember,
  updateMember,
  updateMemberPhoto,
  checkMemberStatus,
  deleteMember,
  blockMember,
  unblockMember,
  bulkImportMembers,
  getMemberHistory,
  getPendingMembers,
  approveMember,
  rejectMember
};
