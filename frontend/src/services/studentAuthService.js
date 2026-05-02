import api from '../lib/axios'

export const studentAuthService = {
  register: async (data) => {
    const response = await api.post('/student-auth/register', data)
    return response.data
  },

  login: async (data) => {
    const response = await api.post('/student-auth/login', data)
    return response.data
  },

  submitProfile: async (formData) => {
    const response = await api.put('/student-auth/profile-setup', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    
    return response.data
  },

  getMe: async () => {
    const response = await api.get('/student-auth/me')
    return response.data
  },

  updateProfile: async (formData) => {
    const response = await api.put('/student-auth/profile', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },
}
