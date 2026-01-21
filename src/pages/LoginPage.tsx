import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { authApi } from '../api/auth'
import { LoginForm, LoginSchema } from '../lib/validators'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import toast from 'react-hot-toast'
import logoImage from '../assets/logo.jpg'

export default function LoginPage() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)

  // Check if user is already logged in on mount
  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    
    if (token && userData) {
      try {
        const user = JSON.parse(userData)
        if (user.company?.type === 'SOURCE') {
          // User is already logged in, redirect to source page
          navigate('/source', { replace: true })
        }
      } catch (e) {
        // Invalid user data, clear it
        localStorage.removeItem('token')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('user')
      }
    }
  }, [navigate])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(LoginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true)
    
    try {
      // Check if user is already authenticated
      const existingToken = localStorage.getItem('token')
      const existingUser = localStorage.getItem('user')
      
      if (existingToken && existingUser) {
        // Check if existing user is a source
        const userData = JSON.parse(existingUser)
        if (userData.company.type === 'SOURCE') {
          console.log('Using existing authentication')
          navigate('/source')
          return
        } else {
          // Clear invalid data if not a source
          localStorage.removeItem('token')
          localStorage.removeItem('refreshToken')
          localStorage.removeItem('user')
          toast.error('Access denied. Only Source accounts are allowed.')
          return
        }
      }

      // Make authentication API call
      console.log('Login attempt:', data.email)
      const response = await authApi.login(data)
      console.log('Login response:', response)
      console.log('Response type:', typeof response)
      console.log('Response keys:', response ? Object.keys(response) : 'null/undefined')
      
      // Check if response is valid
      if (!response) {
        toast.error('No response received from server. Please try again.')
        return
      }
      
      if (!response.access || !response.refresh || !response.user) {
        console.error('Invalid response structure:', response)
        toast.error('Invalid response from server. Please try again.')
        return
      }
      
      // Store the authentication tokens and user data
      localStorage.setItem('token', response.access)
      localStorage.setItem('refreshToken', response.refresh)
      localStorage.setItem('user', JSON.stringify(response.user))
      
      // Check if user type is SOURCE
      if (response.user.company.type === 'SOURCE') {
        // Check approval status
        if (response.user.company.approvalStatus !== 'APPROVED') {
          // Clear stored data if not approved
          localStorage.removeItem('token')
          localStorage.removeItem('refreshToken')
          localStorage.removeItem('user')
          
          if (response.user.company.approvalStatus === 'PENDING') {
            toast.error('Your account is pending admin approval. Please wait for approval.')
          } else if (response.user.company.approvalStatus === 'REJECTED') {
            toast.error('Your account has been rejected. Please contact support.')
          } else {
            toast.error('Your account is not approved. Please contact support.')
          }
          return
        }

        // Check if account is active
        if (response.user.company.status !== 'ACTIVE') {
          localStorage.removeItem('token')
          localStorage.removeItem('refreshToken')
          localStorage.removeItem('user')
          toast.error('Your account is not active. Please contact support.')
          return
        }

        toast.success('Login successful!')
        navigate('/source')
      } else {
        // Clear stored data if not a source
        localStorage.removeItem('token')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('user')
        toast.error('Access denied. Only Source accounts are allowed.')
      }
    } catch (error: any) {
      console.error('Login failed:', error)
      console.error('Error details:', {
        message: error.message,
        response: error.response,
        responseData: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText,
        isNetworkError: error.isNetworkError,
        code: error.code
      })
      
      // Check if this is a CORS error
      if (error.isCorsError || error.code === 'CORS_ERROR') {
        toast.error('CORS error: Unable to connect to server. Please check your network connection and ensure the server CORS configuration is correct.')
        return
      }
      
      // Check if this is a true network/connection error (no response received)
      // But first check if we actually got a response with an error status
      if (error.response) {
        // We have a response, so it's not a network error - process it normally below
        console.log('✅ Got response from server, processing error:', error.response.status)
      } else if (error.isNetworkError || error.isConnectionError || (!error.response && (error.code === 'ERR_NETWORK' || error.message?.includes('Network') || error.message?.includes('Failed to fetch')))) {
        // True network error - no response received
        console.error('❌ True network error - no response received:', {
          message: error.message,
          code: error.code,
          isNetworkError: error.isNetworkError,
          isConnectionError: error.isConnectionError
        })
        toast.error('Network error. Please check your internet connection and ensure the server is running. If the problem persists, check the browser console for more details.')
        return
      }
      
      // Extract error code and message from various possible locations
      // ALWAYS prioritize response.data over error.message (which might be generic)
      let errorCode = error.response?.data?.error || 
                     error.response?.error || 
                     error.code ||
                     null
      
      // Priority order: 
      // 1. response.data.message (backend message)
      // 2. response.data.error (backend error code as message)
      // 3. response.message (axios response message)
      // 4. Generic fallback based on status code
      // 5. error.message (last resort, but filter out generic messages)
      let errorMessage: string
      
      if (error.response?.data?.message) {
        // Always use backend message if available
        errorMessage = error.response.data.message
      } else if (error.response?.data?.error) {
        // Use error code as message if no message field
        errorMessage = error.response.data.error
      } else if (error.response?.status === 401) {
        errorMessage = 'Invalid credentials. Please check your email and password.'
      } else if (error.response?.status === 403) {
        errorMessage = 'Access denied. Please contact support.'
      } else if (error.response?.status) {
        // We have a response but no message - use a generic message based on status
        errorMessage = `Request failed with status ${error.response.status}. Please try again.`
      } else {
        // No response at all - this shouldn't happen if we got past the network error check
        errorMessage = 'Login failed. Please check your credentials.'
      }
      
      // Final check: if errorMessage is still a generic message, try one more time to get backend message
      const genericMessages = ['Network Error', 'Network error', 'Error', 'Request failed', 'Unauthorized', 'Forbidden']
      if (genericMessages.some(msg => errorMessage === msg || errorMessage.includes(msg))) {
        // Try to extract from response one more time
        if (error.response?.data) {
          const data = error.response.data
          if (typeof data === 'object') {
            errorMessage = data.message || data.error || errorMessage
          } else if (typeof data === 'string') {
            errorMessage = data
          }
        }
      }
      
      console.log('Final error message to display:', errorMessage)
      
      // Always show the proper error message from the backend
      if (errorCode === 'NOT_APPROVED') {
        toast.error(errorMessage)
      } else if (errorCode === 'ACCOUNT_NOT_ACTIVE') {
        toast.error(errorMessage)
      } else if (errorCode === 'EMAIL_NOT_VERIFIED') {
        toast.error(errorMessage)
      } else {
        toast.error(errorMessage)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <img 
              src={logoImage} 
              alt="Gloria Connect" 
              className="h-16 w-auto object-contain"
            />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Gloria Connect
          </h2>
          <p className="text-sm text-gray-600">
            Sign in to access your dashboard
          </p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-900">Welcome back</CardTitle>
            <p className="text-sm text-gray-600 mt-1">Enter your credentials to continue</p>
          </CardHeader>
          <CardContent className="pt-6 pb-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <Input
                  label="Email Address"
                  type="email"
                  autoComplete="email"
                  placeholder="source@example.com"
                  error={errors.email?.message}
                  {...register('email')}
                />
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">Password</label>
                  <button
                    type="button"
                    onClick={() => navigate('/forgot-password')}
                    className="text-xs text-slate-700 hover:text-slate-900 transition-colors underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <Input
                  type="password"
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  error={errors.password?.message}
                  {...register('password')}
                />
              </div>
              
              <Button
                type="submit"
                loading={isLoading}
                className="w-full mt-4"
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <button
                  onClick={() => navigate('/register')}
                  className="font-medium text-slate-700 hover:text-slate-900 transition-colors underline"
                >
                  Register
                </button>
              </p>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-center space-x-2 text-gray-500">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="text-xs">
                  Manage your inventory and bookings
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            Gloria Connect
          </p>
        </div>
      </div>
    </div>
  )
}
