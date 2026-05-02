const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/memberController');
const { protect } = require('../middleware/authMiddleware');
const { upload, handleMulterError } = require('../middleware/uploadMiddleware');

// All routes are protected
router.use(protect);

router.route('/')
  .get(getMembers)
  .post(upload.single('photo'), handleMulterError, createMember);

router.post('/bulk-import', bulkImportMembers);

router.get('/pending', getPendingMembers);

router.route('/:id')
  .get(getMember)
  .put(upload.single('photo'), handleMulterError, updateMember)
  .delete(deleteMember);

router.patch('/:id/block', blockMember);
router.patch('/:id/unblock', unblockMember);
router.patch('/:id/approve', approveMember);
router.patch('/:id/reject', rejectMember);
router.patch('/:id/photo', upload.single('photo'), handleMulterError, updateMemberPhoto);
router.get('/:id/status', checkMemberStatus);
router.get('/:id/history', getMemberHistory);

module.exports = router;
