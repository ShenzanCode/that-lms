import { useState, useEffect, useRef } from 'react';
import { XCircle, X, Send, Minimize2, Maximize2, MessageCircle } from 'lucide-react';
import { chatService } from '@/services/chatService';
import socketService from '@/lib/socket';
import { useMemberAuthStore } from '@/store/memberAuthStore';
import toast from 'react-hot-toast';

export default function LiveChatWindow({ onClose, onUnreadCountChange }) {
  const { student } = useMemberAuthStore();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [chatStarted, setChatStarted] = useState(false);
  const [otherPartyLeft, setOtherPartyLeft] = useState(false);
  const [memberLeft, setMemberLeft] = useState(false);
  const [hasExistingSession, setHasExistingSession] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  console.log('🔍 LiveChatWindow State:', { chatStarted, session: !!session, messagesCount: messages.length, loading });
  console.log('📌 Component Version: 2.0 - WITH START CHAT BUTTON');

  // Check for existing session on mount
  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        // Only check for existing sessions, don't create a new one
        const response = await chatService.getMemberSessions();
        const sessions = response.data || [];
        
        // Find an active session (neither party has left)
        const activeSession = sessions.find(s => !s.memberLeft && !s.adminLeft);
        
        if (activeSession) {
          setHasExistingSession(true);
        }
      } catch (error) {
        console.error('Error checking for existing session:', error);
      }
    };
    
    checkExistingSession();
  }, []);

  useEffect(() => {
    // Only cleanup on unmount
    return () => {
      // Cleanup socket listeners
      socketService.offNewMessage();
      socketService.offUserTyping();
      socketService.offMessagesRead();
      socketService.offSessionClosed();
      if (session) {
        socketService.disconnect();
      }
    };
  }, [session]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (session && chatStarted) {
      // Mark messages as read when window is open and not minimized
      if (!isMinimized) {
        chatService.markAsRead(session._id).catch(err => {
          // Ignore 404 errors (session was deleted)
          if (err.status !== 404) {
            console.error('Error marking as read:', err);
          }
        });
        socketService.markAsRead(session._id, 'student');
        onUnreadCountChange(0);
      }
    }
  }, [session, isMinimized, messages, chatStarted]);

  const initializeChat = async () => {
    try {
      setLoading(true);
      
      console.log('Student object:', student);
      
      // Get or create session
      const sessionResponse = await chatService.getOrCreateSession();
      const chatSession = sessionResponse.data;
      const isNewSession = sessionResponse.isNew || false;
      setSession(chatSession);
      setOtherPartyLeft(chatSession.adminLeft || false);
      
      console.log('Chat session created:', chatSession, 'isNew:', isNewSession, 'adminLeft:', chatSession.adminLeft);

      // Get messages
      const messagesResponse = await chatService.getMessages(chatSession._id);
      setMessages(messagesResponse.data || []);

      // Connect to socket
      socketService.connect();
      const userId = student.id || student._id;
      console.log('Joining chat with userId:', userId, 'sessionId:', chatSession._id);
      socketService.joinChat(userId, 'student', chatSession._id);

      // Store isNewSession flag for first message
      window.__chatIsNew = isNewSession;

      // Listen for new messages
      socketService.onNewMessage((message) => {
        console.log('📨 Message received in component:', message);
        setMessages((prev) => {
          // Remove any optimistic message with the same content and replace with real message
          const filteredMessages = prev.filter(m => {
            if (m.isOptimistic && m.message === message.message && m.senderType === message.senderType) {
              return false; // Remove optimistic message
            }
            return true;
          });
          
          // Check if real message already exists
          const exists = filteredMessages.some(m => m._id === message._id);
          if (exists) {
            console.log('Message already exists, skipping');
            return filteredMessages;
          }
          
          console.log('Adding new message to state');
          return [...filteredMessages, message];
        });
        
        // Mark as read if window is open
        if (!isMinimized) {
          socketService.markAsRead(chatSession._id, 'student');
        }
      });

      // Listen for typing indicator
      socketService.onUserTyping(({ userName, isTyping }) => {
        setIsTyping(isTyping);
      });

      // Listen for messages read
      socketService.onMessagesRead(() => {
        setMessages((prev) =>
          prev.map((msg) => ({
            ...msg,
            isRead: true,
          }))
        );
      });
      
      // Listen for join confirmation
      socketService.onJoined((data) => {
        console.log('Successfully joined chat session:', data);
      });
      
      // Listen for errors
      socketService.onError((error) => {
        console.error('Socket error:', error);
        toast.error(error.message || 'Connection error');
      });
      
      // Listen for session closed
      socketService.onSessionClosed((data) => {
        console.log('Session closed event received:', data);
        
        if (data.closedBy === 'admin') {
          toast.info('Support has ended the conversation');
          setOtherPartyLeft(true);
          
          // Add system message if available
          if (data.systemMessage) {
            setMessages(prev => [...prev, data.systemMessage]);
          }
        } else if (data.closedBy === 'member' && session && session._id === data.sessionId) {
          // Member closed from another tab/window - disable controls here too
          setMemberLeft(true);
          
          // Add system message if available
          if (data.systemMessage) {
            setMessages(prev => [...prev, data.systemMessage]);
          }
        }
        // Don't close the window automatically - let user see the messages
      });
      
      setChatStarted(true);
      toast.success('Chat started! You can now send messages.');
      
    } catch (error) {
      console.error('Error initializing chat:', error);
      toast.error('Failed to load chat');
    } finally {
      setLoading(false);
    }
  };

  const handleStartChat = () => {
    console.log('🚀 Starting chat...');
    setLoading(true);
    initializeChat();
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !session || sending || otherPartyLeft || memberLeft) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    setSending(true);

    try {
      const userId = student.id || student._id;
      const isNewSession = window.__chatIsNew || false;
      
      // Create optimistic message object
      const optimisticMessage = {
        _id: `temp_${Date.now()}`, // Temporary ID
        sessionId: session._id,
        senderId: userId,
        senderType: 'student',
        senderName: student.name,
        senderModel: 'Member',
        message: messageText,
        isRead: false,
        createdAt: new Date().toISOString(),
        isOptimistic: true // Flag to identify optimistic messages
      };
      
      // Add message optimistically to UI
      setMessages(prev => [...prev, optimisticMessage]);
      
      const messageData = {
        sessionId: session._id,
        senderId: userId,
        senderType: 'student',
        senderName: student.name,
        senderModel: 'Member',
        message: messageText,
        isNewSession
      };
      
      console.log('Sending message:', messageData);
      
      // Clear the isNewSession flag after first message
      window.__chatIsNew = false;
      
      // Send via socket
      socketService.sendMessage(messageData);

      // Stop typing indicator
      socketService.sendTyping(session._id, student.name, false);
      
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => !m.isOptimistic));
    } finally {
      setSending(false);
    }
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Send typing indicator
    socketService.sendTyping(session._id, student.name, true);

    // Stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      socketService.sendTyping(session._id, student.name, false);
    }, 2000);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleEndChat = async () => {
    if (!session || memberLeft) return;
    
    // Instantly disable controls
    setMemberLeft(true);
    
    try {
      const response = await chatService.closeSessionStudent(session._id);
      
      // Add system message to current messages if available
      if (response.systemMessage) {
        setMessages(prev => [...prev, response.systemMessage]);
      }
      
      toast.success(response.deleted ? 'Chat deleted and closed' : 'You left the chat');
      
      // Always close the popup after ending chat
      // Reset state
      setChatStarted(false);
      setSession(null);
      setMessages([]);
      setOtherPartyLeft(false);
      setMemberLeft(false);
      
      // Cleanup socket listeners
      socketService.offNewMessage();
      socketService.offUserTyping();
      socketService.offMessagesRead();
      socketService.offSessionClosed();
      
      // Close the window
      onClose();
    } catch (error) {
      console.error('Error ending chat:', error);
      toast.error('Failed to end chat');
    }
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-24 z-50">
        <button
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg text-white font-bold"
          style={{ background: 'linear-gradient(135deg, #011039 0%, #E76800 100%)' }}
        >
          <MessageCircle className="h-4 w-4" />
          Live Support
          {session?.unreadCountMember > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-red-500 rounded-full text-xs">
              {session.unreadCountMember}
            </span>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-96 h-[32rem] bg-white rounded-lg shadow-2xl flex flex-col overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 text-white"
        style={{ background: 'linear-gradient(135deg, #011039 0%, #E76800 100%)' }}
      >
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <h3 className="font-bold">Live Support</h3>
        </div>
        <div className="flex items-center gap-2">
          {!chatStarted ? (
            <button
              onClick={onClose}
              className="hover:bg-white hover:bg-opacity-20 p-1.5 rounded transition"
              title="Close"
            >
              <X className="h-4 w-4" />
            </button>
          ) : (
            <>
              <button
                onClick={() => setIsMinimized(true)}
                className="hover:bg-white hover:bg-opacity-20 p-1.5 rounded transition"
                title="Minimize"
              >
                <Minimize2 className="h-4 w-4" />
              </button>
              {session && (
                <button
                  onClick={handleEndChat}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-md text-xs font-bold transition-all duration-200 border border-white border-opacity-30"
                  title="End and delete this conversation"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  End Chat
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {!chatStarted ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <MessageCircle className="h-16 w-16 text-gray-300 mb-4" />
            <p className="text-gray-600 text-lg font-bold mb-2">
              {hasExistingSession ? 'Welcome back!' : 'Welcome! How can we help you today?'}
            </p>
            <p className="text-gray-400 text-sm mb-6">
              {hasExistingSession 
                ? 'You have an ongoing conversation. Click below to continue.'
                : 'Click the button below to start chatting with our support team'}
            </p>
            <button
              onClick={handleStartChat}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-orange-500 text-white rounded-lg font-bold hover:from-blue-700 hover:to-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                'Loading...'
              ) : hasExistingSession ? (
                <>
                  <MessageCircle className="h-5 w-5" />
                  Resume Chat
                </>
              ) : (
                'Start Chat'
              )}
            </button>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-500">Loading messages...</div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <MessageCircle className="h-12 w-12 text-gray-300 mb-3" />
            <p className="text-gray-500 text-sm">
              Welcome! How can we help you today?
            </p>
            <p className="text-gray-400 text-xs mt-2">
              Send a message to start chatting with support
            </p>
          </div>
        ) : (
          <>
            {messages.map((msg) => {
              // System message - centered
              if (msg.isSystemMessage || msg.senderType === 'system') {
                return (
                  <div key={msg._id} className="flex justify-center my-4">
                    <div className="px-4 py-2 bg-gray-200 text-gray-600 rounded-full text-sm">
                      {msg.message}
                    </div>
                  </div>
                );
              }

              // Regular message
              const isOwn = msg.senderType === 'student';
              return (
                <div
                  key={msg._id}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[75%] rounded-lg px-4 py-2 ${
                      isOwn
                        ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white'
                        : 'bg-white text-gray-800 border border-gray-200'
                    }`}
                  >
                    {!isOwn && (
                      <p className="text-xs font-bold mb-1" style={{ color: '#011039' }}>
                        {msg.senderName}
                      </p>
                    )}
                    <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                    <p className={`text-xs mt-1 ${isOwn ? 'text-orange-100' : 'text-gray-400'}`}>
                      {new Date(msg.createdAt).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-lg px-4 py-2">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      {chatStarted && (
        <div className="border-t border-gray-200 p-3 bg-white">
          {otherPartyLeft || memberLeft ? (
            <div className="text-center py-3 text-sm text-gray-500 bg-gray-50 rounded-lg">
              <p className="font-bold">This conversation has ended</p>
              <p className="text-xs mt-1">No new messages can be sent</p>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={handleTyping}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                disabled={sending || !session}
              />
              <button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || sending || !session}
                className="px-4 py-2 rounded-lg text-white font-bold transition disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: newMessage.trim() ? '#E76800' : '#9CA3AF' }}
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
