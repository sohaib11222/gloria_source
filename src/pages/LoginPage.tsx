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
      
      // Store the authentication tokens and user data
      localStorage.setItem('token', response.access)
      localStorage.setItem('refreshToken', response.refresh)
      localStorage.setItem('user', JSON.stringify(response.user))
      
      // Check if user type is SOURCE
      if (response.user.company.type === 'SOURCE') {
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
      toast.error(error.response?.data?.message || 'Login failed. Please check your credentials.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-slate-700 rounded">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
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
                <Input
                  label="Password"
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
