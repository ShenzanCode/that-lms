import api from '../lib/axios'

export const reservationService = {
  getReservations: async (params) => {
    const response = await api.get('/reservations', { params })
    return response.data
  },

  createReservation: async (data) => {
    const response = await api.post('/reservations', data)
    return response.data
  },

  deleteReservation: async (id) => {
    const response = await api.delete(`/reservations/${id}`)
    return response.data
  },

  notifyReservation: async (id) => {
    const response = await api.patch(`/reservations/${id}/notify`)
    return response.data
  },

  fulfillReservation: async (id) => {
    const response = await api.patch(`/reservations/${id}/fulfill`)
    return response.data
  },

  approveReservation: async (id) => {
    const response = await api.patch(`/reservations/${id}/approve`)
    return response.data
  },

  rejectReservation: async (id, reason) => {
    const response = await api.patch(`/reservations/${id}/reject`, { reason })
    return response.data
  },
}
