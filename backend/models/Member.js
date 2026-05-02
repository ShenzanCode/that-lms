const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const memberSchema = new mongoose.Schema({
  memberId: {
    type: String,
    required: [true, 'Member ID is required'],
    unique: true,
    trim: true,
    uppercase: true
  },
  username: {
    type: String,
    trim: true,
    lowercase: true,
    sparse: true,
    unique: true
  },
  password: {
    type: String,
    select: false,
    minlength: [6, 'Password must be at least 6 characters']
  },
  registrationStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'approved'
  },
  profileCompleted: {
    type: Boolean,
    default: false
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Librarian'
  },
  approvedDate: {
    type: Date
  },
  rejectionReason: {
    type: String,
    trim: true
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    index: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  department: {
    type: String,
    required: [true, 'Department is required'],
    trim: true
  },
  memberType: {
    type: String,
    enum: ['Student', 'Faculty', 'Staff'],
    required: [true, 'Member type is required']
  },
  year: {
    type: String,
    trim: true
  },
  course: {
    type: String,
    trim: true
  },
  subject: {
    type: String,
    trim: true
  },
  semester: {
    type: String,
    trim: true
  },
  photo: {
    type: String,
    default: null
  },
  document: {
    type: String,
    default: null
  },
  isBlocked: {
    type: Boolean,
    default: false
  },
  blockReason: {
    type: String,
    trim: true
  },
  borrowingLimit: {
    type: Number,
    required: true
  },
  currentBorrowedBooks: {
    type: Number,
    default: 0,
    min: 0
  },
  totalBooksBorrowed: {
    type: Number,
    default: 0,
    min: 0
  },
  joinDate: {
    type: Date,
    default: Date.now
  },
  validUntil: {
    type: Date,
    required: true
  },
  address: {
    type: String,
    trim: true
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

// Text search index
memberSchema.index({ 
  name: 'text', 
  memberId: 'text', 
  email: 'text',
  phone: 'text'
});

// Virtual for checking if membership is expired
memberSchema.virtual('isExpired').get(function() {
  return new Date() > this.validUntil;
});

// Virtual to check if member can login
memberSchema.virtual('canLogin').get(function() {
  return this.registrationStatus === 'approved' && this.profileCompleted;
});

// Hash password before saving
memberSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  if (this.password) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  
  next();
});

// Method to compare passwords
memberSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Method to check if member can borrow more books
memberSchema.methods.canBorrowMore = function() {
  return !this.isBlocked && 
         !this.isExpired && 
         this.currentBorrowedBooks < this.borrowingLimit;
};

module.exports = mongoose.model('Member', memberSchema);
