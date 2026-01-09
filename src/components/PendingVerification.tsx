import { Card, CardContent } from './ui/Card'
import { Clock, AlertCircle } from 'lucide-react'

export const PendingVerification: React.FC = () => {
  return (
    <Card className="mb-8 transform transition-all duration-300 hover:shadow-xl">
      <CardContent>
        <div className="text-center py-12">
          <div className="max-w-md mx-auto p-8 bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50 border-2 border-yellow-200 rounded-2xl shadow-lg">
            <div className="flex flex-col items-center">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-yellow-400 rounded-full blur-xl opacity-30 animate-pulse"></div>
                <div className="relative bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full p-4 shadow-lg">
                  <Clock className="w-8 h-8 text-white" />
                </div>
              </div>
              <h4 className="font-bold text-xl text-gray-900 mb-3">Account Pending Verification</h4>
              <div className="space-y-3 text-sm text-gray-700">
                <p className="leading-relaxed">
                  Your company account is currently pending admin approval. 
                  Once approved, you will be able to manage agent agreements and access all features.
                </p>
                <div className="flex items-start gap-2 p-3 bg-white/60 rounded-lg border border-yellow-200 mt-4">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-yellow-800 text-left">
                    <strong>What's next?</strong> An administrator will review your account and approve it. 
                    You'll receive a notification once the approval is complete.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

