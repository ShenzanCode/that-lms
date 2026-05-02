import api from '../lib/axios'

export const transactionService = {
  issueBook: async (data) => {
    const response = await api.post('/transactions/issue', data)
    return response.data
  },

  returnBook: async (data) => {
    const response = await api.post('/transactions/return', data)
    return response.data
  },

  renewBook: async (data) => {
    const response = await api.post('/transactions/renew', data)
    return response.data
  },

  getTransactions: async (params) => {
    const response = await api.get('/transactions', { params })
    return response.data
  },

  getIssuedBooks: async (params) => {
    const response = await api.get('/transactions/issued', { params })
    return response.data
  },

  getTransaction: async (id) => {
    const response = await api.get(`/transactions/${id}`)
    return response.data
  },
}
