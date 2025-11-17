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
    const response = await api.post('/auth/login', data)
    return response.data
  },

  register: async (data: RegisterForm): Promise<LoginResponse> => {
    const response = await api.post('/auth/register', data)
    return response.data
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
}
