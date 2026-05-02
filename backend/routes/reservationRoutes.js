const express = require('express');
const router = express.Router();
const {
  getReservations,
  createReservation,
  deleteReservation,
  notifyReservation,
  fulfillReservation,
  approveReservation,
  rejectReservation
} = require('../controllers/reservationController');
const { protect, protectAny } = require('../middleware/authMiddleware');

// Read and create reservations - accessible to both
router.get('/', protectAny, getReservations);
router.post('/', protectAny, createReservation);
router.delete('/:id', protectAny, deleteReservation);

// Admin operations - librarian only
router.patch('/:id/notify', protect, notifyReservation);
router.patch('/:id/fulfill', protect, fulfillReservation);
router.patch('/:id/approve', protect, approveReservation);
router.patch('/:id/reject', protect, rejectReservation);

module.exports = router;
