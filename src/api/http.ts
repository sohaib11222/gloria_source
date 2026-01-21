export interface HttpError extends Error {
  status: number
  statusText: string
}

export interface HttpOptions extends RequestInit {
  baseURL?: string
}

import { API_BASE_URL } from '../lib/apiConfig'

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

const DEFAULT_BASE_URL = getCurrentApiBaseUrl()

// Log the API base URL for debugging
console.log('🔧 API Base URL configured (Source):', DEFAULT_BASE_URL)
console.log('🔧 Current page protocol:', typeof window !== 'undefined' ? window.location.protocol : 'N/A')

export class HttpClient {
  private baseURL: string

  constructor(baseURL: string = DEFAULT_BASE_URL) {
    this.baseURL = baseURL
  }

  setBaseURL(url: string) {
    this.baseURL = url
  }

  async request<T = any>(
    endpoint: string,
    options: HttpOptions = {}
  ): Promise<T> {
    const { baseURL, headers: providedHeaders, ...fetchOptions } = options
    const url = `${baseURL || this.baseURL}${endpoint}`
    
    // Check if body is FormData - if so, don't set Content-Type (browser will set it with boundary)
    const isFormData = fetchOptions.body instanceof FormData
    
    // Get token from localStorage for auth
    const token = localStorage.getItem('token')
    
    // Start with default headers (skip Content-Type for FormData)
    const headers: Record<string, string> = {}
    if (!isFormData) {
      headers['Content-Type'] = 'application/json'
    }
    
    // Add provided headers (convert to plain object if needed)
    if (providedHeaders) {
      if (providedHeaders instanceof Headers) {
        providedHeaders.forEach((value, key) => {
          // Don't override Content-Type for FormData - browser needs to set it
          if (!(isFormData && key.toLowerCase() === 'content-type')) {
            headers[key] = value
          }
        })
      } else if (Array.isArray(providedHeaders)) {
        providedHeaders.forEach(([key, value]) => {
          // Don't override Content-Type for FormData - browser needs to set it
          if (!(isFormData && key.toLowerCase() === 'content-type')) {
            headers[key] = value
          }
        })
      } else {
        const providedHeadersObj = providedHeaders as Record<string, string>
        Object.keys(providedHeadersObj).forEach(key => {
          // Don't override Content-Type for FormData - browser needs to set it
          if (!(isFormData && key.toLowerCase() === 'content-type')) {
            headers[key] = providedHeadersObj[key]
          }
        })
      }
    }
    
    // ALWAYS set Authorization header if token exists
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    
    try {
      // CRITICAL: Fix protocol mismatch before making the request
      // If page is HTTPS but URL is HTTP, convert to HTTPS to avoid mixed content blocking
      let finalUrl = url
      if (typeof window !== 'undefined' && window.location.protocol === 'https:' && url.startsWith('http://')) {
        finalUrl = url.replace('http://', 'https://')
        console.warn('⚠️ Fixing protocol mismatch (Source):', {
          original: url,
          corrected: finalUrl,
          pageProtocol: window.location.protocol
        })
      }
      
      // CRITICAL: Set CORS mode and credentials to match backend configuration
      // Backend uses Access-Control-Allow-Credentials: false, so we use credentials: 'omit'
      // DO NOT set any CORS headers manually - browser handles this automatically
      const response = await fetch(finalUrl, {
        ...fetchOptions,
        headers: headers as HeadersInit,
        mode: 'cors', // Explicitly set CORS mode
        credentials: 'omit', // Match backend credentials: false
        referrerPolicy: 'unsafe-url' as ReferrerPolicy,
      })
      
      // Log response for debugging auth endpoints
      if (endpoint.includes('/auth/login') || endpoint.includes('/auth/register')) {
        console.log('📥 Response received (Source):', {
          url: finalUrl,
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
          headers: Object.fromEntries(response.headers.entries())
        })
      }

      // Check if response was blocked by CORS
      if (response.type === 'opaque' || response.type === 'opaqueredirect') {
        const corsError = new Error('CORS error: Response was blocked by browser CORS policy. Please check server CORS configuration.') as HttpError
        corsError.status = 0
        corsError.statusText = 'CORS Error'
        ;(corsError as any).isCorsError = true
        throw corsError
      }

      if (!response.ok) {
        // Try to parse error response first
        let errorData: any = {}
        try {
          const contentType = response.headers.get('content-type')
          if (contentType && contentType.includes('application/json')) {
            errorData = await response.json()
          } else {
            const text = await response.text()
            if (text) {
              try {
                errorData = JSON.parse(text)
              } catch {
                errorData = { message: text }
              }
            }
          }
        } catch (parseError) {
          console.warn('Failed to parse error response:', parseError)
        }
        
        const error = new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`) as HttpError
        error.status = response.status
        error.statusText = response.statusText
        ;(error as any).response = errorData
        throw error
      }

      // Parse successful response
      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        try {
          const data = await response.json()
          // Log successful response for auth endpoints
          if (endpoint.includes('/auth/login') || endpoint.includes('/auth/register')) {
            console.log('✅ Auth response parsed (Source):', {
              url: finalUrl,
              status: response.status,
              hasData: !!data,
              dataKeys: data ? Object.keys(data) : []
            })
          }
          return data as T
        } catch (parseError) {
          console.error('Failed to parse JSON response:', parseError)
          throw new Error('Failed to parse server response')
        }
      }
      
      // For non-JSON responses, return as text
      const text = await response.text()
      return text as T
    } catch (error) {
      // Check for CORS errors
      if (error instanceof TypeError && error.message?.includes('Failed to fetch')) {
        const corsError = new Error('CORS error: Unable to connect to server. Please check your network connection and CORS configuration.') as HttpError
        corsError.status = 0
        corsError.statusText = 'CORS Error'
        ;(corsError as any).isCorsError = true
        ;(corsError as any).isNetworkError = true
        throw corsError
      }
      
      if (error instanceof Error && 'status' in error) {
        throw error
      }
      
      const httpError = new Error(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`) as HttpError
      httpError.status = 0
      httpError.statusText = 'Network Error'
      ;(httpError as any).isNetworkError = true
      throw httpError
    }
  }

  async get<T = any>(endpoint: string, options?: HttpOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' })
  }

  async post<T = any>(endpoint: string, data?: any, options?: HttpOptions): Promise<T> {
    // Check if data is FormData - if so, send it as-is without stringifying
    const isFormData = data instanceof FormData
    
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? (isFormData ? data : JSON.stringify(data)) : undefined,
    })
  }

  async put<T = any>(endpoint: string, data?: any, options?: HttpOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async delete<T = any>(endpoint: string, options?: HttpOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' })
  }
}

export const httpClient = new HttpClient()
