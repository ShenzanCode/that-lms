import api from '../lib/axios'

export const reportService = {
  getDashboardStats: async () => {
    // Check if user is authenticated before making API call
    const token = localStorage.getItem('token')
    if (!token) {
      throw new Error('Not authenticated')
    }
    
    const response = await api.get('/reports/dashboard')
    return response.data.data
  },

  getOverdueReport: async () => {
    const response = await api.get('/reports/overdue')
    return response.data.data || []
  },

  getPopularBooksReport: async (params) => {
    const response = await api.get('/reports/popular-books', { params })
    return response.data.data || []
  },

  getTransactionsReport: async (params) => {
    const response = await api.get('/reports/transactions', { params })
    return {
      data: response.data.data || [],
      summary: response.data.summary || {}
    }
  },

  getMemberActivityReport: async (params) => {
    const response = await api.get('/reports/member-activity', { params })
    return response.data.data || []
  },

  getFineCollectionReport: async (params) => {
    const response = await api.get('/reports/fine-collection', { params })
    return {
      data: response.data.data || [],
      summary: response.data.summary || {},
      byPaymentMethod: response.data.byPaymentMethod || {}
    }
  },

  resetAllData: async () => {
    const response = await api.delete('/reports/reset-data')
    return response.data
  },
}
