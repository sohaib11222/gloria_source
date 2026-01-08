import axios from 'axios'
import toast from 'react-hot-toast'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
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
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      // Get base path (matches vite.config.js and main.jsx)
      const basePath = import.meta.env.PROD ? '/source' : ''
      const loginPath = `${basePath}/login`
      const currentPath = window.location.pathname
      // Only redirect if not already on login page
      if (!currentPath.endsWith('/login') && !currentPath.endsWith('/login/')) {
        window.location.href = loginPath
      }
      return Promise.reject(error)
    }
    
    // Extract error details
    const errorData = error.response?.data || {}
    const errorCode = errorData.error
    const errorMessage = errorData.message || error.message || 'An error occurred'
    
    // Don't show toast for every error - let components handle it
    // Only show toast for critical errors
    if (error.response?.status >= 500) {
      // Handle specific error types
      if (errorCode === 'DATABASE_AUTH_ERROR' || errorCode === 'DATABASE_CONFIG_ERROR') {
        // Don't show toast - let component handle it with better message
      } else {
        // Only log to console, don't show toast for server errors
        console.error('Server error:', {
          status: error.response?.status,
          code: errorCode,
          message: errorMessage
        })
      }
    }
    
    return Promise.reject(error)
  }
)

export default api
