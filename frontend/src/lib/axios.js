import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    // Get both tokens
    const token = localStorage.getItem('token')
    const studentToken = localStorage.getItem('studentToken')
    
    // Check if we're in student area based on current URL
    const isStudentArea = window.location.pathname.startsWith('/student')
    
    // Determine which token to use
    if (isStudentArea) {
      // Use student token for student area
      if (studentToken) {
        config.headers.Authorization = `Bearer ${studentToken}`
      }
    } else {
      // Use librarian token for admin area
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    
    // Don't set Content-Type for FormData (let browser set it with boundary)
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type']
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Check if we're in student area
      const isStudentArea = window.location.pathname.startsWith('/student')
      
      if (isStudentArea) {
        // Handle student token expiration
        localStorage.removeItem('studentToken')
        localStorage.removeItem('student-auth-storage')
        if (window.location.pathname !== '/student/login') {
          window.location.href = '/student/login'
        }
      } else {
        // Handle librarian token expiration
        localStorage.removeItem('token')
        localStorage.removeItem('auth-storage')
        if (window.location.pathname !== '/login') {
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(error)
  }
)

export default api
