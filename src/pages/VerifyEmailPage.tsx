import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { authApi } from '../api/auth'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Mail, ArrowLeft, CheckCircle, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'

export default function VerifyEmailPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [otp, setOtp] = useState(['', '', '', ''])
  const [isLoading, setIsLoading] = useState(false)
  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ]

  // Get email from location state (passed from registration)
  const email = location.state?.email

  useEffect(() => {
    // Redirect to register if no email is provided
    if (!email) {
      toast.error('Please register first')
      navigate('/register')
    } else {
      // Focus on first input
      inputRefs[0].current?.focus()
    }
  }, [email, navigate])

  const handleOtpChange = (index: number, value: string) => {
    // Only allow numbers
    if (value && !/^\d$/.test(value)) {
      return
    }

    const newOtp = [...otp]
    newOtp[index] = value

    setOtp(newOtp)

    // Auto-focus next input
    if (value && index < 3) {
      inputRefs[index + 1].current?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle backspace
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs[index - 1].current?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').trim()
    
    // Only process if it's a 4-digit number
    if (/^\d{4}$/.test(pastedData)) {
      const digits = pastedData.split('')
      setOtp(digits)
      // Focus on last input
      inputRefs[3].current?.focus()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const otpValue = otp.join('')
    
    if (otpValue.length !== 4) {
      toast.error('Please enter all 4 digits')
      return
    }

    setIsLoading(true)

    try {
      const response = await authApi.verifyEmail({
        email,
        otp: otpValue,
      })

      // Store tokens and user data
      localStorage.setItem('token', response.access)
      localStorage.setItem('refreshToken', response.refresh)
      localStorage.setItem('user', JSON.stringify(response.user))

      toast.success(response.message || 'Email verified successfully!')
      
      // Navigate to source page
      navigate('/source')
    } catch (error: any) {
      console.error('Verification failed:', error)
      toast.error(error.response?.data?.message || 'Verification failed. Please check your OTP.')
      // Clear OTP on error
      setOtp(['', '', '', ''])
      inputRefs[0].current?.focus()
    } finally {
      setIsLoading(false)
    }
  }

  const handleResend = async () => {
    // You might want to add a resend OTP endpoint
    toast.success('OTP resent to your email')
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-pink-50 py-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
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
                <Mail className="w-10 h-10 text-white" />
              </div>
            </div>
          </div>
          <h2 className="text-4xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            Verify Your Email
          </h2>
          <p className="mt-2 text-base text-gray-600 font-medium">
            We've sent a 4-digit verification code to
          </p>
          <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-lg border border-purple-200 shadow-sm">
            <Mail className="w-4 h-4 text-purple-600" />
            <p className="text-sm font-semibold text-gray-900">{email}</p>
          </div>
        </div>

        <Card className="shadow-2xl border-0 backdrop-blur-sm bg-white/90 transform transition-all duration-300 hover:shadow-3xl">
          <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-purple-50 via-pink-50 to-rose-50 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/5 to-pink-600/5"></div>
            <div className="relative">
              <CardTitle className="text-2xl font-bold text-gray-900">Enter Verification Code</CardTitle>
              <p className="text-sm text-gray-600 mt-2 font-medium">Please check your email and enter the code below</p>
            </div>
          </CardHeader>
          <CardContent className="pt-8 pb-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex justify-center gap-3 sm:gap-4">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={inputRefs[index]}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={index === 0 ? handlePaste : undefined}
                    className={`
                      w-14 h-14 sm:w-16 sm:h-16 text-center text-2xl sm:text-3xl font-bold 
                      border-2 rounded-xl transition-all duration-200
                      ${digit 
                        ? 'border-purple-500 bg-purple-50 text-purple-700 shadow-md' 
                        : 'border-gray-300 bg-white text-gray-900'
                      }
                      focus:outline-none focus:ring-4 focus:ring-purple-200 focus:border-purple-500
                      hover:border-purple-400 hover:shadow-sm
                      disabled:opacity-50 disabled:cursor-not-allowed
                    `}
                    disabled={isLoading}
                  />
                ))}
              </div>

              {otp.join('').length === 4 && (
                <div className="flex items-center justify-center gap-2 text-green-600 animate-fade-in">
                  <CheckCircle className="w-5 h-5" />
                  <p className="text-sm font-medium">Code entered</p>
                </div>
              )}

              <Button
                type="submit"
                loading={isLoading}
                className="w-full h-12 text-base font-semibold shadow-lg hover:shadow-xl transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                disabled={otp.join('').length !== 4}
              >
                {isLoading ? 'Verifying...' : 'Verify Email'}
              </Button>

              <div className="pt-4 border-t border-gray-200">
                <div className="text-center space-y-3">
                  <p className="text-sm text-gray-600">
                    Didn't receive the code?{' '}
                    <button
                      type="button"
                      onClick={handleResend}
                      className="font-semibold text-purple-600 hover:text-purple-500 transition-colors duration-200 hover:underline inline-flex items-center gap-1"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Resend Code
                    </button>
                  </p>

                  <button
                    type="button"
                    onClick={() => navigate('/register')}
                    className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors duration-200 inline-flex items-center gap-2 group"
                  >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Back to Registration
                  </button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-xs text-gray-500 font-medium tracking-wide">
            Car Hire – Source Portal
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
