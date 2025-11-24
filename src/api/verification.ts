import api from '../lib/api'

export interface VerificationStep {
  name: string
  passed: boolean
  detail: string
}

export interface VerificationResult {
  company_id: string
  kind: 'SOURCE' | 'AGENT'
  passed: boolean
  steps: VerificationStep[]
  created_at: string
}

export const verificationApi = {
  runVerification: async (): Promise<VerificationResult> => {
    const response = await api.post('/verification/source/run')
    return response.data
  },

  getStatus: async (): Promise<VerificationResult | null> => {
    try {
      const response = await api.get('/verification/status')
      return response.data
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null
      }
      throw error
    }
  },
}

