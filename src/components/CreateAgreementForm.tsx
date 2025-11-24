import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { Select } from './ui/Select'
import { Tooltip } from './ui/Tooltip'
import { Agent } from '../api/agreements'

interface CreateAgreementFormProps {
  agents: Agent[]
  selectedAgentId: string
  agreementRef: string
  validFrom: string
  validTo: string
  isCreatingAgreement: boolean
  setSelectedAgentId: (value: string) => void
  setAgreementRef: (value: string) => void
  setValidFrom: (value: string) => void
  setValidTo: (value: string) => void
  generateAgreementRef: () => void
  createAgreement: () => void
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
}

export const CreateAgreementForm: React.FC<CreateAgreementFormProps> = ({
  agents,
  selectedAgentId,
  agreementRef,
  validFrom,
  validTo,
  isCreatingAgreement,
  setSelectedAgentId,
  setAgreementRef,
  setValidFrom,
  setValidTo,
  generateAgreementRef,
  createAgreement,
  user,
  endpointConfig,
  grpcTestResult,
}) => {
  // Determine if create button should be disabled and why
  const getCreateButtonState = () => {
    // Check form fields first
    if (!selectedAgentId || selectedAgentId.trim() === '') {
      return {
        disabled: true,
        reason: 'Please select an agent to create an agreement with.',
      }
    }

    if (!agreementRef) {
      return {
        disabled: true,
        reason: 'Please enter an agreement reference or click "Generate" to create one.',
      }
    }

    if (!validFrom) {
      return {
        disabled: true,
        reason: 'Please select a "Valid From" date and time.',
      }
    }

    if (!validTo) {
      return {
        disabled: true,
        reason: 'Please select a "Valid To" date and time.',
      }
    }

    // Check company status
    if (user?.company.status !== 'ACTIVE') {
      return {
        disabled: true,
        reason: `Company status is ${user?.company.status}. Company must be ACTIVE to create agreements.`,
      }
    }

    // Check gRPC endpoint
    if (!endpointConfig?.grpcEndpoint) {
      return {
        disabled: true,
        reason: 'gRPC endpoint is not configured. Please configure your gRPC endpoint in the Dashboard.',
      }
    }

    // Check gRPC test
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
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Create New Agreement</CardTitle>
        <p className="text-sm text-gray-600">
          Create a new agreement with an agent
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Select
              label="Select Agent"
              value={selectedAgentId || ''}
              onChange={(e) => {
                const value = e.target.value
                setSelectedAgentId(value)
              }}
              options={[
                { value: '', label: '-- Select an agent --' },
                ...agents
                  .filter(agent => agent.status === 'ACTIVE')
                  .map(agent => ({
                    value: agent.id,
                    label: `${agent.companyName} (${agent.email})`
                  }))
              ]}
            />
          </div>
          <div>
            <div className="flex items-end space-x-2">
              <div className="flex-1">
                <Input
                  label="Agreement Reference"
                  value={agreementRef}
                  onChange={(e) => setAgreementRef(e.target.value)}
                  placeholder="e.g., AG-2025-001"
                />
              </div>
              <Button
                onClick={generateAgreementRef}
                variant="secondary"
                size="sm"
              >
                Generate
              </Button>
            </div>
          </div>
          <div>
            <Input
              label="Valid From"
              type="datetime-local"
              value={validFrom}
              onChange={(e) => setValidFrom(e.target.value)}
            />
          </div>
          <div>
            <Input
              label="Valid To"
              type="datetime-local"
              value={validTo}
              onChange={(e) => setValidTo(e.target.value)}
            />
          </div>
        </div>
        <div className="mt-4">
          {(() => {
            const buttonState = getCreateButtonState()
            const button = (
              <Button
                onClick={createAgreement}
                loading={isCreatingAgreement}
                disabled={buttonState.disabled}
                title={buttonState.disabled ? buttonState.reason : undefined}
              >
                Create Agreement
              </Button>
            )

            return buttonState.disabled ? (
              <div className="space-y-2">
                <Tooltip content={buttonState.reason} position="top">
                  {button}
                </Tooltip>
                <p className="text-xs text-amber-600 flex items-center gap-1">
                  <span>⚠️</span>
                  <span>{buttonState.reason}</span>
                </p>
              </div>
            ) : (
              button
            )
          })()}
        </div>
      </CardContent>
    </Card>
  )
}

