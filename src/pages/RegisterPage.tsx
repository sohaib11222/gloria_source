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
      await authApi.register(data)
      
      toast.success('Registration successful! Please check your email for the verification code.')
      
      // Navigate to OTP verification page with email
      navigate('/verify-email', { state: { email: data.email } })
    } catch (error: any) {
      console.error('Registration error:', error)
      toast.error(error.response?.data?.message || 'Registration failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl p-3 shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900">
            Create Source Account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Join as a car rental supplier
          </p>
        </div>
        
        <Card className="shadow-2xl border-0">
          <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-purple-50 to-pink-50">
            <CardTitle className="text-xl">Get started</CardTitle>
            <p className="text-sm text-gray-600 mt-1">Enter your details to create an account</p>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <Input
                label="Company Name"
                placeholder="Your company name"
                {...register('companyName')}
                error={errors.companyName?.message}
                className="transition-all duration-200"
              />

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <Input
                  label="Account Type"
                  value="SOURCE"
                  disabled
                  className="cursor-not-allowed"
                />
                <p className="text-xs text-purple-700 mt-1">
                  ✓ Source registration only
                </p>
              </div>
              <input type="hidden" {...register('type')} value="SOURCE" />

              <Input
                label="Email"
                type="email"
                placeholder="company@example.com"
                {...register('email')}
                error={errors.email?.message}
                className="transition-all duration-200"
              />

              <Input
                label="Password"
                type="password"
                placeholder="Create a secure password"
                {...register('password')}
                error={errors.password?.message}
                className="transition-all duration-200"
              />

              <Button
                type="submit"
                loading={isLoading}
                className="w-full mt-2 h-11"
              >
                {isLoading ? 'Creating account...' : 'Create Account'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <button
                  onClick={() => navigate('/login')}
                  className="font-medium text-purple-600 hover:text-purple-500 transition-colors"
                >
                  Sign in
                </button>
              </p>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-700">What you'll get:</p>
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Manage inventory</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Track bookings</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    <span>View analytics</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    <span>API access</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-xs text-gray-400">
            Car Hire – Source Portal
          </p>
        </div>
      </div>
    </div>
  )
}
