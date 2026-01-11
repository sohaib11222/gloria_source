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
    <div className="min-h-screen relative bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Animated background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-rose-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="max-w-md w-full space-y-8 relative z-10">
        <div className="text-center animate-fade-in">
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl blur-lg opacity-50 animate-pulse"></div>
              <div className="relative bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl p-4 shadow-2xl transform transition-transform hover:scale-105">
                <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
            </div>
          </div>
          <h2 className="text-4xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            Create Source Account
          </h2>
          <p className="mt-2 text-base text-gray-600 font-medium">
            Join as a car rental supplier
          </p>
        </div>
        
        <Card className="shadow-2xl border-0 backdrop-blur-sm bg-white/90 transform transition-all duration-300 hover:shadow-3xl">
          <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-purple-50 via-pink-50 to-rose-50 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/5 to-pink-600/5"></div>
            <div className="relative">
              <CardTitle className="text-2xl font-bold text-gray-900">Get started</CardTitle>
              <p className="text-sm text-gray-600 mt-2 font-medium">Enter your details to create an account</p>
            </div>
          </CardHeader>
          <CardContent className="pt-8 pb-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Input
                  label="Company Name"
                  placeholder="Your company name"
                  {...register('companyName')}
                  error={errors.companyName?.message}
                  className="transition-all duration-300 focus:scale-[1.02] focus:shadow-lg"
                />
              </div>

              <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-4 shadow-md">
                <Input
                  label="Account Type"
                  value="SOURCE"
                  disabled
                  className="cursor-not-allowed bg-white/50"
                />
                <div className="flex items-center mt-2 space-x-1">
                  <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <p className="text-xs font-semibold text-purple-700">
                    Source registration only
                  </p>
                </div>
              </div>
              <input type="hidden" {...register('type')} value="SOURCE" />

              <div className="space-y-2">
                <Input
                  label="Email"
                  type="email"
                  placeholder="company@example.com"
                  {...register('email')}
                  error={errors.email?.message}
                  className="transition-all duration-300 focus:scale-[1.02] focus:shadow-lg"
                />
              </div>

              <div className="space-y-2">
                <Input
                  label="Password"
                  type="password"
                  placeholder="Create a secure password"
                  {...register('password')}
                  error={errors.password?.message}
                  className="transition-all duration-300 focus:scale-[1.02] focus:shadow-lg"
                />
              </div>

              <Button
                type="submit"
                loading={isLoading}
                className="w-full mt-4 h-12 text-base font-semibold shadow-lg hover:shadow-xl transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              >
                {isLoading ? 'Creating account...' : 'Create Account'}
              </Button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <button
                  onClick={() => navigate('/login')}
                  className="font-semibold text-purple-600 hover:text-purple-500 transition-colors duration-200 hover:underline"
                >
                  Sign in
                </button>
              </p>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="space-y-3">
                <p className="text-xs font-bold text-gray-700 text-center">What you'll get:</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { icon: '📦', text: 'Manage inventory' },
                    { icon: '📋', text: 'Track bookings' },
                    { icon: '📊', text: 'View analytics' },
                    { icon: '🔌', text: 'API access' }
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-purple-50/50 rounded-lg p-2">
                      <span className="text-lg">{item.icon}</span>
                      <span className="text-xs font-medium text-gray-700">{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-xs text-gray-500 font-medium tracking-wide">
            Gloria Connect
          </p>
        </div>
      </div>

      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
      `}</style>
    </div>
  )
}
