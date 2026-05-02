import { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/Loading';
import { chatService } from '@/services/chatService';
import socketService from '@/lib/socket';
import { useMemberAuthStore } from '@/store/memberAuthStore';
import {
  MessageCircle,
  Send,
  CheckCheck,
  XCircle,
  Search,
  Trash2
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ChatHistory() {
  const { student } = useMemberAuthStore();
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [adminLeft, setAdminLeft] = useState(false);
  const [memberLeft, setMemberLeft] = useState(false);
  const [activeTab, setActiveTab] = useState('active'); // 'active' or 'closed'
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    loadSessions();
    
    // Connect socket only (don't join any room until selecting a session)
    socketService.connect();

    // Listen for new messages (only update if for selected session)
    socketService.onNewMessage((message) => {
      console.log('📨 Member received new message:', message);
      
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
                unreadCountMember: message.senderType === 'admin' ? session.unreadCountMember + 1 : session.unreadCountMember,
              }
            : session
        )
      );
    });

    // Listen for typing indicator
    socketService.onUserTyping(({ userName, isTyping }) => {
      setIsTyping(isTyping);
    });

    // Listen for session closed
    socketService.onSessionClosed((data) => {
      console.log('Member received session_closed event:', data);
      
      if (data.closedBy === 'admin') {
        toast.info('Support has ended the conversation');
        
        // Reload sessions to update tabs
        loadSessions();
        
        // If this is the currently selected session, update its state
        if (selectedSession && selectedSession._id === data.sessionId) {
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
      socketService.offUserTyping();
      socketService.offSessionClosed();
    };
  }, [student]);

  useEffect(() => {
    if (selectedSession && student) {
      console.log('Member selecting session:', selectedSession._id);
      loadMessages(selectedSession._id);
      
      // Only join session room when actually selecting it
      const userId = student.id || student._id;
      console.log('Member joining session room:', selectedSession._id);
      socketService.joinChat(userId, 'student', selectedSession._id);
    }
  }, [selectedSession, student]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadSessions = async () => {
    try {
      setLoading(true);
      // Load member's chat sessions
      const response = await chatService.getMemberSessions();
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
      const response = await chatService.getMessages(sessionId);
      setMessages(response.data || []);
      
      // Mark as read
      await chatService.markAsRead(sessionId);
      socketService.markAsRead(sessionId, 'student');
      
      // Update local session unread count
      setSessions((prev) =>
        prev.map((session) =>
          session._id === sessionId ? { ...session, unreadCountMember: 0 } : session
        )
      );
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Failed to load messages');
    }
  };

  const handleSelectSession = async (session) => {
    setSelectedSession(session);
    setAdminLeft(session.adminLeft || false);
    setMemberLeft(session.memberLeft || false);
    try {
      const response = await chatService.getMessages(session._id);
      setMessages(response.data || []);
      
      // Mark as read
      await chatService.markAsRead(session._id);
      socketService.markAsRead(session._id, 'student');
      
      // Update local state
      setSessions(prev =>
        prev.map(s =>
          s._id === session._id
            ? { ...s, unreadCountMember: 0 }
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
    if (!newMessage.trim() || !selectedSession || sending || adminLeft || memberLeft) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    setSending(true);

    try {
      const userId = student.id || student._id;
      const messageData = {
        sessionId: selectedSession._id,
        senderId: userId,
        senderType: 'student',
        senderName: student.name || 'Student',
        senderModel: 'Member',
        message: messageText,
      };
      
      console.log('Member sending message:', messageData);
      
      // Send via socket
      socketService.sendMessage(messageData);

      // Stop typing indicator
      socketService.sendTyping(selectedSession._id, student.name || 'Student', false);
      
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
    socketService.sendTyping(selectedSession._id, student.name || 'Student', true);

    // Stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      socketService.sendTyping(selectedSession._id, student.name || 'Student', false);
    }, 2000);
  };

  const handleCloseSession = async (sessionId) => {
    try {
      const response = await chatService.closeSessionStudent(sessionId);
      
      // Add system message to current messages if available
      if (response.systemMessage && selectedSession?._id === sessionId) {
        setMessages(prev => [...prev, response.systemMessage]);
      }
      
      toast.success(response.deleted ? 'Chat deleted' : 'You left the chat');
      
      // Update memberLeft state
      setMemberLeft(true);
      
      // Remove from local state if deleted
      if (response.deleted) {
        setSessions(prev => prev.filter(s => s._id !== sessionId));
        setSelectedSession(null);
        setMessages([]);
        setAdminLeft(false);
        setMemberLeft(false);
      } else {
        // Update the session in the list
        setSessions(prev => prev.map(s => 
          s._id === sessionId ? { ...s, memberLeft: true, status: 'closed' } : s
        ));
      }
    } catch (error) {
      console.error('Error closing session:', error);
      toast.error('Failed to delete session');
    }
  };

  const handleDeleteSession = async (sessionId) => {
    try {
      await chatService.deleteMemberSession(sessionId);
      toast.success('Chat permanently deleted');
      
      // Remove from local state immediately
      setSessions(prev => prev.filter(s => s._id !== sessionId));
      
      if (selectedSession?._id === sessionId) {
        setSelectedSession(null);
        setMessages([]);
        setAdminLeft(false);
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
        return !session.adminLeft && !session.memberLeft; // Active: neither party has left
      } else {
        return session.adminLeft || session.memberLeft; // Closed: either party has left
      }
    })
    .filter((session) =>
      session.memberName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.lastMessage?.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const activeChatCount = sessions.filter(s => !s.adminLeft && !s.memberLeft).length;
  const closedChatCount = sessions.filter(s => s.adminLeft || s.memberLeft).length;
  const totalUnread = sessions.reduce((sum, session) => sum + session.unreadCountMember, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: '#011039' }}>
            My Support Chats
          </h1>
          <p className="text-gray-600 mt-1">
            View and manage your support conversations
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
                  <MessageCircle className="h-5 w-5" style={{ color: '#E76800' }} />
                  Conversations
                </CardTitle>

                {/* Tabs */}
                <div className="flex gap-2 border-b border-gray-200">
                  <button
                    onClick={() => setActiveTab('active')}
                    className={`flex-1 px-4 py-2 text-sm font-medium transition-colors relative ${
                      activeTab === 'active'
                        ? 'border-b-2'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                    style={activeTab === 'active' ? { color: '#E76800', borderColor: '#E76800' } : {}}
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
                        ? 'border-b-2'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                    style={activeTab === 'closed' ? { color: '#E76800', borderColor: '#E76800' } : {}}
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
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                    style={{ '--tw-ring-color': '#E76800' }}
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
                      ? 'Start a new conversation using the chat button'
                      : 'No closed conversations yet'}
                  </p>
                </div>
              ) : (
                <div className="divide-y max-h-[600px] overflow-y-auto">
                  {filteredSessions.map((session) => (
                    <div
                      key={session._id}
                      className={`p-4 transition hover:bg-gray-50 ${
                        selectedSession?._id === session._id ? 'bg-orange-50 border-l-4' : ''
                      }`}
                      style={selectedSession?._id === session._id ? { borderColor: '#E76800' } : {}}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div 
                          className="flex-1 min-w-0 cursor-pointer"
                          onClick={() => handleSelectSession(session)}
                        >
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900 truncate">
                              Support Chat
                            </p>
                            {session.unreadCountMember > 0 && (
                              <span className="flex items-center justify-center px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                                {session.unreadCountMember}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 truncate mt-1">{session.lastMessage || 'No messages yet'}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(session.lastMessageTime).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div 
                            className={`w-2 h-2 rounded-full ${session.adminLeft ? 'bg-gray-400' : 'bg-green-500'}`}
                            title={session.adminLeft ? 'Closed' : 'Active'}
                          ></div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteSession(session._id);
                            }}
                            className="p-1 hover:bg-red-100 rounded transition text-gray-400 hover:text-red-600"
                            title="Delete chat"
                          >
                            <Trash2 className="h-4 w-4" />
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
                    <CardTitle>Support Chat</CardTitle>
                    <p className="text-sm text-gray-500 mt-1">
                      {selectedSession.adminLeft ? 'Closed by support' : 'Active conversation'}
                    </p>
                  </div>
                  {!adminLeft && !memberLeft && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCloseSession(selectedSession._id)}
                      className="text-red-600 border-red-600 hover:bg-red-50"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      End Chat
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
                      const isOwn = msg.senderType === 'student';
                      return (
                        <div key={msg._id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                          <div
                            className={`max-w-[75%] rounded-lg px-4 py-2 ${
                              isOwn
                                ? 'text-white'
                                : 'bg-white text-gray-800 border border-gray-200'
                            }`}
                            style={isOwn ? { background: 'linear-gradient(135deg, #011039 0%, #E76800 100%)' } : {}}
                          >
                            {!isOwn && (
                              <p className="text-xs font-semibold mb-1" style={{ color: '#E76800' }}>
                                {msg.senderName}
                              </p>
                            )}
                            <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <p className={`text-xs ${isOwn ? 'text-orange-100' : 'text-gray-400'}`}>
                                {new Date(msg.createdAt).toLocaleTimeString('en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </p>
                              {isOwn && msg.isRead && <CheckCheck className="h-3 w-3 text-orange-200" />}
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

              {/* Input - Read-only message */}
              <div className="border-t p-4 bg-white">
                <div className="text-center py-3 text-sm text-gray-500 bg-gray-50 rounded-lg">
                  <p className="font-medium">View-only mode</p>
                  <p className="text-xs mt-1">Use the chat button to send messages</p>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="h-[700px] flex items-center justify-center">
              <div className="text-center text-gray-500">
                <MessageCircle className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg">Select a conversation to view chat</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
