import axios from 'axios'
import toast from 'react-hot-toast'
import { API_BASE_URL } from './apiConfig'

// Get API base URL - recalculate it to ensure it's current and fix protocol if needed
function getCurrentApiBaseUrl(): string {
  // If explicitly set in env, use that (but fix protocol if needed)
  if (import.meta.env.VITE_API_BASE_URL) {
    const envUrl = import.meta.env.VITE_API_BASE_URL
    // If env URL is HTTP but page is HTTPS, convert to HTTPS to avoid mixed content
    if (typeof window !== 'undefined' && window.location.protocol === 'https:' && envUrl.startsWith('http://')) {
      console.warn('⚠️ Converting HTTP API URL to HTTPS to avoid mixed content:', envUrl)
      return envUrl.replace('http://', 'https://')
    }
    return envUrl
  }

  // Auto-detect protocol based on current page protocol
  const protocol = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'https:' : 'http:'
  
  // Check if we're on localhost
  if (typeof window !== 'undefined') {
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    if (isLocalhost && !import.meta.env.PROD) {
      return '/api' // Use Vite proxy in development
    }
  }
  
  // Production: use production API with protocol matching
  return `${protocol}//api.gloriaconnect.com/api`
}

const CURRENT_API_BASE_URL = getCurrentApiBaseUrl()

// Log the API base URL for debugging
console.log('🔧 API Base URL configured (Source):', CURRENT_API_BASE_URL)
console.log('🔧 Current page protocol:', typeof window !== 'undefined' ? window.location.protocol : 'N/A')

export const api = axios.create({
  baseURL: CURRENT_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  // Ensure response is parsed as JSON
  responseType: 'json',
  // CRITICAL: Match backend CORS configuration (credentials: false)
  withCredentials: false,
  // Don't validate status - let axios handle all responses
  validateStatus: () => true, // Accept all status codes, handle errors in interceptor
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    // CRITICAL: Recalculate baseURL dynamically to ensure protocol matches page protocol
    // This fixes mixed content issues (HTTPS page calling HTTP API)
    if (typeof window !== 'undefined') {
      const currentProtocol = window.location.protocol
      const currentBaseURL = config.baseURL || CURRENT_API_BASE_URL
      
      // If page is HTTPS but API URL is HTTP, convert to HTTPS
      if (currentProtocol === 'https:' && currentBaseURL.startsWith('http://')) {
        const correctedBaseURL = currentBaseURL.replace('http://', 'https://')
        console.warn('⚠️ Fixing protocol mismatch (Source):', {
          original: currentBaseURL,
          corrected: correctedBaseURL,
          pageProtocol: currentProtocol
        })
        config.baseURL = correctedBaseURL
      }
    }
    
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // Ensure CORS settings are explicit
    config.withCredentials = false
    
    // Log request details for debugging (especially for auth endpoints)
    if (config.url?.includes('/auth/login') || config.url?.includes('/auth/register')) {
      console.log('📤 Request interceptor (Source):', {
        url: config.url,
        baseURL: config.baseURL,
        fullURL: `${config.baseURL || ''}${config.url}`,
        method: config.method,
        hasToken: !!token,
        pageProtocol: typeof window !== 'undefined' ? window.location.protocol : 'N/A',
        headers: Object.keys(config.headers || {}),
        withCredentials: config.withCredentials
      })
    }
    
    // If data is FormData, don't set Content-Type - axios will set it automatically with boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type']
    }
    
    return config
  },
  (error) => {
    console.error('❌ Request interceptor error:', error)
    return Promise.reject(error)
  }
)

// Response interceptor to handle errors and log responses
api.interceptors.response.use(
  (response) => {
    // Special handling for import-branches endpoint: 422 responses contain validation errors
    // but should be treated as partial success, not errors
    if (response.config.url?.includes('/sources/import-branches') || response.config.url?.includes('/sources/upload-branches')) {
      // For import/upload endpoints, 422 means validation errors but response contains useful data
      if (response.status === 422 && response.data) {
        // Extract the response data - it contains summary and validationErrors
        // Don't reject, return the response so the mutation can handle it
        return response
      }
    }
    
    // Check if response is successful (200-299)
    if (response.status >= 200 && response.status < 300) {
      // Log successful responses for debugging
      if (response.config.url?.includes('/auth/login') || response.config.url?.includes('/auth/register')) {
        console.log('✅ Auth response interceptor (Source):', {
          url: response.config.url,
          status: response.status,
          hasData: !!response.data,
          dataKeys: response.data ? Object.keys(response.data) : []
        })
      }
      
      // Ensure response.data exists
      if (!response.data) {
        console.warn('⚠️ Response data is empty, but status is OK')
        response.data = {}
      }
      
      return response
    }
    
    // For non-2xx status codes (except 422 for import endpoints), treat as error
    // CRITICAL: With validateStatus: () => true, 401 is delivered HERE (not in error callback).
    // Always logout and redirect to login on 401 (Invalid token / unauthenticated).
    if (response.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      const basePath = import.meta.env.PROD ? '/source' : ''
      const loginPath = `${basePath}/login`
      const currentPath = window.location.pathname
      if (!currentPath.endsWith('/login') && !currentPath.endsWith('/login/')) {
        window.location.href = loginPath
      }
    }
    const error = new Error(`HTTP ${response.status}: ${response.statusText}`) as any
    error.response = response
    error.status = response.status
    error.statusText = response.statusText
    return Promise.reject(error)
  },
  (error) => {
    // If we have a response, extract error data properly
    if (error.response) {
      // Response was received but status is not 2xx
      const status = error.response.status
      let errorData = error.response.data || {}
      
      // If errorData is a string, try to parse it as JSON
      if (typeof errorData === 'string') {
        try {
          errorData = JSON.parse(errorData)
        } catch (e) {
          errorData = { message: errorData }
        }
      }
      
      // Ensure error.response.data is properly structured
      error.response.data = errorData
      
      // Extract backend error message if available
      if (errorData.message && !error.message.includes(errorData.message)) {
        error.message = errorData.message || error.message
      }
      
      // Log for debugging
      if (error.config?.url?.includes('/auth/login') || error.config?.url?.includes('/auth/register')) {
        console.error('🔴 Auth error response (Source):', {
          url: error.config?.url,
          status: status,
          error: errorData.error,
          message: errorData.message || error.message
        })
      }
      
      // Handle 401 - redirect to login
      if (status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        const basePath = import.meta.env.PROD ? '/source' : ''
        const loginPath = `${basePath}/login`
        const currentPath = window.location.pathname
        if (!currentPath.endsWith('/login') && !currentPath.endsWith('/login/')) {
          window.location.href = loginPath
        }
      }
      
      return Promise.reject(error)
    }
    
    // Network error (no response received)
    if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
      console.error('🔴 Network error (Source):', {
        message: error.message,
        code: error.code,
        url: error.config?.url,
        baseURL: error.config?.baseURL
      })
      
      const networkError = new Error('Network error. Please check your internet connection and ensure the server is running.') as any
      networkError.isNetworkError = true
      networkError.code = error.code || 'ERR_NETWORK'
      networkError.status = 0
      return Promise.reject(networkError)
    }
    
    // Other errors
    return Promise.reject(error)
  }
)

export default api
