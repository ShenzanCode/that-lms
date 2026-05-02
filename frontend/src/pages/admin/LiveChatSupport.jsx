import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/Loading';
import { chatService } from '@/services/chatService';
import socketService from '@/lib/socket';
import { useAuthStore } from '@/store/authStore';
import {
  MessageCircle,
  Send,
  CheckCheck,
  Clock,
  XCircle,
  Search,
  Filter
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function LiveChatSupport() {
  const { user } = useAuthStore();
  const location = useLocation();
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [memberLeft, setMemberLeft] = useState(false);
  const [adminLeft, setAdminLeft] = useState(false);
  const [activeTab, setActiveTab] = useState('active'); // 'active' or 'closed'
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Check if we need to open a specific session (from popup)
  useEffect(() => {
    if (location.state?.openSessionId && sessions.length > 0) {
      const sessionToOpen = sessions.find(s => s._id === location.state.openSessionId);
      if (sessionToOpen) {
        handleSelectSession(sessionToOpen);
        // Clear the navigation state
        window.history.replaceState({}, document.title);
      }
    }
  }, [location.state, sessions]);

  useEffect(() => {
    loadSessions();
    
    // Connect socket
    socketService.connect();

    // Listen for new messages (only update if for selected session)
    socketService.onNewMessage((message) => {
      console.log('📨 Admin received new message:', message);
      
      // Only update messages if this is for the currently selected session
      if (selectedSession && message.sessionId === selectedSession._id) {
        setMessages((prev) => {
          const exists = prev.some(m => m._id === message._id);
          if (exists) return prev;
          return [...prev, message];
        });
      }
      
      // Always update session list
      setSessions((prev) =>
        prev.map((session) =>
          session._id === message.sessionId
            ? {
                ...session,
                lastMessage: message.message.substring(0, 100),
                lastMessageTime: message.createdAt,
                unreadCountAdmin: message.senderType === 'student' ? session.unreadCountAdmin + 1 : session.unreadCountAdmin,
              }
            : session
        )
      );
    });

    // Listen for new chat notifications
    socketService.onNewChatNotification((data) => {
      toast.success(`New message from ${data.memberName}`);
      loadSessions();
    });

    // Listen for typing indicator
    socketService.onUserTyping(({ userName, isTyping }) => {
      setIsTyping(isTyping);
    });

    // Listen for session closed
    socketService.onSessionClosed((data) => {
      console.log('Admin received session_closed event:', data);
      
      // Update sessions list
      loadSessions();
      
      // If this is the currently selected session, update its state immediately
      if (selectedSession && selectedSession._id === data.sessionId) {
        if (data.closedBy === 'member') {
          toast.info(`${data.closerName} has ended the conversation`);
          setMemberLeft(true);
          
          // Add system message if available
          if (data.systemMessage) {
            setMessages(prev => [...prev, data.systemMessage]);
          }
        } else if (data.closedBy === 'admin') {
          // Admin closed from another tab/window - disable controls here too
          setAdminLeft(true);
          
          // Add system message if available
          if (data.systemMessage) {
            setMessages(prev => [...prev, data.systemMessage]);
          }
        }
      }
    });

    return () => {
      socketService.offNewMessage();
      socketService.offNewChatNotification();
      socketService.offUserTyping();
      socketService.offSessionClosed();
    };
  }, [user]);

  useEffect(() => {
    if (selectedSession) {
      console.log('Admin selecting session:', selectedSession._id);
      loadMessages(selectedSession._id);
      
      // Only join session room when actually selecting it
      const userId = user.id || user._id;
      console.log('Admin joining session room:', selectedSession._id);
      socketService.joinChat(userId, 'admin', selectedSession._id);
    }
  }, [selectedSession, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadSessions = async () => {
    try {
      setLoading(true);
      // Load all sessions where admin hasn't left
      const response = await chatService.getAllSessions('all');
      setSessions(response.data || []);
    } catch (error) {
      console.error('Error loading sessions:', error);
      toast.error('Failed to load chat sessions');
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (sessionId) => {
    try {
      const response = await chatService.getAdminMessages(sessionId);
      setMessages(response.data || []);
      
      // Mark as read
      await chatService.markAsReadAdmin(sessionId);
      socketService.markAsRead(sessionId, 'admin');
      
      // Update local session unread count
      setSessions((prev) =>
        prev.map((session) =>
          session._id === sessionId ? { ...session, unreadCountAdmin: 0 } : session
        )
      );
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Failed to load messages');
    }
  };

  const handleSelectSession = async (session) => {
    setSelectedSession(session);
    setMemberLeft(session.memberLeft || false);
    setAdminLeft(session.adminLeft || false);
    try {
      const response = await chatService.getAdminMessages(session._id);
      setMessages(response.data || []);
      
      // Mark as read
      await chatService.markAsReadAdmin(session._id);
      socketService.markAsRead(session._id, 'admin');
      
      // Update local state
      setSessions(prev =>
        prev.map(s =>
          s._id === session._id
            ? { ...s, unreadCountAdmin: 0 }
            : s
        )
      );
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Failed to load messages');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedSession || sending || memberLeft || adminLeft) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    setSending(true);

    try {
      const userId = user.id || user._id;
      const messageData = {
        sessionId: selectedSession._id,
        senderId: userId,
        senderType: 'admin',
        senderName: user.name || 'Admin',
        senderModel: 'Librarian',
        message: messageText,
      };
      
      console.log('Admin sending message:', messageData);
      
      // Send via socket
      socketService.sendMessage(messageData);

      // Stop typing indicator
      socketService.sendTyping(selectedSession._id, 'Support', false);
      
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);

    if (!selectedSession) return;

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Send typing indicator
    socketService.sendTyping(selectedSession._id, 'Support', true);

    // Stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      socketService.sendTyping(selectedSession._id, 'Support', false);
    }, 2000);
  };

  const handleCloseSession = async (sessionId) => {
    // Instantly disable controls if this is the selected session
    if (selectedSession?._id === sessionId) {
      setAdminLeft(true);
    }
    
    try {
      const response = await chatService.closeSession(sessionId);
      
      // Add system message to current messages if available
      if (response.systemMessage && selectedSession?._id === sessionId) {
        setMessages(prev => [...prev, response.systemMessage]);
      }
      
      toast.success(response.deleted ? 'Chat deleted' : 'You left the chat');
      
      // Update adminLeft state
      setAdminLeft(true);
      
      // Remove from local state if deleted
      if (response.deleted) {
        setSessions(prev => prev.filter(s => s._id !== sessionId));
        setSelectedSession(null);
        setMessages([]);
        setMemberLeft(false);
        setAdminLeft(false);
      } else {
        // Update the session in the list
        setSessions(prev => prev.map(s => 
          s._id === sessionId ? { ...s, adminLeft: true, status: 'closed' } : s
        ));
      }
    } catch (error) {
      console.error('Error closing session:', error);
      toast.error('Failed to delete session');
    }
  };

  const handleDeleteSession = async (sessionId) => {
    try {
      await chatService.deleteSession(sessionId);
      toast.success('Chat permanently deleted');
      
      // Remove from local state immediately
      setSessions(prev => prev.filter(s => s._id !== sessionId));
      
      if (selectedSession?._id === sessionId) {
        setSelectedSession(null);
        setMessages([]);
        setMemberLeft(false);
      }
    } catch (error) {
      console.error('Error deleting session:', error);
      toast.error('Failed to delete session');
    }
  };

  const filteredSessions = sessions
    .filter((session) => {
      // Filter by tab
      if (activeTab === 'active') {
        return !session.memberLeft && !session.adminLeft; // Active: neither party has left
      } else {
        return session.memberLeft || session.adminLeft; // Closed: either party has left
      }
    })
    .filter((session) =>
      session.memberName?.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const activeChatCount = sessions.filter(s => !s.memberLeft && !s.adminLeft).length;
  const closedChatCount = sessions.filter(s => s.memberLeft || s.adminLeft).length;
  const totalUnread = sessions.reduce((sum, session) => sum + session.unreadCountAdmin, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: '#011039' }}>
            Live Chat Support
          </h1>
          <p className="text-gray-600 mt-1">
            Real-time student support chat (No history saved)
            {totalUnread > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                {totalUnread} unread
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Sessions List */}
        <div className="col-span-12 lg:col-span-4">
          <Card>
            <CardHeader>
              <div className="space-y-4">
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-primary-600" />
                  Conversations
                </CardTitle>

                {/* Tabs */}
                <div className="flex gap-2 border-b border-gray-200">
                  <button
                    onClick={() => setActiveTab('active')}
                    className={`flex-1 px-4 py-2 text-sm font-medium transition-colors relative ${
                      activeTab === 'active'
                        ? 'text-orange-600 border-b-2 border-orange-600'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Active Chats
                    {activeChatCount > 0 && (
                      <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                        {activeChatCount}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab('closed')}
                    className={`flex-1 px-4 py-2 text-sm font-medium transition-colors relative ${
                      activeTab === 'closed'
                        ? 'text-orange-600 border-b-2 border-orange-600'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Closed
                    {closedChatCount > 0 && (
                      <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full">
                        {closedChatCount}
                      </span>
                    )}
                  </button>
                </div>

                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search conversations..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center p-8">
                  <LoadingSpinner />
                </div>
              ) : filteredSessions.length === 0 ? (
                <div className="text-center p-8 text-gray-500">
                  <MessageCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p className="font-medium">
                    {activeTab === 'active' ? 'No active chats' : 'No closed chats'}
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    {activeTab === 'active'
                      ? 'Waiting for students to start a conversation'
                      : 'No closed conversations yet'}
                  </p>
                </div>
              ) : (
                <div className="divide-y max-h-[600px] overflow-y-auto">
                  {filteredSessions.map((session) => (
                    <div
                      key={session._id}
                      className={`p-4 transition hover:bg-gray-50 ${
                        selectedSession?._id === session._id ? 'bg-blue-50 border-l-4 border-primary-600' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div 
                          className="flex-1 min-w-0 cursor-pointer"
                          onClick={() => handleSelectSession(session)}
                        >
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900 truncate">{session.memberName}</p>
                            {session.unreadCountAdmin > 0 && (
                              <span className="flex items-center justify-center px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                                {session.unreadCountAdmin}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 truncate mt-1">{session.lastMessage || 'No messages yet'}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(session.lastMessageTime).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full" title="Active"></div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteSession(session._id);
                            }}
                            className="p-1 hover:bg-red-100 rounded transition text-gray-400 hover:text-red-600"
                            title="Permanently delete chat"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Chat Window */}
        <div className="col-span-12 lg:col-span-8">
          {selectedSession ? (
            <Card className="h-[700px] flex flex-col">
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{selectedSession.memberName}</CardTitle>
                    <p className="text-sm text-gray-500 mt-1">
                      Member ID: {selectedSession.memberId?.memberId || 'N/A'}
                    </p>
                  </div>
                  {!memberLeft && !adminLeft && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCloseSession(selectedSession._id)}
                      className="flex items-center gap-2 px-4 py-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors"
                    >
                      <XCircle className="h-4 w-4" />
                      <span>End Conversation</span>
                    </Button>
                  )}
                </div>
              </CardHeader>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    No messages yet
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
                      const isOwn = msg.senderType === 'admin';
                      return (
                        <div key={msg._id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                          <div
                            className={`max-w-[75%] rounded-lg px-4 py-2 ${
                              isOwn
                                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                                : 'bg-white text-gray-800 border border-gray-200'
                            }`}
                          >
                            {!isOwn && (
                              <p className="text-xs font-semibold mb-1" style={{ color: '#011039' }}>
                                {msg.senderName}
                              </p>
                            )}
                            <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <p className={`text-xs ${isOwn ? 'text-blue-100' : 'text-gray-400'}`}>
                                {new Date(msg.createdAt).toLocaleTimeString('en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </p>
                              {isOwn && msg.isRead && <CheckCheck className="h-3 w-3 text-blue-200" />}
                            </div>
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
              <div className="border-t p-4 bg-white">
                {memberLeft || adminLeft ? (
                  <div className="text-center py-3 text-sm text-gray-500 bg-gray-50 rounded-lg">
                    <p className="font-medium">This conversation has ended</p>
                    <p className="text-xs mt-1">No new messages can be sent</p>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={handleTyping}
                      onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                      placeholder="Type your message..."
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      disabled={sending}
                    />
                    <Button onClick={handleSendMessage} disabled={!newMessage.trim() || sending}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ) : (
            <Card className="h-[700px] flex items-center justify-center">
              <div className="text-center text-gray-500">
                <MessageCircle className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg">Select a conversation to start chatting</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
