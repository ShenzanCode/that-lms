const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
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
  accessionNumber: {
    type: String,
    required: true,
    index: true
  },
  issueDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  dueDate: {
    type: Date,
    required: true,
    index: true
  },
  returnDate: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['Issued', 'Returned', 'Overdue', 'Lost'],
    default: 'Issued',
    index: true
  },
  renewCount: {
    type: Number,
    default: 0,
    min: 0
  },
  maxRenewals: {
    type: Number,
    default: 2
  },
  fine: {
    type: Number,
    default: 0,
    min: 0
  },
  finePaid: {
    type: Boolean,
    default: false
  },
  fineWaived: {
    type: Boolean,
    default: false
  },
  issuedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Librarian',
    required: true
  },
  returnedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Librarian',
    default: null
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Index for finding overdue books
transactionSchema.index({ status: 1, dueDate: 1 });

// Method to check if transaction is overdue
transactionSchema.methods.isOverdue = function() {
  if (this.status === 'Returned') return false;
  return new Date() > this.dueDate;
};

// Method to calculate fine
transactionSchema.methods.calculateFine = function(fineRatePerDay = 2) {
  if (this.status === 'Returned' || !this.isOverdue()) {
    return 0;
  }
  
  const today = new Date();
  const dueDate = new Date(this.dueDate);
  const daysOverdue = Math.ceil((today - dueDate) / (1000 * 60 * 60 * 24));
  
  return daysOverdue * fineRatePerDay;
};

// Update status to overdue automatically
transactionSchema.pre('save', function(next) {
  if (this.status === 'Issued' && this.isOverdue()) {
    this.status = 'Overdue';
  }
  next();
});

module.exports = mongoose.model('Transaction', transactionSchema);
