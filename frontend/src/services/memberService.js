import api from '../lib/axios'

export const memberService = {
  getMembers: async (params) => {
    const response = await api.get('/members', { params })
    return response.data
  },

  getMember: async (id) => {
    const response = await api.get(`/members/${id}`)
    return response.data
  },

  createMember: async (memberData) => {
    const response = await api.post('/members', memberData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },

  updateMember: async (id, memberData) => {
    const response = await api.put(`/members/${id}`, memberData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },

  updateMemberPhoto: async (id, photoData) => {
    const response = await api.patch(`/members/${id}/photo`, photoData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },

  deleteMember: async (id, force = false) => {
    const response = await api.delete(`/members/${id}`, {
      params: { force: force ? 'true' : 'false' }
    })
    return response.data
  },

  checkMemberStatus: async (id) => {
    const response = await api.get(`/members/${id}/status`)
    return response.data
  },

  blockMember: async (id, reason, force = false) => {
    const response = await api.patch(`/members/${id}/block`, { reason, force })
    return response.data
  },

  unblockMember: async (id) => {
    const response = await api.patch(`/members/${id}/unblock`)
    return response.data
  },

  bulkImport: async (members) => {
    const response = await api.post('/members/bulk-import', { members })
    return response.data
  },

  getMemberHistory: async (id, params) => {
    const response = await api.get(`/members/${id}/history`, { params })
    return response.data
  },

  getPendingMembers: async () => {
    const response = await api.get('/members/pending')
    return response.data
  },

  approveMember: async (id) => {
    const response = await api.patch(`/members/${id}/approve`)
    return response.data
  },

  rejectMember: async (id, reason) => {
    const response = await api.patch(`/members/${id}/reject`, { reason })
    return response.data
  },
}
