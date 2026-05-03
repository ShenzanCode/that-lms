const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  accessionNumber: {
    type: String,
    required: [true, 'Accession number is required'],
    unique: true,
    trim: true
  },
  isbn: {
    type: String,
    trim: true,
    index: true
  },
  title: {
    type: String,
    required: [true, 'Book title is required'],
    trim: true,
    index: true
  },
  author: {
    type: String,
    required: [true, 'Author name is required'],
    trim: true,
    index: true
  },
  publisher: {
    type: String,
    trim: true
  },
  edition: {
    type: String,
    trim: true
  },
  publicationYear: {
    type: Number,
    min: 1800,
    max: new Date().getFullYear() + 1
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true,
    index: true
  },
  department: {
    type: String,
    trim: true
  },
  shelfLocation: {
    type: String,
    trim: true
  },
  totalCopies: {
    type: Number,
    required: true,
    default: 1,
    min: 1
  },
  availableCopies: {
    type: Number,
    required: true,
    default: 1,
    min: 0
  },
  status: {
    type: String,
    enum: ['Available', 'Issued', 'Damaged', 'Lost'],
    default: 'Available'
  },
  condition: {
    type: String,
    enum: ['Excellent', 'Good', 'Fair', 'Poor'],
    default: 'Good'
  },
  coverImage: {
    type: String,
    default: null
  },
  description: {
    type: String,
    trim: true
  },
  price: {
    type: Number,
    min: 0
  },
  language: {
    type: String,
    default: 'English'
  },
  pages: {
    type: Number,
    min: 1
  },
  ddcNumber: {
    type: String,
    trim: true
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Librarian'
  },
  addedDate: {
    type: Date,
    default: Date.now
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Update lastUpdated on save
bookSchema.pre('save', function(next) {
  this.lastUpdated = Date.now();
  next();
});

// Update status based on available copies
bookSchema.pre('save', function(next) {
  // Only auto-update status if it's currently Available or Issued
  // Don't change status if book is marked as Damaged or Lost
  if (this.status === 'Available' || this.status === 'Issued') {
    if (this.availableCopies <= 0) {
      this.status = 'Issued';
    } else {
      this.status = 'Available';
    }
  }
  next();
});

// Text search index
bookSchema.index({ 
  title: 'text', 
  author: 'text', 
  isbn: 'text', 
  accessionNumber: 'text',
  category: 'text'
});

module.exports = mongoose.model('Book', bookSchema);
