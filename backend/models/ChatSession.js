const mongoose = require('mongoose');

const chatSessionSchema = new mongoose.Schema({
  memberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member',
    required: true,
    index: true
  },
  memberName: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'closed', 'pending'],
    default: 'active',
    index: true
  },
  lastMessage: {
    type: String,
    default: ''
  },
  lastMessageTime: {
    type: Date,
    default: Date.now
  },
  unreadCountAdmin: {
    type: Number,
    default: 0
  },
  unreadCountMember: {
    type: Number,
    default: 0
  },
  memberLeft: {
    type: Boolean,
    default: false
  },
  adminLeft: {
    type: Boolean,
    default: false
  },
  closedAt: {
    type: Date
  },
  closedBy: {
    type: String,
    enum: ['admin', 'member', 'auto']
  }
}, {
  timestamps: true
});

// Index for quick lookups
chatSessionSchema.index({ memberId: 1, status: 1 });
chatSessionSchema.index({ lastMessageTime: -1 });

module.exports = mongoose.model('ChatSession', chatSessionSchema);
