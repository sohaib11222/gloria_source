import { Card, CardContent } from './ui/Card'
import { Clock, AlertCircle, Mail } from 'lucide-react'
import { Button } from './ui/Button'
import { useNavigate } from 'react-router-dom'

export const PendingApproval: React.FC = () => {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <Card className="border border-gray-200">
          <CardContent className="p-8">
            <div className="text-center">
              <div className="relative mb-6 inline-block">
                <div className="absolute inset-0 bg-yellow-400 rounded-full blur-xl opacity-30 animate-pulse"></div>
                <div className="relative bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full p-4 shadow-lg">
                  <Clock className="w-8 h-8 text-white" />
                </div>
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Waiting for Admin Approval
              </h2>
              
              <div className="space-y-4 text-sm text-gray-700 mb-6">
                <p className="leading-relaxed">
                  Your source account has been successfully registered and your email has been verified. 
                  However, your account is currently pending admin approval.
                </p>
                
                <div className="flex items-start gap-3 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="text-left">
                    <p className="font-semibold text-yellow-900 mb-1">What happens next?</p>
                    <p className="text-xs text-yellow-800">
                      An administrator will review your account and approve it. 
                      Once approved, you'll be able to access the full source dashboard, configure endpoints, 
                      and manage agreements with agents.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <Mail className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-left">
                    <p className="font-semibold text-blue-900 mb-1">Stay informed</p>
                    <p className="text-xs text-blue-800">
                      You'll receive a notification once your account has been approved. 
                      You can also try logging in again later.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <Button
                  variant="primary"
                  onClick={() => {
                    localStorage.removeItem('token')
                    localStorage.removeItem('refreshToken')
                    localStorage.removeItem('user')
                    navigate('/login')
                  }}
                  className="w-full"
                >
                  Return to Login
                </Button>
                
                <Button
                  variant="secondary"
                  onClick={() => {
                    localStorage.removeItem('token')
                    localStorage.removeItem('refreshToken')
                    localStorage.removeItem('user')
                    navigate('/register')
                  }}
                  className="w-full"
                >
                  Register Another Account
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
