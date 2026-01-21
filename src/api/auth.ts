import api from '../lib/api'
import { LoginForm } from '../lib/validators'

export interface Company {
  id: string
  companyName: string
  type: 'SOURCE'
  status: string
  adapterType?: string
  grpcEndpoint?: string | null
}

export interface User {
  id: string
  email: string
  role: string
  company: Company
  createdAt: string
  updatedAt: string
}

export interface LoginResponse {
  access: string
  refresh: string
  user: User
}

export interface RegisterForm {
  companyName: string
  type: 'SOURCE'
  email: string
  password: string
}

export interface VerifyEmailRequest {
  email: string
  otp: string
}

export interface VerifyEmailResponse {
  message: string
  access: string
  refresh: string
  user: User
}

export const authApi = {
  login: async (data: LoginForm): Promise<LoginResponse> => {
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api'
      const fullUrl = `${apiBaseUrl}/auth/login`
      console.log('🔵 Making login request:', {
        endpoint: '/auth/login',
        baseURL: apiBaseUrl,
        fullURL: fullUrl,
        email: data.email,
        apiInstance: api.defaults?.baseURL || 'default'
      })
      const response = await api.post('/auth/login', data)
      
      console.log('🟢 Raw axios response received:', {
        status: response.status,
        statusText: response.statusText,
        hasData: !!response.data,
        dataType: typeof response.data,
        dataKeys: response.data ? Object.keys(response.data) : [],
        fullData: response.data
      })
      
      // Check if response.data exists
      if (!response.data) {
        console.error('❌ Response data is empty or undefined')
        console.error('Full response:', response)
        throw new Error('No data received from server')
      }
      
      // Check if required fields exist
      if (!response.data.access && !response.data.token) {
        console.error('❌ Missing access token in response:', response.data)
        throw new Error('Invalid response: missing access token')
      }
      
      // Handle both 'access' and 'token' field names (backend returns both)
      const loginData = {
        ...response.data,
        access: response.data.access || response.data.token,
      }
      
      console.log('✅ Login data processed:', {
        hasAccess: !!loginData.access,
        hasRefresh: !!loginData.refresh,
        hasUser: !!loginData.user,
        userEmail: loginData.user?.email
      })
      
      return loginData
    } catch (error: any) {
      console.error('❌ Login API error:', error)
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        name: error.name,
        response: error.response,
        responseData: error.response?.data,
        responseStatus: error.response?.status,
        responseHeaders: error.response?.headers,
        request: error.request ? 'Request exists' : 'No request',
        config: {
          url: error.config?.url,
          baseURL: error.config?.baseURL,
          method: error.config?.method,
          timeout: error.config?.timeout
        },
        isNetworkError: error.isNetworkError,
        isCorsError: error.isCorsError
      })
      throw error
    }
  },

  register: async (data: RegisterForm): Promise<LoginResponse> => {
    try {
      console.log('🔵 Making register request to:', '/auth/register', 'with data:', { email: data.email, companyName: data.companyName })
      const response = await api.post('/auth/register', data)
      
      console.log('🟢 Register response received:', {
        status: response.status,
        statusText: response.statusText,
        hasData: !!response.data,
        dataType: typeof response.data,
        dataKeys: response.data ? Object.keys(response.data) : [],
        fullData: response.data
      })
      
      // Check if response.data exists
      if (!response.data || (typeof response.data === 'object' && Object.keys(response.data).length === 0)) {
        console.error('❌ Register response data is empty!')
        console.error('Full response:', response)
        throw new Error('No data received from server. Please try again.')
      }
      
      return response.data
    } catch (error: any) {
      console.error('❌ Register API error:', error)
      console.error('Error details:', {
        message: error.message,
        response: error.response,
        responseData: error.response?.data,
        responseStatus: error.response?.status,
        responseHeaders: error.response?.headers,
        isNetworkError: error.isNetworkError
      })
      throw error
    }
  },

  verifyEmail: async (data: VerifyEmailRequest): Promise<VerifyEmailResponse> => {
    const response = await api.post('/auth/verify-email', data)
    return response.data
  },

  me: async () => {
    const response = await api.get('/auth/me')
    return response.data
  },

  logout: async () => {
    const response = await api.post('/auth/logout')
    return response.data
  },

  forgotPassword: async (email: string) => {
    const response = await api.post('/auth/forgot-password', { email })
    return response.data
  },

  verifyResetOTP: async (email: string, otp: string) => {
    const response = await api.post('/auth/verify-reset-otp', { email, otp })
    return response.data
  },

  resetPassword: async (email: string, otp: string, newPassword: string) => {
    const response = await api.post('/auth/reset-password', { email, otp, newPassword })
    return response.data
  },
}
