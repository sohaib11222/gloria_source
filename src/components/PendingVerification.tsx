import { Card, CardContent } from './ui/Card'

export const PendingVerification: React.FC = () => {
  return (
    <Card className="mb-8">
      <CardContent>
        <div className="text-center py-8">
          <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="text-yellow-800">
              <h4 className="font-medium text-lg mb-2">Account Pending Verification</h4>
              <p className="text-sm">
                Your company account is currently pending admin approval. 
                Once approved, you will be able to manage agent agreements.
              </p>
              <p className="text-xs mt-2 text-yellow-600">
                Please wait for admin approval to access agreement management.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

