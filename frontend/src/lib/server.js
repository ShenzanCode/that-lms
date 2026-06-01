// Helper for resolving server and API roots based on environment
const DEFAULT_RENDER_API = 'https://that-lms-1.onrender.com/api'

export function getApiBase() {
  return import.meta.env.VITE_API_URL || (import.meta.env.MODE === 'production' ? DEFAULT_RENDER_API : '/api')
}

export function getServerRoot() {
  let api = getApiBase()
  if (api.endsWith('/api')) api = api.slice(0, -4)
  return api
}

export function getSocketUrl() {
  return import.meta.env.VITE_SOCKET_URL || (import.meta.env.MODE === 'production' ? 'https://that-lms-1.onrender.com' : 'http://localhost:5000')
}

export default {
  getApiBase,
  getServerRoot,
  getSocketUrl,
}
