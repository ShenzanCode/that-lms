import { io } from 'socket.io-client';

// Socket.io connects to the base URL, not the API path
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

console.log('🌐 Socket.io connecting to:', SOCKET_URL);

class SocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
  }

  connect() {
    if (this.socket && this.connected) {
      console.log('Socket already connected, reusing existing connection');
      return this.socket;
    }

    console.log('🔌 Attempting to connect to Socket.io server...');
    this.socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      timeout: 10000
    });

    this.socket.on('connect', () => {
      console.log('✅ Socket connected successfully! Socket ID:', this.socket.id);
      this.connected = true;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected. Reason:', reason);
      this.connected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error.message);
      console.error('Full error:', error);
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  joinChat(userId, userType, sessionId) {
    if (!this.socket) {
      this.connect();
    }
    
    console.log('🚪 Joining chat:', { userId, userType, sessionId });
    this.socket.emit('join_chat', { userId, userType, sessionId });
  }

  sendMessage(data) {
    if (!this.socket) {
      console.error('Socket not connected');
      return;
    }
    
    console.log('📤 Sending message via socket:', data);
    this.socket.emit('send_message', data);
  }

  markAsRead(sessionId, userType) {
    if (!this.socket) {
      return;
    }
    
    this.socket.emit('mark_read', { sessionId, userType });
  }

  sendTyping(sessionId, userName, isTyping) {
    if (!this.socket) {
      return;
    }
    
    this.socket.emit('typing', { sessionId, userName, isTyping });
  }

  onNewMessage(callback) {
    if (!this.socket) {
      this.connect();
    }
    
    this.socket.on('new_message', (data) => {
      console.log('📥 Received new message:', data);
      callback(data);
    });
  }

  onJoined(callback) {
    if (!this.socket) {
      this.connect();
    }
    
    this.socket.on('joined', (data) => {
      console.log('✅ Joined chat successfully:', data);
      callback(data);
    });
  }

  onError(callback) {
    if (!this.socket) {
      this.connect();
    }
    
    this.socket.on('error', (data) => {
      console.error('❌ Socket error:', data);
      callback(data);
    });
  }

  onUserTyping(callback) {
    if (!this.socket) {
      this.connect();
    }
    
    this.socket.on('user_typing', callback);
  }

  onMessagesRead(callback) {
    if (!this.socket) {
      this.connect();
    }
    
    this.socket.on('messages_read', callback);
  }

  onNewChatNotification(callback) {
    if (!this.socket) {
      this.connect();
    }
    
    this.socket.on('new_chat_notification', callback);
  }

  onNewSessionPopup(callback) {
    if (!this.socket) {
      this.connect();
    }
    
    this.socket.on('new_session_popup', (data) => {
      console.log('🔔 New session popup received:', data);
      callback(data);
    });
  }

  onSessionClosed(callback) {
    if (!this.socket) {
      this.connect();
    }
    
    this.socket.on('session_closed', (data) => {
      console.log('🚪 Session closed:', data);
      callback(data);
    });
  }

  offNewMessage() {
    if (this.socket) {
      this.socket.off('new_message');
    }
  }

  offUserTyping() {
    if (this.socket) {
      this.socket.off('user_typing');
    }
  }

  offMessagesRead() {
    if (this.socket) {
      this.socket.off('messages_read');
    }
  }

  offNewChatNotification() {
    if (this.socket) {
      this.socket.off('new_chat_notification');
    }
  }

  offNewSessionPopup() {
    if (this.socket) {
      this.socket.off('new_session_popup');
    }
  }

  offSessionClosed() {
    if (this.socket) {
      this.socket.off('session_closed');
    }
  }
}

const socketService = new SocketService();

export default socketService;
