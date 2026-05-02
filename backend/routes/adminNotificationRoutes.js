const express = require('express');
const AdminNotification = require('../models/AdminNotification');

const router = express.Router();

// Get all admin notifications (most recent first)
router.get('/', async (req, res, next) => {
  try {
    const notifications = await AdminNotification.find().sort({ createdAt: -1 }).limit(100);
    res.json({ success: true, data: notifications });
  } catch (err) {
    next(err);
  }
});

// Create a new admin notification
router.post('/', async (req, res, next) => {
  try {
    const { title, message, type, relatedId } = req.body;
    const created = await AdminNotification.create({ title, message, type, relatedId });
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    next(err);
  }
});

// Mark a notification as read
router.patch('/:id/read', async (req, res, next) => {
  try {
    const notif = await AdminNotification.findByIdAndUpdate(req.params.id, { isRead: true }, { new: true });
    if (!notif) return res.status(404).json({ success: false, message: 'Notification not found' });
    res.json({ success: true, data: notif });
  } catch (err) {
    next(err);
  }
});

// Delete a notification
router.delete('/:id', async (req, res, next) => {
  try {
    const deleted = await AdminNotification.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Notification not found' });
    res.json({ success: true, data: deleted });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
