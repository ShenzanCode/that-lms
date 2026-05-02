const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const ChatSession = require('../models/ChatSession');
const ChatMessage = require('../models/ChatMessage');

const cleanupChats = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/library_management');
    console.log('✅ Connected to MongoDB');

    // Delete all chat messages
    const messagesDeleted = await ChatMessage.deleteMany({});
    console.log(`🗑️  Deleted ${messagesDeleted.deletedCount} chat messages`);

    // Delete all chat sessions
    const sessionsDeleted = await ChatSession.deleteMany({});
    console.log(`🗑️  Deleted ${sessionsDeleted.deletedCount} chat sessions`);

    console.log('✅ Chat cleanup complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error cleaning up chats:', error);
    process.exit(1);
  }
};

cleanupChats();
