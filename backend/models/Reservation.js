const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
  bookId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: true,
    index: true
  },
  memberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member',
    required: true,
    index: true
  },
  reservationDate: {
    type: Date,
    default: Date.now,
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Active', 'Notified', 'Fulfilled', 'Cancelled', 'Expired'],
    default: 'Pending',
    index: true
  },
  notifiedDate: {
    type: Date,
    default: null
  },
  expiryDate: {
    type: Date,
    default: function() {
      // Reservation expires after 7 days
      const date = new Date();
      date.setDate(date.getDate() + 7);
      return date;
    }
  },
  fulfilledDate: {
    type: Date,
    default: null
  },
  priority: {
    type: Number,
    default: 0
  },
  notes: {
    type: String,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Librarian'
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate active reservations
reservationSchema.index({ bookId: 1, memberId: 1, status: 1 });

// Method to check if reservation is expired
reservationSchema.methods.isExpired = function() {
  if (this.status !== 'Pending' && this.status !== 'Active' && this.status !== 'Notified') {
    return false;
  }
  return new Date() > this.expiryDate;
};

// Auto-expire reservations
reservationSchema.pre('save', function(next) {
  if (this.isExpired() && (this.status === 'Pending' || this.status === 'Active' || this.status === 'Notified')) {
    this.status = 'Expired';
  }
  next();
});

module.exports = mongoose.model('Reservation', reservationSchema);
