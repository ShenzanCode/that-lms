import api from '../lib/axios'

export const settingsService = {
  getSettings: async () => {
    const response = await api.get('/settings')
    return response.data
  },

  updateSettings: async (data) => {
    const response = await api.put('/settings', data)
    return response.data
  },
}
