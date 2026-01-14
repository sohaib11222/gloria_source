import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'
import { Badge } from './ui/Badge'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { Loader } from './ui/Loader'
import { Settings, Globe, Zap, Edit2, Save, X, AlertCircle } from 'lucide-react'
import { EndpointConfig } from '../api/endpoints'
import { useState } from 'react'

interface EndpointConfigurationProps {
  endpointConfig: EndpointConfig | null
  isLoadingEndpoints: boolean
  isEditingEndpoints: boolean
  isUpdatingEndpoints: boolean
  httpEndpoint: string
  grpcEndpoint: string
  setHttpEndpoint: (value: string) => void
  setGrpcEndpoint: (value: string) => void
  setIsEditingEndpoints: (value: boolean) => void
  updateEndpointConfig: () => void
  cancelEditEndpoints: () => void
}

export const EndpointConfiguration: React.FC<EndpointConfigurationProps> = ({
  endpointConfig,
  isLoadingEndpoints,
  isEditingEndpoints,
  isUpdatingEndpoints,
  httpEndpoint,
  grpcEndpoint,
  setHttpEndpoint,
  setGrpcEndpoint,
  setIsEditingEndpoints,
  updateEndpointConfig,
  cancelEditEndpoints,
}) => {
  const [httpError, setHttpError] = useState<string>('')
  const [grpcError, setGrpcError] = useState<string>('')

  const validateHttpEndpoint = (value: string): string => {
    if (!value.trim()) {
      return 'HTTP endpoint is required'
    }
    try {
      const url = new URL(value)
      if (!['http:', 'https:'].includes(url.protocol)) {
        return 'HTTP endpoint must use http:// or https:// protocol'
      }
      return ''
    } catch {
      return 'Invalid HTTP endpoint format. Use: http://host:port or https://host:port'
    }
  }

  const validateGrpcEndpoint = (value: string): string => {
    if (!value.trim()) {
      return 'gRPC endpoint is required'
    }
    // gRPC endpoint format: host:port (no protocol)
    const grpcPattern = /^[a-zA-Z0-9.-]+:\d+$/
    if (!grpcPattern.test(value)) {
      return 'Invalid gRPC endpoint format. Use: host:port (e.g., localhost:51061)'
    }
    const parts = value.split(':')
    const port = parseInt(parts[1], 10)
    if (isNaN(port) || port < 1 || port > 65535) {
      return 'Port must be between 1 and 65535'
    }
    return ''
  }

  const handleHttpChange = (value: string) => {
    setHttpEndpoint(value)
    setHttpError(validateHttpEndpoint(value))
  }

  const handleGrpcChange = (value: string) => {
    setGrpcEndpoint(value)
    setGrpcError(validateGrpcEndpoint(value))
  }

  const handleSave = () => {
    const httpErr = validateHttpEndpoint(httpEndpoint)
    const grpcErr = validateGrpcEndpoint(grpcEndpoint)
    setHttpError(httpErr)
    setGrpcError(grpcErr)
    
    if (!httpErr && !grpcErr) {
      updateEndpointConfig()
    }
  }
  return (
    <Card className="mb-8 transform transition-all duration-300 hover:shadow-xl border-2 border-gray-100">
      <CardHeader className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <Settings className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-gray-900">Endpoint Configuration</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Configure your HTTP and gRPC endpoints
              </p>
            </div>
          </div>
          {!isEditingEndpoints && (
            <Button
              onClick={() => setIsEditingEndpoints(true)}
              variant="secondary"
              size="sm"
              className="flex items-center gap-2"
            >
              <Edit2 className="w-4 h-4" />
              Edit
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {isLoadingEndpoints ? (
          <div className="flex justify-center py-8">
            <Loader />
          </div>
        ) : endpointConfig ? (
          <div className="space-y-4">
            {isEditingEndpoints ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Input
                      label="HTTP Endpoint"
                      value={httpEndpoint}
                      onChange={(e) => handleHttpChange(e.target.value)}
                      placeholder="e.g., http://localhost:9090"
                    />
                    {httpError && (
                      <div className="flex items-center gap-1 mt-1 text-sm text-red-600">
                        <AlertCircle className="w-4 h-4" />
                        <span>{httpError}</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <Input
                      label="gRPC Endpoint"
                      value={grpcEndpoint}
                      onChange={(e) => handleGrpcChange(e.target.value)}
                      placeholder="e.g., localhost:51061"
                    />
                    {grpcError && (
                      <div className="flex items-center gap-1 mt-1 text-sm text-red-600">
                        <AlertCircle className="w-4 h-4" />
                        <span>{grpcError}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex space-x-3 pt-4">
                  <Button
                    onClick={handleSave}
                    loading={isUpdatingEndpoints}
                    disabled={!httpEndpoint || !grpcEndpoint || !!httpError || !!grpcError}
                    className="flex items-center gap-2 shadow-md hover:shadow-lg"
                  >
                    <Save className="w-4 h-4" />
                    Save Changes
                  </Button>
                  <Button
                    onClick={cancelEditEndpoints}
                    variant="secondary"
                    disabled={isUpdatingEndpoints}
                    className="flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </Button>
                </div>
              </>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-gray-500">HTTP Endpoint</label>
                  <p className="text-sm text-gray-900 font-mono mt-1">{endpointConfig.httpEndpoint}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">gRPC Endpoint</label>
                  <p className="text-sm text-gray-900 font-mono mt-1">{endpointConfig.grpcEndpoint}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Adapter Type</label>
                  <Badge variant="default">{endpointConfig.adapterType}</Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Last Updated</label>
                  <p className="text-sm text-gray-900">
                    {new Date(endpointConfig.updatedAt).toLocaleString()}
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">No endpoint configuration found</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

