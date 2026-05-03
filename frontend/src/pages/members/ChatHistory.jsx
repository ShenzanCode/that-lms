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
    <div className="space-y-8">
      {/* Page Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#011039] to-[#011039]/90 rounded-xl p-8 sm:p-10 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Support History</h1>
            <p className="text-slate-300 mt-2 text-lg">
              View and manage your conversations with library support
              {totalUnread > 0 && (
                <span className="ml-3 px-3 py-1 bg-[#E76800] text-white text-xs font-black uppercase rounded-full shadow-lg shadow-orange-600/30 inline-block">
                  {totalUnread} new message{totalUnread > 1 ? 's' : ''}
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-64 h-64 bg-[#E76800]/10 rounded-full blur-3xl"></div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Sessions List */}
        <div className="col-span-12 lg:col-span-4">
          <Card className="border-none shadow-sm rounded-xl overflow-hidden bg-white h-[750px] flex flex-col">
            <div className="p-8 border-b border-slate-50">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
                    <MessageCircle className="h-5 w-5 text-[#E76800]" />
                  </div>
                  <h2 className="text-xl font-extrabold text-[#011039]">Conversations</h2>
                </div>

                {/* Tabs */}
                <div className="flex p-1.5 bg-slate-50 rounded-xl mb-6">
                  {[
                    { id: 'active', label: 'Active', count: activeChatCount },
                    { id: 'closed', label: 'History', count: closedChatCount }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex-1 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
                        activeTab === tab.id
                          ? 'bg-white text-[#011039] shadow-sm'
                          : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      {tab.label}
                      {tab.count > 0 && (
                        <span className={`ml-2 px-1.5 py-0.5 rounded-md text-[10px] ${activeTab === tab.id ? 'bg-[#011039] text-white' : 'bg-slate-200 text-slate-500'}`}>
                          {tab.count}
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                {/* Search */}
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-[#E76800] transition-colors" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search messages..."
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border-2 border-transparent rounded-lg focus:outline-none focus:border-orange-100 focus:bg-white transition-all text-sm font-bold text-slate-600 placeholder:text-slate-300"
                  />
                </div>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-full gap-4">
                  <LoadingSpinner size="md" />
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Synchronizing...</p>
                </div>
              ) : filteredSessions.length === 0 ? (
                <div className="text-center p-12 h-full flex flex-col items-center justify-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                    <MessageCircle className="h-8 w-8 text-slate-200" />
                  </div>
                  <p className="text-sm font-bold text-[#011039]">No conversations</p>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    {activeTab === 'active'
                      ? 'Click the chat icon in the bottom right to start a new support request.'
                      : 'You have no archived conversations.'}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {filteredSessions.map((session) => (
                    <div
                      key={session._id}
                      className={`p-6 transition-all cursor-pointer hover:bg-slate-50 relative group ${
                        selectedSession?._id === session._id ? 'bg-orange-50/50' : ''
                      }`}
                      onClick={() => handleSelectSession(session)}
                    >
                      {selectedSession?._id === session._id && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#E76800] rounded-r-full"></div>
                      )}
                      
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-extrabold text-[#011039] text-sm truncate">
                              Support Representative
                            </p>
                            {session.unreadCountMember > 0 && (
                              <span className="flex items-center justify-center w-5 h-5 bg-[#E76800] text-white text-[10px] font-black rounded-full shadow-sm shadow-orange-600/30">
                                {session.unreadCountMember}
                              </span>
                            )}
                          </div>
                          <p className={`text-xs truncate ${selectedSession?._id === session._id ? 'text-slate-600 font-bold' : 'text-slate-400 font-medium'}`}>
                            {session.lastMessage || 'Starting conversation...'}
                          </p>
                          <p className="text-[10px] text-slate-300 font-bold mt-2 uppercase tracking-tight">
                            {new Date(session.lastMessageTime).toLocaleDateString()} at {new Date(session.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                           <div className={`w-2 h-2 rounded-full ${session.adminLeft ? 'bg-slate-200' : 'bg-[#E76800] shadow-[0_0_8px_rgba(231,104,0,0.5)]'}`}></div>
                           <button
                             onClick={(e) => {
                               e.stopPropagation();
                               handleDeleteSession(session._id);
                             }}
                             className="p-2 hover:bg-red-50 rounded-lg transition-all text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100"
                           >
                             <Trash2 className="h-3.5 w-3.5" />
                           </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Chat Window */}
        <div className="col-span-12 lg:col-span-8">
          {selectedSession ? (
            <Card className="border-none shadow-sm rounded-xl overflow-hidden bg-white h-[750px] flex flex-col">
              <div className="p-6 sm:px-10 sm:py-8 border-b border-slate-50 bg-slate-50/30 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#011039] flex items-center justify-center text-white font-black shadow-lg shadow-blue-900/20">
                      SR
                    </div>
                    <div>
                      <h3 className="text-lg font-extrabold text-[#011039]">Support Chat</h3>
                      <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${selectedSession.adminLeft ? 'bg-slate-300' : 'bg-green-500'}`}></div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                          {selectedSession.adminLeft ? 'Session Archived' : 'Live support active'}
                        </p>
                      </div>
                    </div>
                  </div>
                  {!adminLeft && !memberLeft && (
                    <Button
                      onClick={() => handleCloseSession(selectedSession._id)}
                      className="bg-red-50 hover:bg-red-100 text-red-500 border-none px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Leave chat
                    </Button>
                  )}
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-6 sm:p-10 space-y-6 bg-[#F8F9FA]/50 custom-scrollbar">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-4">
                        <MessageCircle className="h-8 w-8 text-slate-100" />
                    </div>
                    <p className="text-sm font-bold text-slate-300 uppercase tracking-widest">Initializing sequence...</p>
                  </div>
                ) : (
                  <>
                    {messages.map((msg) => {
                      if (msg.isSystemMessage || msg.senderType === 'system') {
                        return (
                          <div key={msg._id} className="flex justify-center my-8">
                            <div className="px-5 py-2 bg-slate-100/50 backdrop-blur-sm border border-slate-100 text-slate-400 font-bold rounded-xl text-[10px] uppercase tracking-widest shadow-sm">
                              {msg.message}
                            </div>
                          </div>
                        );
                      }

                      const isOwn = msg.senderType === 'student';
                      return (
                        <div key={msg._id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'} animate-in fade-in zoom-in-95 duration-300`}>
                          <div
                            className={`max-w-[80%] sm:max-w-[70%] group relative ${
                              isOwn
                                ? 'bg-white text-slate-600 rounded-xl rounded-tr-none border-2 border-slate-50'
                                : 'bg-[#011039] text-white rounded-xl rounded-tl-none shadow-xl shadow-blue-900/10'
                            } p-4 sm:p-5 transition-transform`}
                          >
                            {!isOwn && (
                              <p className="text-[10px] font-black uppercase tracking-widest mb-2 text-orange-400">
                                {msg.senderName}
                              </p>
                            )}
                            <p className="text-sm leading-relaxed font-medium whitespace-pre-wrap break-words">{msg.message}</p>
                            <div className={`flex items-center gap-2 mt-4 pt-3 border-t ${isOwn ? 'border-slate-50' : 'border-white/10'}`}>
                              <p className={`text-[10px] font-black uppercase tracking-tighter ${isOwn ? 'text-slate-300' : 'text-white/40'}`}>
                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                              {isOwn && (
                                <div className="ml-auto">
                                    {msg.isRead ? (
                                        <CheckCheck className="h-3 w-3 text-blue-500" />
                                    ) : (
                                        <div className="w-2.5 h-2.5 rounded-full border-2 border-slate-200"></div>
                                    )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {isTyping && (
                      <div className="flex justify-start animate-in fade-in slide-in-from-left-2">
                        <div className="bg-[#011039] rounded-xl rounded-tl-none px-5 py-4 shadow-lg shadow-blue-900/10">
                          <div className="flex gap-1.5">
                            <span className="w-2 h-2 bg-orange-400 rounded-full animate-bounce"></span>
                            <span className="w-2 h-2 bg-orange-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                            <span className="w-2 h-2 bg-orange-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Input Message Overlay */}
              <div className="p-8 sm:px-10 border-t border-slate-50 bg-white">
                <div className="bg-slate-50 rounded-xl p-6 text-center border-2 border-dashed border-slate-100">
                  <div className="flex items-center justify-center gap-4 mb-2">
                    <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-[#011039]">Historical Record</p>
                    <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                  </div>
                  <p className="text-xs font-bold text-slate-400 leading-relaxed">
                    This window is for reviewing your history. To send a new message, please use the <span className="text-[#E76800]">live chat widget</span> located in the bottom right of your screen.
                  </p>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="border-none shadow-sm rounded-xl overflow-hidden bg-white h-[750px] flex items-center justify-center p-12 text-center group">
              <div className="max-w-xs">
                <div className="relative mb-8 inline-block">
                    <div className="absolute inset-0 bg-orange-50 rounded-full blur-2xl transition-transform duration-700"></div>
                    <div className="relative w-24 h-24 bg-white rounded-full shadow-sm flex items-center justify-center border border-slate-50">
                        <MessageCircle className="h-10 w-10 text-slate-100 transition-colors duration-500" />
                    </div>
                </div>
                <h3 className="text-xl font-extrabold text-[#011039]">Select a conversation</h3>
                <p className="text-sm font-medium text-slate-400 mt-3 leading-relaxed">
                    Pick a discussion from the list to view the full message history and resolution status.
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
