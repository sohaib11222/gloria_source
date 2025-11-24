import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'
import { Button } from './ui/Button'
import { Loader } from './ui/Loader'
import { Tooltip } from './ui/Tooltip'
import { Agent } from '../api/agreements'
import { getStatusColor } from '../lib/utils'

interface AvailableAgentsProps {
  agents: Agent[]
  isLoadingAgents: boolean
  isOfferingAgreement: string | null
  offerAgreement: (agreementId: string) => void
  user?: {
    company: {
      status: string
    }
  } | null
  endpointConfig?: {
    grpcEndpoint?: string | null
  } | null
  grpcTestResult?: {
    ok?: boolean
  } | null
  onViewAgreement?: (agreementId: string) => void
}

export const AvailableAgents: React.FC<AvailableAgentsProps> = ({
  agents,
  isLoadingAgents,
  isOfferingAgreement,
  offerAgreement,
  user,
  endpointConfig,
  grpcTestResult,
  onViewAgreement,
}) => {
  // Determine if offer button should be disabled and why
  const getOfferButtonState = (agreementStatus: string) => {
    if (agreementStatus !== 'DRAFT') {
      return {
        disabled: true,
        reason: `Agreement status is ${agreementStatus}. Only DRAFT agreements can be offered.`,
      }
    }

    if (user?.company.status !== 'ACTIVE') {
      return {
        disabled: true,
        reason: `Company status is ${user?.company.status}. Company must be ACTIVE to offer agreements.`,
      }
    }

    if (!endpointConfig?.grpcEndpoint) {
      return {
        disabled: true,
        reason: 'gRPC endpoint is not configured. Please configure your gRPC endpoint in the Dashboard.',
      }
    }

    if (!grpcTestResult?.ok) {
      return {
        disabled: true,
        reason: 'gRPC connection test has not passed. Please test your gRPC connection in the Dashboard.',
      }
    }

    return {
      disabled: false,
      reason: '',
    }
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>Available Agents</CardTitle>
        <p className="text-sm text-gray-600">
          View and manage agreements with agents
        </p>
      </CardHeader>
      <CardContent>
        {isLoadingAgents ? (
          <div className="flex justify-center py-8">
            <Loader />
          </div>
        ) : agents.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No agents available</p>
          </div>
        ) : (
          <div className="space-y-4">
            {agents.map((agent) => (
              <div key={agent.id} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-4">
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {agent.companyName}
                        </h4>
                        <p className="text-sm text-gray-500">
                          Email: {agent.email}
                        </p>
                        <p className="text-sm text-gray-500">
                          Agent ID: {agent.id}
                        </p>
                        <p className="text-sm text-gray-500">
                          Agreements: {agent._count.agentAgreements}
                        </p>
                      </div>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(agent.status)}`}
                      >
                        {agent.status}
                      </span>
                    </div>
                    
                    {/* Agent Agreements */}
                    <div className="mt-4">
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Agreements:</h5>
                      {agent.agentAgreements && agent.agentAgreements.length > 0 ? (
                        <div className="space-y-2">
                          {agent.agentAgreements.map((agreement) => (
                            <div key={agreement.id} className="p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2">
                                    {onViewAgreement ? (
                                      <button
                                        onClick={() => onViewAgreement(agreement.id)}
                                        className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                                      >
                                        {agreement.agreementRef}
                                      </button>
                                    ) : (
                                      <span className="text-sm font-medium text-gray-900">
                                        {agreement.agreementRef}
                                      </span>
                                    )}
                                    <span
                                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(agreement.status)}`}
                                    >
                                      {agreement.status}
                                    </span>
                                  </div>
                                  <p className="text-xs text-gray-500 mt-1">
                                    Valid: {new Date(agreement.validFrom).toLocaleDateString()} - {new Date(agreement.validTo).toLocaleDateString()}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    Source: {agreement.source.companyName}
                                  </p>
                                </div>
                                {(() => {
                                  const buttonState = getOfferButtonState(agreement.status)
                                  
                                  const button = (
                                    <Button
                                      onClick={() => offerAgreement(agreement.id)}
                                      loading={isOfferingAgreement === agreement.id}
                                      variant="primary"
                                      size="sm"
                                      disabled={buttonState.disabled}
                                      title={buttonState.disabled ? buttonState.reason : undefined}
                                    >
                                      Offer Agreement
                                    </Button>
                                  )

                                  // For disabled buttons, we need to wrap in a container that can receive hover events
                                  // since disabled buttons don't trigger mouse events
                                  return buttonState.disabled ? (
                                    <div className="relative inline-block" title={buttonState.reason}>
                                      <Tooltip content={buttonState.reason} position="top">
                                        <div className="inline-block">
                                          {button}
                                        </div>
                                      </Tooltip>
                                    </div>
                                  ) : (
                                    button
                                  )
                                })()}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 italic">No agreements yet</p>
                      )}
                    </div>
                    
                    <div className="mt-2 text-xs text-gray-500">
                      <p>Created: {new Date(agent.createdAt).toLocaleString()}</p>
                      <p>Updated: {new Date(agent.updatedAt).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

