import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'
import { Badge } from './ui/Badge'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { Loader } from './ui/Loader'
import { Settings, Globe, Zap, Edit2, Save, X } from 'lucide-react'
import { EndpointConfig } from '../api/endpoints'

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
                  <Input
                    label="HTTP Endpoint"
                    value={httpEndpoint}
                    onChange={(e) => setHttpEndpoint(e.target.value)}
                    placeholder="e.g., http://localhost:9090"
                  />
                  <Input
                    label="gRPC Endpoint"
                    value={grpcEndpoint}
                    onChange={(e) => setGrpcEndpoint(e.target.value)}
                    placeholder="e.g., localhost:5105"
                  />
                </div>
                <div className="flex space-x-3 pt-4">
                  <Button
                    onClick={updateEndpointConfig}
                    loading={isUpdatingEndpoints}
                    disabled={!httpEndpoint || !grpcEndpoint}
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

