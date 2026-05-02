const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChatSession',
    required: true,
    index: true
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    required: function() { return !this.isSystemMessage; },
    refPath: 'senderModel'
  },
  senderModel: {
    type: String,
    required: function() { return !this.isSystemMessage; },
    enum: ['Member', 'Librarian']
  },
  senderType: {
    type: String,
    required: function() { return !this.isSystemMessage; },
    enum: ['student', 'admin', 'system'],
    index: true
  },
  senderName: {
    type: String,
    required: function() { return !this.isSystemMessage; }
  },
  isSystemMessage: {
    type: Boolean,
    default: false
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  isRead: {
    type: Boolean,
    default: false,
    index: true
  },
  readAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for efficient querying
chatMessageSchema.index({ sessionId: 1, createdAt: -1 });
chatMessageSchema.index({ sessionId: 1, isRead: 1 });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
