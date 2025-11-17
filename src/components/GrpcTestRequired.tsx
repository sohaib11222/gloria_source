import { Card, CardContent } from './ui/Card'

export const GrpcTestRequired: React.FC = () => {
  return (
    <Card className="mb-8">
      <CardContent>
        <div className="text-center py-8">
          <div className="p-6 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="text-orange-800">
              <h4 className="font-medium text-lg mb-2">gRPC Connection Test Required</h4>
              <p className="text-sm">
                Before you can create agreements with agents, you must successfully test your gRPC connection.
              </p>
              <p className="text-xs mt-2 text-orange-600">
                Please scroll up to the "Test Source gRPC Connection" section and run a successful connection test.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

