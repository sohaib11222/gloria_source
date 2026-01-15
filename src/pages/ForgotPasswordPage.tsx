import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../api/auth'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import toast from 'react-hot-toast'

type Step = 'email' | 'verify' | 'reset'

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      toast.error('Please enter your email address')
      return
    }

    setIsLoading(true)
    try {
      await authApi.forgotPassword(email)
      toast.success('Password reset code sent! Please check your email.')
      setStep('verify')
    } catch (error: any) {
      console.error('Forgot password error:', error)
      const errorMessage = error.response?.data?.message || 'Failed to send reset code'
      if (error.response?.data?.error === 'EMAIL_NOT_VERIFIED') {
        toast.error('Please verify your email address before resetting your password')
      } else {
        toast.error(errorMessage)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!otp || otp.length !== 4) {
      toast.error('Please enter a valid 4-digit OTP code')
      return
    }

    setIsLoading(true)
    try {
      await authApi.verifyResetOTP(email, otp)
      toast.success('OTP verified! Please set your new password.')
      setStep('reset')
    } catch (error: any) {
      console.error('Verify OTP error:', error)
      toast.error(error.response?.data?.message || 'Invalid or expired OTP code')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPassword || newPassword.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    setIsLoading(true)
    try {
      await authApi.resetPassword(email, otp, newPassword)
      toast.success('Password reset successfully! You can now login.')
      navigate('/login')
    } catch (error: any) {
      console.error('Reset password error:', error)
      toast.error(error.response?.data?.message || 'Failed to reset password')
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Reset Password
          </h2>
          <p className="text-sm text-gray-600">
            {step === 'email' && 'Enter your email to receive a reset code'}
            {step === 'verify' && 'Enter the code sent to your email'}
            {step === 'reset' && 'Enter your new password'}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-900">
              {step === 'email' && 'Forgot Password'}
              {step === 'verify' && 'Verify Reset Code'}
              {step === 'reset' && 'Set New Password'}
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              {step === 'email' && "We'll send you a code to reset your password"}
              {step === 'verify' && 'Check your email for the 4-digit code'}
              {step === 'reset' && 'Choose a strong password for your account'}
            </p>
          </CardHeader>
          <CardContent className="pt-6 pb-6">
            {step === 'email' && (
              <form onSubmit={handleRequestReset} className="space-y-5">
                <div>
                  <Input
                    label="Email Address"
                    type="email"
                    autoComplete="email"
                    placeholder="source@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                
                <Button
                  type="submit"
                  loading={isLoading}
                  className="w-full mt-4"
                >
                  {isLoading ? 'Sending...' : 'Send Reset Code'}
                </Button>

                <div className="mt-4 text-center">
                  <button
                    type="button"
                    onClick={() => navigate('/login')}
                    className="text-sm text-slate-700 hover:text-slate-900 transition-colors underline"
                  >
                    Back to Sign In
                  </button>
                </div>
              </form>
            )}

            {step === 'verify' && (
              <form onSubmit={handleVerifyOTP} className="space-y-5">
                <div>
                  <Input
                    label="Reset Code"
                    type="text"
                    placeholder="Enter 4-digit code"
                    value={otp}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 4)
                      setOtp(value)
                    }}
                    maxLength={4}
                    className="text-center text-2xl font-mono tracking-widest"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Enter the 4-digit code sent to {email}
                  </p>
                </div>
                
                <Button
                  type="submit"
                  loading={isLoading}
                  className="w-full mt-4"
                >
                  {isLoading ? 'Verifying...' : 'Verify Code'}
                </Button>

                <div className="mt-4 text-center space-y-2">
                  <button
                    type="button"
                    onClick={handleRequestReset}
                    className="text-sm text-slate-700 hover:text-slate-900 transition-colors underline block"
                  >
                    Resend Code
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setStep('email')
                      setOtp('')
                    }}
                    className="text-sm text-gray-600 hover:text-gray-900 transition-colors underline block"
                  >
                    Change Email
                  </button>
                </div>
              </form>
            )}

            {step === 'reset' && (
              <form onSubmit={handleResetPassword} className="space-y-5">
                <div>
                  <Input
                    label="New Password"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Must be at least 6 characters
                  </p>
                </div>
                
                <div>
                  <Input
                    label="Confirm Password"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                
                <Button
                  type="submit"
                  loading={isLoading}
                  className="w-full mt-4"
                >
                  {isLoading ? 'Resetting...' : 'Reset Password'}
                </Button>

                <div className="mt-4 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setStep('verify')
                      setNewPassword('')
                      setConfirmPassword('')
                    }}
                    className="text-sm text-gray-600 hover:text-gray-900 transition-colors underline"
                  >
                    Back to Verification
                  </button>
                </div>
              </form>
            )}
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

