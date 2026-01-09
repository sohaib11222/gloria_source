import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'
import { Badge } from './ui/Badge'
import { Copy } from './ui/Copy'
import { getStatusColor } from '../lib/utils'
import { User, Building2, Mail, Shield, CheckCircle } from 'lucide-react'

interface SourceInformationProps {
  user: any
}

export const SourceInformation: React.FC<SourceInformationProps> = ({ user }) => {
  return (
    <Card className="mb-8 transform transition-all duration-300 hover:shadow-xl border-2 border-gray-100">
      <CardHeader className="bg-gradient-to-r from-purple-50 via-pink-50 to-rose-50 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white rounded-lg shadow-sm">
            <User className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <CardTitle className="text-xl font-bold text-gray-900">Source Information</CardTitle>
            <p className="text-sm text-gray-600 mt-1">Your account and company details</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-5">
            <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 block flex items-center gap-2">
                <User className="w-4 h-4" />
                Source ID
              </label>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 bg-white border-2 border-blue-200 rounded-lg text-blue-700 font-mono text-sm font-bold">
                  {user.id}
                </code>
                <Copy text={user.id} />
              </div>
            </div>
            
            <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 block flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email
              </label>
              <p className="text-sm text-gray-900 font-medium">{user.email}</p>
            </div>
            
            <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-100">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 block flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Role
              </label>
              <Badge variant="info" className="text-sm font-bold">{user.role}</Badge>
            </div>
          </div>
          
          <div className="space-y-5">
            <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-100">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 block flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Company Name
              </label>
              <p className="text-sm text-gray-900 font-semibold">{user.company.companyName}</p>
            </div>
            
            <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border border-blue-100">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 block flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Company Type
              </label>
              <Badge variant="default" className="text-sm font-bold">{user.company.type}</Badge>
            </div>
            
            <div className="p-4 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-lg border border-amber-100">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 block flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Company Status
              </label>
              <span
                className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold ${getStatusColor(user.company.status)}`}
              >
                {user.company.status}
              </span>
            </div>
          </div>
        </div>
        
        {/* Access Token for Testing */}
        <div className="mt-6 p-5 bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50 border-2 border-amber-200 rounded-xl">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-5 h-5 text-amber-600" />
                <h4 className="text-sm font-bold text-amber-900">Access Token (Testing Purpose)</h4>
              </div>
              <p className="text-xs text-amber-700 mb-3">
                This token is shown for testing purposes only. Keep it secure.
              </p>
              <div className="p-3 bg-white/80 border border-amber-200 rounded-lg">
                <code className="text-xs text-amber-900 break-all block whitespace-pre-wrap font-mono">
                  {localStorage.getItem('token') || 'No token found'}
                </code>
              </div>
            </div>
            <div className="flex-shrink-0">
              <Copy text={localStorage.getItem('token') || ''} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

