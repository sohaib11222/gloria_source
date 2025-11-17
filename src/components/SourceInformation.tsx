import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'
import { Badge } from './ui/Badge'
import { Copy } from './ui/Copy'
import { getStatusColor } from '../lib/utils'

interface SourceInformationProps {
  user: any
}

export const SourceInformation: React.FC<SourceInformationProps> = ({ user }) => {
  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Source Information</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Source ID</label>
              <div className="flex items-center space-x-2">
                <p className="text-sm text-gray-900 font-mono">{user.id}</p>
                <Copy text={user.id} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Email</label>
              <p className="text-sm text-gray-900">{user.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Role</label>
              <Badge variant="info">{user.role}</Badge>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Company Name</label>
              <p className="text-sm text-gray-900">{user.company.companyName}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Company Type</label>
              <Badge variant="default">{user.company.type}</Badge>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Company Status</label>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(user.company.status)}`}
              >
                {user.company.status}
              </span>
            </div>
          </div>
        </div>
        
        {/* Access Token for Testing */}
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="text-sm font-medium text-yellow-800">Access Token (Testing Purpose)</h4>
              <p className="text-xs text-yellow-600 mt-1">
                This token is shown for testing purposes only
              </p>
              <div className="mt-2">
                <code className="text-xs text-yellow-800 break-all block whitespace-pre-wrap">
                  {localStorage.getItem('token') || 'No token found'}
                </code>
              </div>
            </div>
            <div className="ml-4">
              <Copy text={localStorage.getItem('token') || ''} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

