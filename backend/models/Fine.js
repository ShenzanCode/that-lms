const mongoose = require('mongoose');

const fineSchema = new mongoose.Schema({
  transactionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction',
    required: true,
    index: true
  },
  memberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member',
    required: true,
    index: true
  },
  bookId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  reason: {
    type: String,
    required: true,
    enum: ['Overdue', 'Lost Book', 'Damaged Book', 'Other'],
    default: 'Overdue'
  },
  description: {
    type: String,
    trim: true
  },
  isPaid: {
    type: Boolean,
    default: false,
    index: true
  },
  paidAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  paidDate: {
    type: Date,
    default: null
  },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'Card', 'UPI', 'Net Banking', 'Other'],
    default: null
  },
  receiptNumber: {
    type: String,
    trim: true
  },
  isWaived: {
    type: Boolean,
    default: false
  },
  waivedAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  waivedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Librarian',
    default: null
  },
  waiverReason: {
    type: String,
    trim: true
  },
  waiverDate: {
    type: Date,
    default: null
  },
  collectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Librarian',
    default: null
  },
  createdDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for unpaid fines
fineSchema.index({ isPaid: 1, memberId: 1 });

// Virtual for outstanding amount
fineSchema.virtual('outstandingAmount').get(function() {
  return this.amount - this.paidAmount - this.waivedAmount;
});

// Method to mark as paid
fineSchema.methods.markAsPaid = function(amount, method, collectedBy, receiptNumber) {
  this.paidAmount = amount;
  this.isPaid = (this.paidAmount + this.waivedAmount) >= this.amount;
  this.paidDate = new Date();
  this.paymentMethod = method;
  this.collectedBy = collectedBy;
  this.receiptNumber = receiptNumber;
  return this.save();
};

// Method to waive fine
fineSchema.methods.waiveFine = function(amount, reason, waivedBy) {
  this.waivedAmount = amount;
  this.isWaived = true;
  this.waiverReason = reason;
  this.waivedBy = waivedBy;
  this.waiverDate = new Date();
  this.isPaid = (this.paidAmount + this.waivedAmount) >= this.amount;
  return this.save();
};

module.exports = mongoose.model('Fine', fineSchema);
