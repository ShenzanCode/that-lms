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
    
    // Check if the request is for student-specific API
    // We check if the URL starts with /student-auth or if it's a student-facing request
    const isStudentAPI = config.url.startsWith('/student-auth') || 
                         config.url.startsWith('/notifications') || 
                         config.url.startsWith('/reservations') ||
                         config.url.startsWith('/fines')
    
    // Check if we're in student area based on current URL (fallback)
    const isStudentArea = window.location.pathname.startsWith('/student')
    
    // Determine which token to use
    // If it's a student API OR we are in a student area, prioritize studentToken
    if ((isStudentAPI || isStudentArea) && studentToken) {
      config.headers.Authorization = `Bearer ${studentToken}`
    } else if (token) {
      // Otherwise use librarian token if it exists
      config.headers.Authorization = `Bearer ${token}`
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
        if (window.location.pathname !== '/landing' && window.location.pathname !== '/') {
          window.location.href = '/landing?auth=login&type=student'
        }
      } else {
        // Handle librarian token expiration
        localStorage.removeItem('token')
        localStorage.removeItem('auth-storage')
        if (window.location.pathname !== '/landing' && window.location.pathname !== '/') {
          window.location.href = '/landing?auth=login&type=librarian'
        }
      }
    }
    return Promise.reject(error)
  }
)

export default api
