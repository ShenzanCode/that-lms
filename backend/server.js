const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/authRoutes');
const studentAuthRoutes = require('./routes/studentAuthRoutes');
const bookRoutes = require('./routes/bookRoutes');
const memberRoutes = require('./routes/memberRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const reservationRoutes = require('./routes/reservationRoutes');
const fineRoutes = require('./routes/fineRoutes');
const reportRoutes = require('./routes/reportRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const adminNotificationRoutes = require('./routes/adminNotificationRoutes');
const chatRoutes = require('./routes/chatRoutes');

// Import error handler
const errorHandler = require('./middleware/errorHandler');

// Import services
const OverdueService = require('./services/overdueService');

// Import chat controller
const chatController = require('./controllers/chatController');

// Import models for Socket.io
const ChatSession = require('./models/ChatSession');
const ChatMessage = require('./models/ChatMessage');

const app = express();
const server = http.createServer(app);

// Security middleware with CSP configuration to allow images
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "blob:", "*"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
    },
  },
}));

// CORS configuration
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'http://localhost:3003',
  'http://localhost:4173',
  'http://localhost:5173',
  process.env.CLIENT_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  }
});
// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10000, // limit each IP to 10000 requests per windowMs (very permissive for development)
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parser middleware with increased limit for bulk imports
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Library Management System API is running',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/student-auth', studentAuthRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/fines', fineRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin/notifications', adminNotificationRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Route not found' 
  });
});

// Error handling middleware
app.use(errorHandler);

// Database connection
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/library_management';

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    
    // Start overdue fine scheduler
    OverdueService.startScheduler();
    // Socket.io connection handling
    setupSocketIO(io);
    
    // Pass socket.io instance to chatController
    chatController.setSocketIO(io);
    
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`💬 Socket.io server ready`);
      console.log(`📚 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  });

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err.message);
  process.exit(1);
});

// Socket.io setup function
function setupSocketIO(io) {
  // Store connected users
  const connectedUsers = new Map(); // userId -> socketId
  
  io.on('connection', (socket) => {
    console.log('👤 User connected:', socket.id);
    
    // Join chat room
    socket.on('join_chat', async ({ userId, userType, sessionId }) => {
      try {
        // Store user connection
        connectedUsers.set(userId, socket.id);
        
        // Join session room
        if (sessionId) {
          socket.join(`session_${sessionId}`);
          console.log(`User ${userId} (${userType}) joined session ${sessionId}`);
        }
        
        // Join user type room (admin or student)
        socket.join(userType === 'admin' ? 'admins' : `student_${userId}`);
        
        socket.emit('joined', { sessionId, userId });
      } catch (error) {
        console.error('Error joining chat:', error);
        socket.emit('error', { message: 'Failed to join chat' });
      }
    });
    
    // Send message
    socket.on('send_message', async (data) => {
      try {
        console.log('📩 Received message:', data);
        const { sessionId, senderId, senderType, senderName, senderModel, message, isNewSession } = data;
        
        // Check if session is closed
        const session = await ChatSession.findById(sessionId);
        if (!session) {
          console.log('❌ Session not found');
          socket.emit('error', { message: 'Session not found' });
          return;
        }
        
        // Reject message if session is closed by either party
        if (session.memberLeft || session.adminLeft) {
          console.log('❌ Cannot send message - session is closed');
          socket.emit('error', { message: 'This conversation has ended' });
          return;
        }
        
        // Save message to database
        const newMessage = await ChatMessage.create({
          sessionId,
          senderId,
          senderType,
          senderName,
          senderModel,
          message: message.trim(),
          isRead: false
        });
        
        console.log('💾 Message saved to DB:', newMessage._id);
        
        // Update session (we already have it from the check above)
        session.lastMessage = message.trim().substring(0, 100);
        session.lastMessageTime = new Date();
        session.status = 'active';
        
        // Increment unread count for receiver
        if (senderType === 'student') {
          session.unreadCountAdmin += 1;
        } else {
          session.unreadCountMember += 1;
        }
        
        await session.save();
        
        // If this is a NEW session from student, send popup notification to admin
        if (senderType === 'student' && isNewSession) {
          io.to('admins').emit('new_session_popup', {
            sessionId: session._id,
            memberName: senderName,
            memberId: senderId,
            message: message.trim(),
            timestamp: new Date()
          });
          console.log(`🔔 New session popup sent to admins for ${senderName}`);
        }
        
        // Emit message to session room
        io.to(`session_${sessionId}`).emit('new_message', {
          ...newMessage.toObject(),
          createdAt: newMessage.createdAt
        });
        
        console.log(`✅ Message sent in session ${sessionId} by ${senderName}`);
        
        // Notify admins if message is from student (for existing sessions)
        if (senderType === 'student' && !isNewSession) {
          io.to('admins').emit('new_chat_notification', {
            sessionId,
            memberName: senderName,
            message: message.trim().substring(0, 50),
            unreadCount: session?.unreadCountAdmin || 0
          });
        }
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });
    
    // Typing indicator
    socket.on('typing', ({ sessionId, userName, isTyping }) => {
      socket.to(`session_${sessionId}`).emit('user_typing', { userName, isTyping });
    });
    
    // Mark messages as read
    socket.on('mark_read', async ({ sessionId, userType }) => {
      try {
        const session = await ChatSession.findById(sessionId);
        if (!session) return;
        
        if (userType === 'student') {
          await ChatMessage.updateMany(
            { sessionId, senderType: 'admin', isRead: false },
            { isRead: true, readAt: new Date() }
          );
          session.unreadCountMember = 0;
        } else {
          await ChatMessage.updateMany(
            { sessionId, senderType: 'student', isRead: false },
            { isRead: true, readAt: new Date() }
          );
          session.unreadCountAdmin = 0;
        }
        
        await session.save();
        
        io.to(`session_${sessionId}`).emit('messages_read', { userType });
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    });
    
    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('👤 User disconnected:', socket.id);
      // Remove from connected users
      for (const [userId, socketId] of connectedUsers.entries()) {
        if (socketId === socket.id) {
          connectedUsers.delete(userId);
          break;
        }
      }
    });
  });
}
