import api from '../lib/api'

export interface Agreement {
  id: string
  agent_id: string
  source_id: string
  agreement_ref: string
  status: 'DRAFTED' | 'OFFERED' | 'ACCEPTED' | 'REJECTED'
  valid_from: string
  valid_to: string
}

export interface AgentAgreement {
  id: string
  agreementRef: string
  status: 'DRAFT' | 'OFFERED' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED'
  validFrom: string
  validTo: string
  sourceId: string
  source: {
    id: string
    companyName: string
    status: string
  }
}

export interface Agent {
  id: string
  companyName: string
  email: string
  status: string
  createdAt: string
  updatedAt: string
  adapterType: string
  grpcEndpoint: string | null
  _count: {
    users: number
    agentAgreements: number
  }
  agentAgreements: AgentAgreement[]
}

export interface AgreementsAllResponse {
  items: Agent[]
  total: number
  filters: {
    status: string
    type: string
  }
}

export interface CreateAgreementRequest {
  agent_id: string
  source_id: string
  agreement_ref: string
  valid_from: string
  valid_to: string
}

export interface CreateAgreementResponse {
  id: string
  agent_id: string
  source_id: string
  agreement_ref: string
  status: string
  valid_from: string
  valid_to: string
}

export interface AgreementError {
  error: string
  message: string
  agent_id: string
  source_id: string
  agreement_ref: string
  requestId: string
}

export const agreementsApi = {
  getAllAgents: async (): Promise<AgreementsAllResponse> => {
    const response = await api.get('/agreements/all')
    return response.data
  },

  createAgreement: async (data: CreateAgreementRequest): Promise<CreateAgreementResponse> => {
    const response = await api.post('/agreements', data)
    return response.data
  },

  offerAgreement: async (agreementId: string): Promise<Agreement> => {
    const response = await api.post(`/agreements/${agreementId}/offer`)
    return response.data
  },

  checkDuplicate: async (payload: {
    agreementRef: string
    agentId: string
    sourceId: string
  }): Promise<{ duplicate: boolean; existingId?: string }> => {
    const response = await api.post('/agreements/check-duplicate', payload)
    return response.data
  },
}
