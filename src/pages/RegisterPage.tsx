import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { RegisterSchema, RegisterForm } from '../lib/validators'
import { authApi } from '../api/auth'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import toast from 'react-hot-toast'
import logoImage from '../assets/logo.jpg'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(RegisterSchema),
  })

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true)
    try {
      console.log('📝 Starting registration for:', data.email)
      const response = await authApi.register(data)
      console.log('✅ Registration response:', response)
      
      // Check if response is valid
      if (!response || (typeof response === 'object' && Object.keys(response).length === 0)) {
        console.error('❌ Empty registration response')
        toast.error('Registration completed but no response received. Please check your email or try logging in.')
        return
      }
      
      toast.success(response.message || 'Registration successful! Please check your email for the verification code. After verification, your account will be pending admin approval.')
      
      // Navigate to OTP verification page with email
      navigate('/verify-email', { state: { email: data.email } })
    } catch (error: any) {
      console.error('❌ Registration error:', error)
      console.error('Error details:', {
        message: error.message,
        response: error.response,
        responseData: error.response?.data,
        isNetworkError: error.isNetworkError,
        code: error.code
      })
      
      // Check if this is a CORS error
      if (error.isCorsError || error.code === 'CORS_ERROR') {
        toast.error('CORS error: Unable to connect to server. Please check your network connection and ensure the server CORS configuration is correct.')
        return
      }
      
      // Check if this is a true network error (no response at all)
      if (error.isNetworkError || (!error.response && error.message?.includes('Network'))) {
        toast.error('Network error. Please check your internet connection and try again.')
        return
      }
      
      // Extract error message - prioritize API message over HTTP status text
      // Check multiple possible locations for the error message
      let errorMessage = 'Registration failed. Please try again.'
      
      // Priority order: response.data.message > response.message > details.message > message (if not HTTP status)
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error.response?.message) {
        errorMessage = error.response.message
      } else if (error.details?.message) {
        errorMessage = error.details.message
      } else if (error.message && !error.message.startsWith('HTTP ') && !error.message.includes('Network')) {
        // Only use error.message if it's not the generic HTTP status message or Network error
        errorMessage = error.message
      } else if (error.response?.data && typeof error.response.data === 'object') {
        // Try to extract message from response.data object directly
        const responseData = error.response.data
        if (responseData.message) {
          errorMessage = responseData.message
        } else if (responseData.error && typeof responseData.error === 'string') {
          errorMessage = responseData.error
        }
      }
      
      // Filter out generic messages
      if (errorMessage === 'Network Error' || errorMessage === 'Network error' || errorMessage.includes('Network')) {
        errorMessage = 'Unable to connect to server. Please check your internet connection and try again.'
      }
      
      // Only show toast, don't set error state (removed error UI)
      toast.error(errorMessage)
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
            Create Source Account
          </h2>
          <p className="text-sm text-gray-600">
            Join as a car rental supplier
          </p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-900">Get started</CardTitle>
            <p className="text-sm text-gray-600 mt-1">Enter your details to create an account</p>
          </CardHeader>
          <CardContent className="pt-6 pb-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <Input
                  label="Company Name"
                  placeholder="Your company name"
                  {...register('companyName')}
                  error={errors.companyName?.message}
                />
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded p-4">
                <Input
                  label="Account Type"
                  value="SOURCE"
                  disabled
                  className="cursor-not-allowed bg-white"
                />
                <div className="flex items-center mt-2 space-x-1">
                  <svg className="w-4 h-4 text-slate-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <p className="text-xs font-medium text-gray-700">
                    Source registration only
                  </p>
                </div>
              </div>
              <input type="hidden" {...register('type')} value="SOURCE" />

              <div>
                <Input
                  label="Email"
                  type="email"
                  placeholder="company@example.com"
                  {...register('email')}
                  error={errors.email?.message}
                />
              </div>

              <div>
                <Input
                  label="Password"
                  type="password"
                  placeholder="Create a secure password"
                  {...register('password')}
                  error={errors.password?.message}
                />
              </div>

              <Button
                type="submit"
                loading={isLoading}
                className="w-full mt-4"
              >
                {isLoading ? 'Creating account...' : 'Create Account'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <button
                  onClick={() => navigate('/login')}
                  className="font-medium text-slate-700 hover:text-slate-900 transition-colors underline"
                >
                  Sign in
                </button>
              </p>
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
