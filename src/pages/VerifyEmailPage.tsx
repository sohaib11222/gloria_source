import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { authApi } from '../api/auth'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Verify Your Email
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            We've sent a 4-digit code to
          </p>
          <p className="mt-1 text-center text-sm font-medium text-gray-900">
            {email}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Enter Verification Code</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex justify-center space-x-4">
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
                    className="w-14 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                ))}
              </div>

              <Button
                type="submit"
                loading={isLoading}
                className="w-full"
                disabled={otp.join('').length !== 4}
              >
                Verify Email
              </Button>

              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Didn't receive the code?{' '}
                  <button
                    type="button"
                    onClick={handleResend}
                    className="font-medium text-blue-600 hover:text-blue-500"
                  >
                    Resend
                  </button>
                </p>
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => navigate('/register')}
                  className="text-sm font-medium text-gray-600 hover:text-gray-500"
                >
                  ← Back to Registration
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
