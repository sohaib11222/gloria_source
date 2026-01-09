import { Card, CardContent } from './ui/Card'
import { AlertTriangle, ArrowUp, Plug } from 'lucide-react'

export const GrpcTestRequired: React.FC = () => {
  return (
    <Card className="mb-8 transform transition-all duration-300 hover:shadow-xl">
      <CardContent>
        <div className="text-center py-12">
          <div className="max-w-md mx-auto p-8 bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 border-2 border-orange-200 rounded-2xl shadow-lg">
            <div className="flex flex-col items-center">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-orange-400 rounded-full blur-xl opacity-30 animate-pulse"></div>
                <div className="relative bg-gradient-to-br from-orange-400 to-amber-500 rounded-full p-4 shadow-lg">
                  <Plug className="w-8 h-8 text-white" />
                </div>
              </div>
              <h4 className="font-bold text-xl text-gray-900 mb-3">gRPC Connection Test Required</h4>
              <div className="space-y-3 text-sm text-gray-700">
                <p className="leading-relaxed">
                  Before you can create agreements with agents, you must successfully test your gRPC connection.
                </p>
                <div className="flex items-start gap-2 p-3 bg-white/60 rounded-lg border border-orange-200 mt-4">
                  <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-orange-800 text-left">
                    <strong>Action required:</strong> Please scroll up to the "Test Source gRPC Connection" section 
                    and run a successful connection test before proceeding.
                  </p>
                </div>
                <div className="flex items-center justify-center gap-2 mt-4 text-orange-600 animate-bounce">
                  <ArrowUp className="w-4 h-4" />
                  <span className="text-xs font-medium">Scroll up to test connection</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

