const ChatSession = require('../models/ChatSession');
const ChatMessage = require('../models/ChatMessage');
const Member = require('../models/Member');

// Get socket.io instance (will be set by server.js)
let io;
const setSocketIO = (socketIO) => {
  io = socketIO;
};

// @desc    Get or create chat session for student
// @route   GET /api/chat/session
// @access  Private (Student)
const getOrCreateSession = async (req, res, next) => {
  try {
    const memberId = req.student._id;

    // Find existing active or pending session
    let session = await ChatSession.findOne({
      memberId,
      status: { $in: ['active', 'pending'] }
    });

    // If found, return it
    if (session) {
      return res.json({
        success: true,
        data: session
      });
    }

    // Always create NEW session (don't reopen closed ones)
    session = await ChatSession.create({
      memberId,
      memberName: req.student.name,
      status: 'pending',
      unreadCountMember: 0,
      unreadCountAdmin: 0
    });

    res.json({
      success: true,
      data: session,
      isNew: true
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get chat messages for a session
// @route   GET /api/chat/messages/:sessionId
// @access  Private (Student/Admin)
const getMessages = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const limit = parseInt(req.query.limit) || 50;
    const skip = parseInt(req.query.skip) || 0;

    // Verify access
    const session = await ChatSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Chat session not found'
      });
    }

    // Check if user has access to this session
    const isStudent = req.student && req.student._id.toString() === session.memberId.toString();
    const isAdmin = req.user; // If req.user exists, they are a librarian (admin)

    if (!isStudent && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this chat session'
      });
    }

    // Get messages
    const messages = await ChatMessage.find({ sessionId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    const total = await ChatMessage.countDocuments({ sessionId });

    res.json({
      success: true,
      data: messages.reverse(), // Reverse to show oldest first
      pagination: {
        total,
        limit,
        skip,
        hasMore: total > skip + messages.length
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all chat sessions (Admin)
// @route   GET /api/chat/sessions
// @access  Private (Admin)
const getAllSessions = async (req, res, next) => {
  try {
    const status = req.query.status || 'active';
    
    const sessions = await ChatSession.find({ 
      status: status === 'all' ? { $in: ['active', 'pending', 'closed'] } : status 
    })
      .populate('memberId', 'name email memberId')
      .sort({ lastMessageTime: -1 });

    // Get total unread count for admin
    const totalUnread = sessions.reduce((sum, session) => sum + session.unreadCountAdmin, 0);

    res.json({
      success: true,
      data: sessions,
      totalUnread
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark messages as read
// @route   PATCH /api/chat/session/:sessionId/read
// @access  Private (Student/Admin)
const markAsRead = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    
    const session = await ChatSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Chat session not found'
      });
    }

    // Determine who is reading
    const isStudent = req.student && req.student._id.toString() === session.memberId.toString();
    const isAdmin = req.user; // If req.user exists, they are a librarian (admin)

    if (!isStudent && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    // Mark messages as read based on who is reading
    if (isStudent) {
      // Student reading admin messages
      await ChatMessage.updateMany(
        { 
          sessionId, 
          senderType: 'admin',
          isRead: false 
        },
        { 
          isRead: true,
          readAt: new Date()
        }
      );
      session.unreadCountMember = 0;
    } else if (isAdmin) {
      // Admin reading student messages
      await ChatMessage.updateMany(
        { 
          sessionId, 
          senderType: 'student',
          isRead: false 
        },
        { 
          isRead: true,
          readAt: new Date()
        }
      );
      session.unreadCountAdmin = 0;
    }

    await session.save();

    res.json({
      success: true,
      message: 'Messages marked as read'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Close chat session (mark as left)
// @route   PATCH /api/chat/session/:sessionId/close (Student)
// @route   PATCH /api/chat/admin/session/:sessionId/close (Admin)
// @access  Private (Student or Admin)
const closeSession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    
    const session = await ChatSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Chat session not found'
      });
    }

    // Check authorization - student can only close their own session
    if (req.student && session.memberId.toString() !== req.student._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to close this session'
      });
    }

    // Determine who is closing
    const isStudent = !!req.student;
    const isAdmin = !!req.user;
    let leaverName = '';

    // Mark who has left the chat
    if (isStudent) {
      session.memberLeft = true;
      session.closedBy = 'member';
      leaverName = session.memberName;
    } else if (isAdmin) {
      session.adminLeft = true;
      session.closedBy = 'admin';
      leaverName = req.user.name || 'Support';
    }

    // Create system message
    const systemMessage = await ChatMessage.create({
      sessionId,
      senderType: 'system',
      message: `${leaverName} left the conversation`,
      isSystemMessage: true,
      isRead: true
    });

    // If both have left, delete the session and messages
    if (session.memberLeft && session.adminLeft) {
      await ChatMessage.deleteMany({ sessionId });
      await ChatSession.findByIdAndDelete(sessionId);
      
      return res.json({
        success: true,
        message: 'Chat session deleted',
        deleted: true
      });
    }

    // Otherwise just mark as left
    session.closedAt = new Date();
    session.status = 'closed';
    await session.save();

    // Emit socket event to notify the other party
    if (io) {
      io.to(`session_${sessionId}`).emit('session_closed', {
        sessionId,
        closedBy: isStudent ? 'member' : 'admin',
        closerName: leaverName,
        systemMessage: systemMessage.toObject()
      });
    }

    res.json({
      success: true,
      message: `Chat marked as ${isStudent ? 'member' : 'admin'} left`,
      deleted: false,
      systemMessage: systemMessage
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Permanently delete chat session (Admin only)
// @route   DELETE /api/chat/admin/session/:sessionId
// @access  Private (Admin)
const deleteSession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    
    const session = await ChatSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Chat session not found'
      });
    }

    // Delete all messages in this session
    await ChatMessage.deleteMany({ sessionId });
    
    // Delete the session
    await ChatSession.findByIdAndDelete(sessionId);

    res.json({
      success: true,
      message: 'Chat session permanently deleted'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get member's own chat sessions
// @route   GET /api/chat/member/sessions
// @access  Private (Student)
const getMemberSessions = async (req, res, next) => {
  try {
    const memberId = req.student._id;

    // Get all sessions for this member (including closed ones)
    const sessions = await ChatSession.find({
      memberId
    })
      .populate('memberId', 'name memberId')
      .sort({ lastMessageTime: -1 });

    res.json({
      success: true,
      data: sessions
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Permanently delete chat session (Member)
// @route   DELETE /api/chat/member/session/:sessionId
// @access  Private (Student)
const deleteMemberSession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const memberId = req.student._id;
    
    const session = await ChatSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Chat session not found'
      });
    }

    // Check authorization - student can only delete their own session
    if (session.memberId.toString() !== memberId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this session'
      });
    }

    // Delete all messages in this session
    await ChatMessage.deleteMany({ sessionId });
    
    // Delete the session
    await ChatSession.findByIdAndDelete(sessionId);

    res.json({
      success: true,
      message: 'Chat session permanently deleted'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOrCreateSession,
  getMessages,
  getAllSessions,
  markAsRead,
  closeSession,
  deleteSession,
  getMemberSessions,
  deleteMemberSession,
  setSocketIO
};
