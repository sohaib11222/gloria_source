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
import api from '../lib/api'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<{ message: string; email?: string; canResend?: boolean } | null>(null)
  const [isResending, setIsResending] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(RegisterSchema),
  })

  const handleResendOTP = async (email: string) => {
    setIsResending(true)
    setError(null)
    try {
      const response = await api.post('/auth/resend-otp', { email })
      const data = response.data
      
      if (data.emailSent) {
        toast.success('Verification code sent! Please check your email.')
        navigate('/verify-email', { state: { email } })
      } else {
        // Email sending failed - OTP is logged to server console in dev mode
        toast.error(data.message || 'Failed to send email. Please check SMTP configuration or contact support.')
        setError({
          message: data.message || 'Failed to send email. Please check SMTP configuration. In development mode, check the server console for the OTP.',
          email,
          canResend: true
        })
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to resend verification code'
      toast.error(errorMessage)
      setError({
        message: errorMessage,
        email,
        canResend: err.response?.status !== 404 && err.response?.status !== 400
      })
    } finally {
      setIsResending(false)
    }
  }

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true)
    setError(null)
    try {
      await authApi.register(data)
      
      toast.success('Registration successful! Please check your email for the verification code.')
      
      // Navigate to OTP verification page with email
      navigate('/verify-email', { state: { email: data.email } })
    } catch (error: any) {
      console.error('Registration error:', error)
      
      // Handle 409 Conflict (email already exists)
      if (error.response?.status === 409) {
        const errorMessage = error.response?.data?.message || 'Email already exists'
        setError({
          message: errorMessage,
          email: data.email,
          canResend: true
        })
        toast.error(errorMessage)
      } else {
        const errorMessage = error.response?.data?.message || 'Registration failed'
        setError({
          message: errorMessage,
          canResend: false
        })
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
            <div className="p-3 bg-slate-700 rounded">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
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
            {error && (
              <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3 flex-1">
                    <h3 className="text-sm font-medium text-amber-800">
                      {error.message}
                    </h3>
                    {error.canResend && error.email && (
                      <div className="mt-3">
                        <p className="text-sm text-amber-700 mb-2">
                          This email is already registered but may not be verified yet. You can:
                        </p>
                        <div className="flex gap-2 flex-wrap">
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => handleResendOTP(error.email!)}
                            loading={isResending}
                            className="text-amber-800 border-amber-300 hover:bg-amber-100 bg-amber-50"
                          >
                            {isResending ? 'Sending...' : 'Resend Verification Code'}
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => navigate('/verify-email', { state: { email: error.email } })}
                            className="text-amber-800 border-amber-300 hover:bg-amber-100 bg-amber-50"
                          >
                            Go to Verification
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => navigate('/login')}
                            className="text-amber-800 border-amber-300 hover:bg-amber-100 bg-amber-50"
                          >
                            Sign In Instead
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
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

            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="space-y-3">
                <p className="text-xs font-medium text-gray-700 text-center">What you'll get:</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { icon: '📦', text: 'Manage inventory' },
                    { icon: '📋', text: 'Track bookings' },
                    { icon: '📊', text: 'View analytics' },
                    { icon: '🔌', text: 'API access' }
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-gray-50 rounded p-2">
                      <span className="text-base">{item.icon}</span>
                      <span className="text-xs text-gray-700">{item.text}</span>
                    </div>
                  ))}
                </div>
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
