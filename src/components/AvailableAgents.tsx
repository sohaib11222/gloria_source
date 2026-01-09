import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'
import { Button } from './ui/Button'
import { Loader } from './ui/Loader'
import { Badge } from './ui/Badge'
import { Tooltip } from './ui/Tooltip'
import { Users, Building2, Mail, CheckCircle, Send, FileText, Calendar } from 'lucide-react'
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
    <Card className="transform transition-all duration-300 hover:shadow-xl border-2 border-gray-100">
      <CardHeader className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white rounded-lg shadow-sm">
            <Users className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <CardTitle className="text-xl font-bold text-gray-900">Available Agents</CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              View and manage agreements with agents
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {isLoadingAgents ? (
          <div className="flex justify-center py-12">
            <Loader size="lg" />
          </div>
        ) : agents.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <Users className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Agents Available</h3>
            <p className="text-sm text-gray-500">No agents are currently registered in the system.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {agents.map((agent) => (
              <Card key={agent.id} className="border-2 border-gray-100 hover:border-indigo-200 transform transition-all duration-300 hover:shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="p-3 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl">
                          <Building2 className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="text-xl font-bold text-gray-900">
                              {agent.companyName}
                            </h4>
                            <Badge variant={agent.status === 'ACTIVE' ? 'success' : 'default'} size="md" className="font-semibold">
                              {agent.status}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-600">{agent.email}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <FileText className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-600">
                                <span className="font-semibold">{agent._count.agentAgreements}</span> agreement{agent._count.agentAgreements !== 1 ? 's' : ''}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Agent Agreements */}
                      <div className="mt-6 pt-6 border-t border-gray-200">
                        <div className="flex items-center gap-2 mb-4">
                          <FileText className="w-5 h-5 text-indigo-600" />
                          <h5 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Agreements</h5>
                          <Badge variant="default" size="sm">{agent.agentAgreements?.length || 0}</Badge>
                        </div>
                        {agent.agentAgreements && agent.agentAgreements.length > 0 ? (
                          <div className="space-y-3">
                            {agent.agentAgreements.map((agreement) => (
                              <Card key={agreement.id} className="border border-gray-200 hover:border-indigo-300 transition-all">
                                <CardContent className="p-4">
                                  <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-3 mb-2">
                                        {onViewAgreement ? (
                                          <button
                                            onClick={() => onViewAgreement(agreement.id)}
                                            className="text-sm font-bold text-indigo-600 hover:text-indigo-800 hover:underline transition-colors"
                                          >
                                            {agreement.agreementRef}
                                          </button>
                                        ) : (
                                          <span className="text-sm font-bold text-gray-900">
                                            {agreement.agreementRef}
                                          </span>
                                        )}
                                        <Badge variant={getStatusColor(agreement.status) as any} size="sm" className="font-semibold">
                                          {agreement.status}
                                        </Badge>
                                      </div>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3">
                                        <div className="flex items-center gap-2 text-xs text-gray-600">
                                          <Calendar className="w-3 h-3" />
                                          <span>
                                            {new Date(agreement.validFrom).toLocaleDateString()} - {new Date(agreement.validTo).toLocaleDateString()}
                                          </span>
                                        </div>
                                        <div className="text-xs text-gray-600">
                                          Source: <span className="font-semibold">{agreement.source.companyName}</span>
                                        </div>
                                      </div>
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
                                          className="flex items-center gap-2 shadow-md hover:shadow-lg"
                                        >
                                          <Send className="w-4 h-4" />
                                          Offer
                                        </Button>
                                      )

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
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        ) : (
                          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-center">
                            <p className="text-sm text-gray-500 italic">No agreements yet</p>
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-4 pt-4 border-t border-gray-200 flex items-center gap-4 text-xs text-gray-500">
                        <span>Created: {new Date(agent.createdAt).toLocaleString()}</span>
                        <span>Updated: {new Date(agent.updatedAt).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

