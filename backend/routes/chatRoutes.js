const express = require('express');
const router = express.Router();
const {
  getOrCreateSession,
  getMessages,
  getAllSessions,
  markAsRead,
  closeSession,
  deleteSession,
  getMemberSessions,
  deleteMemberSession
} = require('../controllers/chatController');
const { protect, admin, protectStudent, protectAny } = require('../middleware/authMiddleware');

// Student routes
router.get('/session', protectStudent, getOrCreateSession);
router.get('/messages/:sessionId', protectAny, getMessages);
router.patch('/session/:sessionId/read', protectAny, markAsRead);
router.patch('/session/:sessionId/close', protectStudent, closeSession);

// Member routes for chat history
router.get('/member/sessions', protectStudent, getMemberSessions);
router.delete('/member/session/:sessionId', protectStudent, deleteMemberSession);

// Admin routes
router.get('/sessions', protect, admin, getAllSessions);
router.get('/admin/messages/:sessionId', protect, admin, getMessages);
router.patch('/admin/session/:sessionId/read', protect, admin, markAsRead);
router.patch('/admin/session/:sessionId/close', protect, admin, closeSession);
router.delete('/admin/session/:sessionId', protect, admin, deleteSession);

module.exports = router;
