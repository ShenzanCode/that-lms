import api from '../lib/axios'

export const fineService = {
  getFines: async (params) => {
    const response = await api.get('/fines', { params })
    return response.data
  },

  getMemberFines: async (memberId) => {
    const response = await api.get(`/fines/member/${memberId}`)
    return response.data
  },

  payFine: async (data) => {
    const response = await api.post('/fines/payment', data)
    return response.data
  },

  waiveFine: async (id, data) => {
    const response = await api.patch(`/fines/${id}/waive`, data)
    return response.data
  },

  getFineStats: async () => {
    const response = await api.get('/fines/stats')
    return response.data
  },

  notifyFine: async (id) => {
    const response = await api.post(`/fines/${id}/notify`)
    return response.data
  },
}
