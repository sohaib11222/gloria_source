import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { Select } from './ui/Select'
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
}) => {
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
              value={selectedAgentId}
              onChange={(e) => setSelectedAgentId(e.target.value)}
              options={agents
                .filter(agent => agent.status === 'ACTIVE')
                .map(agent => ({
                  value: agent.id,
                  label: `${agent.companyName} (${agent.email})`
                }))
              }
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
          <Button
            onClick={createAgreement}
            loading={isCreatingAgreement}
            disabled={!selectedAgentId || !agreementRef || !validFrom || !validTo}
          >
            Create Agreement
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

