import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'
import { Badge } from './ui/Badge'
import { Button } from './ui/Button'
import { SourceGrpcTestResponse } from '../api/endpoints'

interface GrpcConnectionTestProps {
  grpcEndpoint: string
  grpcTestResult: SourceGrpcTestResponse | null
  isTestingGrpc: boolean
  testSourceGrpc: () => void
}

export const GrpcConnectionTest: React.FC<GrpcConnectionTestProps> = ({
  grpcEndpoint,
  grpcTestResult,
  isTestingGrpc,
  testSourceGrpc,
}) => {
  return (
    <Card className="mb-8">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Test Source gRPC Connection</CardTitle>
          <Button
            onClick={testSourceGrpc}
            loading={isTestingGrpc}
            disabled={!grpcEndpoint}
          >
            Test Connection
          </Button>
        </div>
        <p className="text-sm text-gray-600">
          Test your gRPC endpoint connectivity and health status
        </p>
      </CardHeader>
      <CardContent>
        {grpcTestResult ? (
          <div className="space-y-4">
            {/* Overall Status */}
            <div className="p-4 rounded-lg" style={{
              backgroundColor: grpcTestResult.ok ? '#f0fdf4' : '#fef2f2',
              borderColor: grpcTestResult.ok ? '#86efac' : '#fca5a5',
              borderWidth: '1px'
            }}>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold" style={{
                    color: grpcTestResult.ok ? '#166534' : '#991b1b'
                  }}>
                    {grpcTestResult.ok ? 'Connection Successful' : 'Connection Failed'}
                  </h4>
                  <p className="text-sm mt-1" style={{
                    color: grpcTestResult.ok ? '#15803d' : '#b91c1c'
                  }}>
                    Address: {grpcTestResult.addr}
                  </p>
                  <p className="text-sm" style={{
                    color: grpcTestResult.ok ? '#15803d' : '#b91c1c'
                  }}>
                    Total time: {grpcTestResult.totalMs}ms
                  </p>
                </div>
                <Badge variant={grpcTestResult.ok ? 'success' : 'danger'}>
                  {grpcTestResult.ok ? 'HEALTHY' : 'UNHEALTHY'}
                </Badge>
              </div>
            </div>

            {/* Health Endpoint Details */}
            {grpcTestResult.endpoints.health && (
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="font-medium text-gray-900">Health Endpoint</h5>
                  <span className={`text-xs font-medium px-2 py-1 rounded ${
                    grpcTestResult.endpoints.health.ok 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {grpcTestResult.endpoints.health.ok ? 'OK' : 'FAILED'}
                  </span>
                </div>
                
                {grpcTestResult.endpoints.health.ok && grpcTestResult.endpoints.health.result ? (
                  <div>
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Status:</span>{' '}
                      <span className="text-green-700 font-semibold">
                        {grpcTestResult.endpoints.health.result.status}
                      </span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Response time: {grpcTestResult.endpoints.health.ms}ms
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-red-700 break-words">
                      <span className="font-medium">Error:</span>{' '}
                      <span className="block mt-1">{grpcTestResult.endpoints.health.error}</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      Failed after: {grpcTestResult.endpoints.health.ms}ms
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">Click "Test Connection" to verify your gRPC endpoint</p>
            <p className="text-xs text-gray-400 mt-2">
              Current endpoint: {grpcEndpoint || 'Not configured'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

