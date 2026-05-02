import api from '../lib/axios';

export const chatService = {
  // Get or create chat session for student
  getOrCreateSession: async () => {
    const response = await api.get('/chat/session');
    return response.data;
  },

  // Get messages for a session
  getMessages: async (sessionId, limit = 50, skip = 0) => {
    const response = await api.get(`/chat/messages/${sessionId}`, {
      params: { limit, skip }
    });
    return response.data;
  },

  // Get all sessions (admin only)
  getAllSessions: async (status = 'active') => {
    const response = await api.get('/chat/sessions', {
      params: { status }
    });
    return response.data;
  },

  // Get messages for admin
  getAdminMessages: async (sessionId, limit = 50, skip = 0) => {
    const response = await api.get(`/chat/admin/messages/${sessionId}`, {
      params: { limit, skip }
    });
    return response.data;
  },

  // Mark messages as read
  markAsRead: async (sessionId) => {
    const response = await api.patch(`/chat/session/${sessionId}/read`);
    return response.data;
  },

  // Mark messages as read (admin)
  markAsReadAdmin: async (sessionId) => {
    const response = await api.patch(`/chat/admin/session/${sessionId}/read`);
    return response.data;
  },

  // Close session (student)
  closeSessionStudent: async (sessionId) => {
    const response = await api.patch(`/chat/session/${sessionId}/close`);
    return response.data;
  },

  // Close session (admin only)
  closeSession: async (sessionId) => {
    const response = await api.patch(`/chat/admin/session/${sessionId}/close`);
    return response.data;
  },

  // Permanently delete session (admin only)
  deleteSession: async (sessionId) => {
    const response = await api.delete(`/chat/admin/session/${sessionId}`);
    return response.data;
  },

  // Get member's own chat sessions
  getMemberSessions: async () => {
    const response = await api.get('/chat/member/sessions');
    return response.data;
  },

  // Permanently delete session (member)
  deleteMemberSession: async (sessionId) => {
    const response = await api.delete(`/chat/member/session/${sessionId}`);
    return response.data;
  },
};
