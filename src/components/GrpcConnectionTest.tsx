import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'
import { Badge } from './ui/Badge'
import { Button } from './ui/Button'
import { Zap, CheckCircle, XCircle, Activity, Clock, Globe } from 'lucide-react'
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
    <Card className="mb-8 transform transition-all duration-300 hover:shadow-xl border-2 border-gray-100">
      <CardHeader className="bg-gradient-to-r from-purple-50 via-pink-50 to-rose-50 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <Zap className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-gray-900">Test Source gRPC Connection</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Test your gRPC endpoint connectivity and health status
              </p>
            </div>
          </div>
          <Button
            onClick={testSourceGrpc}
            loading={isTestingGrpc}
            disabled={!grpcEndpoint}
            variant="primary"
            className="flex items-center gap-2 shadow-md hover:shadow-lg"
          >
            <Activity className="w-4 h-4" />
            Test Connection
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {grpcTestResult ? (
          <div className="space-y-4">
            {/* Overall Status */}
            <Card className={`border-2 ${
              grpcTestResult.ok ? 'border-green-200 bg-gradient-to-br from-green-50 to-emerald-50' : 'border-red-200 bg-gradient-to-br from-red-50 to-rose-50'
            }`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-4 rounded-xl shadow-lg ${
                      grpcTestResult.ok ? 'bg-gradient-to-br from-green-100 to-emerald-100' : 'bg-gradient-to-br from-red-100 to-rose-100'
                    }`}>
                      {grpcTestResult.ok ? (
                        <CheckCircle className="w-8 h-8 text-green-600" />
                      ) : (
                        <XCircle className="w-8 h-8 text-red-600" />
                      )}
                    </div>
                    <div>
                      <h4 className={`text-xl font-bold mb-2 ${
                        grpcTestResult.ok ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {grpcTestResult.ok ? 'Connection Successful' : 'Connection Failed'}
                      </h4>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <Globe className={`w-4 h-4 ${grpcTestResult.ok ? 'text-green-600' : 'text-red-600'}`} />
                          <span className={grpcTestResult.ok ? 'text-green-700' : 'text-red-700'}>
                            <span className="font-semibold">Address:</span> {grpcTestResult.addr}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className={`w-4 h-4 ${grpcTestResult.ok ? 'text-green-600' : 'text-red-600'}`} />
                          <span className={grpcTestResult.ok ? 'text-green-700' : 'text-red-700'}>
                            <span className="font-semibold">Total time:</span> {grpcTestResult.totalMs}ms
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <Badge variant={grpcTestResult.ok ? 'success' : 'danger'} size="lg" className="font-bold text-sm px-4 py-2">
                    {grpcTestResult.ok ? 'HEALTHY' : 'UNHEALTHY'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Health Endpoint Details */}
            {grpcTestResult.endpoints.health && (
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="font-medium text-gray-900">Health Endpoint (gRPC)</h5>
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

            {/* Locations Endpoint Details */}
            {grpcTestResult.endpoints.locations && (
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="font-medium text-gray-900">Locations Endpoint (gRPC)</h5>
                  <span className={`text-xs font-medium px-2 py-1 rounded ${
                    grpcTestResult.endpoints.locations.ok 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {grpcTestResult.endpoints.locations.ok ? 'OK' : 'FAILED'}
                  </span>
                </div>
                
                {grpcTestResult.endpoints.locations.ok && grpcTestResult.endpoints.locations.result ? (
                  <div>
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Locations returned:</span>{' '}
                      <span className="text-green-700 font-semibold">
                        {Array.isArray(grpcTestResult.endpoints.locations.result.locations) 
                          ? grpcTestResult.endpoints.locations.result.locations.length 
                          : 'N/A'}
                      </span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Response time: {grpcTestResult.endpoints.locations.ms}ms
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-red-700 break-words">
                      <span className="font-medium">Error:</span>{' '}
                      <span className="block mt-1">{grpcTestResult.endpoints.locations.error}</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      Failed after: {grpcTestResult.endpoints.locations.ms}ms
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

