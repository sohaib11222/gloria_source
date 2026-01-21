export interface HttpError extends Error {
  status: number
  statusText: string
}

export interface HttpOptions extends RequestInit {
  baseURL?: string
}

import { API_BASE_URL } from '../lib/apiConfig'

const DEFAULT_BASE_URL = API_BASE_URL

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
      const response = await fetch(url, {
        ...fetchOptions,
        headers: headers as HeadersInit,
        mode: 'cors', // Explicitly set CORS mode
        credentials: 'omit', // Match backend credentials: false
        referrerPolicy: 'unsafe-url' as ReferrerPolicy,
      })

      // Check if response was blocked by CORS
      if (response.type === 'opaque' || response.type === 'opaqueredirect') {
        const corsError = new Error('CORS error: Response was blocked by browser CORS policy. Please check server CORS configuration.') as HttpError
        corsError.status = 0
        corsError.statusText = 'CORS Error'
        ;(corsError as any).isCorsError = true
        throw corsError
      }

      if (!response.ok) {
        const error = new Error(`HTTP ${response.status}: ${response.statusText}`) as HttpError
        error.status = response.status
        error.statusText = response.statusText
        throw error
      }

      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        return await response.json()
      }
      
      return await response.text() as T
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
