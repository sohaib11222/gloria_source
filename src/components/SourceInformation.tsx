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
    <Card className="mb-8">
      <CardHeader>
        <div className="flex items-center gap-3">
          <User className="w-5 h-5 text-gray-600" />
          <div>
            <CardTitle className="text-xl font-semibold text-gray-900">Source Information</CardTitle>
            <p className="text-sm text-gray-600 mt-1">Your account and company details</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-5">
            <div className="p-4 bg-gray-50 rounded border border-gray-200">
              <label className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-2 block flex items-center gap-2">
                <User className="w-4 h-4" />
                Source ID
              </label>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded text-gray-900 font-mono text-sm">
                  {user.id}
                </code>
                <Copy text={user.id} />
              </div>
            </div>
            
            <div className="p-4 bg-gray-50 rounded border border-gray-200">
              <label className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-2 block flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email
              </label>
              <p className="text-sm text-gray-900">{user.email}</p>
            </div>
            
            <div className="p-4 bg-gray-50 rounded border border-gray-200">
              <label className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-2 block flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Role
              </label>
              <Badge variant="info">{user.role}</Badge>
            </div>
          </div>
          
          <div className="space-y-5">
            <div className="p-4 bg-gray-50 rounded border border-gray-200">
              <label className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-2 block flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Company Name
              </label>
              <p className="text-sm text-gray-900">{user.company.companyName}</p>
            </div>
            
            <div className="p-4 bg-gray-50 rounded border border-gray-200">
              <label className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-2 block flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Company Type
              </label>
              <Badge variant="default">{user.company.type}</Badge>
            </div>
            
            <div className="p-4 bg-gray-50 rounded border border-gray-200">
              <label className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-2 block flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Company Status
              </label>
              <span
                className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getStatusColor(user.company.status)}`}
              >
                {user.company.status}
              </span>
            </div>
          </div>
        </div>
        
        {/* Access Token for Testing */}
        <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-gray-600" />
                <h4 className="text-sm font-medium text-gray-900">Access Token (Testing Purpose)</h4>
              </div>
              <p className="text-xs text-gray-600 mb-3">
                This token is shown for testing purposes only. Keep it secure.
              </p>
              <div className="p-3 bg-white border border-gray-300 rounded">
                <code className="text-xs text-gray-900 break-all block whitespace-pre-wrap font-mono">
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

