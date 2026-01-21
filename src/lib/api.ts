import axios from 'axios'
import toast from 'react-hot-toast'
import { API_BASE_URL } from './apiConfig'

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  // Ensure response is parsed as JSON
  responseType: 'json',
  // Explicitly set CORS credentials to match backend (credentials: false)
  withCredentials: false,
  // Handle response transformation
  transformResponse: [(data) => {
    // If data is empty string, return empty object
    if (data === '' || data === null || data === undefined) {
      console.warn('⚠️ Empty response body received')
      return {}
    }
    
    // If data is a string, try to parse it
    if (typeof data === 'string') {
      try {
        const parsed = JSON.parse(data)
        return parsed
      } catch (e) {
        console.warn('Failed to parse response as JSON:', data)
        return data
      }
    }
    return data
  }],
  // Ensure we validate status - don't throw on 200-299
  validateStatus: (status) => {
    return status >= 200 && status < 300
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // Ensure CORS settings are explicit
    config.withCredentials = false
    
    // Log request details for debugging (especially for auth endpoints)
    if (config.url?.includes('/auth/login') || config.url?.includes('/auth/register')) {
      console.log('📤 Request interceptor:', {
        url: config.url,
        baseURL: config.baseURL,
        fullURL: `${config.baseURL || ''}${config.url}`,
        method: config.method,
        hasToken: !!token,
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
    // Log successful responses for debugging
    if (response.config.url?.includes('/auth/login') || response.config.url?.includes('/auth/register')) {
      console.log('✅ Auth response interceptor:', {
        url: response.config.url,
        status: response.status,
        statusText: response.statusText,
        hasData: !!response.data,
        dataType: typeof response.data,
        dataKeys: response.data ? Object.keys(response.data) : [],
        data: response.data,
        headers: response.headers,
        responseText: (response as any).responseText,
        config: {
          url: response.config.url,
          method: response.config.method,
          baseURL: response.config.baseURL
        }
      })
      
      // Check if data is empty or undefined
      if (!response.data || (typeof response.data === 'object' && Object.keys(response.data).length === 0)) {
        console.error('❌ Response data is empty or undefined!')
        console.error('Full response object:', response)
        console.error('Response headers:', response.headers)
        console.error('Response status:', response.status)
        console.error('Response statusText:', response.statusText)
        
        // Try to get response text if available
        if ((response as any).request?.responseText) {
          console.error('Response text:', (response as any).request.responseText)
        }
      } else {
        console.log('✅ Response data received successfully:', response.data)
      }
    }
    
    // Ensure response.data exists even if empty
    if (!response.data) {
      response.data = {}
    }
    
    return response
  },
  (error) => {
    // Check for CORS errors specifically - only if we have a network error AND no response
    // CORS errors typically show up as network errors with no response object
    if (error.code === 'ERR_NETWORK' && !error.response) {
      // Check if it's actually a CORS error by checking the error message
      const isCorsError = error.message?.includes('CORS') || 
                         error.message?.includes('cross-origin') ||
                         error.message?.includes('Access-Control')
      
      if (isCorsError) {
        console.error('🚫 CORS Error detected:', {
          message: error.message,
          code: error.code,
          config: error.config
        })
        
        // Create a CORS-specific error
        const corsError = new Error('CORS error: Unable to connect to server. Please check your network connection and ensure the server CORS configuration is correct.')
        ;(corsError as any).isNetworkError = true
        ;(corsError as any).isCorsError = true
        ;(corsError as any).code = 'CORS_ERROR'
        return Promise.reject(corsError)
      }
    }
    
    // Ensure error.response is preserved for proper error handling
    if (error.response) {
      // We have a valid HTTP response (even if it's an error status)
      const status = error.response.status
      let errorData = error.response.data || {}
      
      // If errorData is a string, try to parse it as JSON
      if (typeof errorData === 'string') {
        try {
          errorData = JSON.parse(errorData)
        } catch (e) {
          // If parsing fails, use the string as the message
          errorData = { message: errorData }
        }
      }
      
      // Ensure error.response.data is an object with proper structure
      if (!error.response.data || typeof error.response.data !== 'object') {
        error.response.data = errorData
      }
      
      // Ensure error.message contains the backend message if available
      if (errorData.message && !error.message.includes(errorData.message)) {
        // Don't override error.message completely, but ensure backend message is accessible
        if (!error.response.data.message) {
          error.response.data.message = errorData.message
        }
      }
      
      if (status === 401) {
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
      }
      
      // Preserve the error structure so components can extract messages
      // Don't modify the error, just ensure it has the right structure
      return Promise.reject(error)
    }
    
    // This is a true network error (no response received)
    // Check if it's a connection error, timeout, or CORS issue
    const isConnectionError = error.code === 'ERR_NETWORK' || 
                              error.code === 'ECONNABORTED' ||
                              error.code === 'ETIMEDOUT' ||
                              error.message?.includes('Network Error') ||
                              error.message?.includes('Failed to fetch') ||
                              error.message?.includes('timeout')
    
    // Log detailed error information for debugging
    console.error('🔴 Network/Connection Error:', {
      message: error.message,
      code: error.code,
      name: error.name,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        baseURL: error.config?.baseURL,
        timeout: error.config?.timeout
      },
      request: error.request ? 'Request object exists' : 'No request object'
    })
    
    // Create a structured error that components can handle
    const networkError = new Error(error.message || 'Network error. Please check your connection.')
    ;(networkError as any).isNetworkError = true
    ;(networkError as any).code = error.code || 'NETWORK_ERROR'
    ;(networkError as any).isConnectionError = isConnectionError
    
    // Don't show toast for every error - let components handle it
    // Only show toast for critical errors
    if (error.response?.status >= 500) {
      const errorData = error.response?.data || {}
      const errorCode = errorData.error
      const errorMessage = errorData.message || error.message || 'An error occurred'
      
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
    
    return Promise.reject(networkError)
  }
)

export default api
