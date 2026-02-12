import api from '../lib/api'

export type PlanInterval = 'WEEKLY' | 'MONTHLY' | 'YEARLY'

export interface Plan {
  id: string
  name: string
  interval: PlanInterval
  stripePriceId: string | null
  amountCents: number
  pricePerBranchCents?: number
  branchLimit?: number
  active: boolean
}

export interface MySubscription {
  id: string
  sourceId: string
  planId: string
  subscribedBranchCount?: number
  status: string
  currentPeriodStart: string | null
  currentPeriodEnd: string | null
  active: boolean
  plan: Plan
}

export interface BranchQuotaExceededPayload {
  error: 'BRANCH_QUOTA_EXCEEDED'
  message: string
  currentCount: number
  subscribedCount: number
  adding: number
  needToAdd: number
}

export const subscriptionApi = {
  listPlans: async (): Promise<{ items: Plan[] }> => {
    const { data } = await api.get('/sources/plans')
    return data
  },

  getMySubscription: async (): Promise<MySubscription | null> => {
    try {
      const { data } = await api.get('/sources/me/subscription')
      return data
    } catch (e: any) {
      if (e.response?.status === 404) return null
      throw e
    }
  },

  createCheckoutSession: async (planId: string, successUrl?: string, cancelUrl?: string): Promise<{ url: string | null }> => {
    const { data } = await api.post('/sources/checkout-session', {
      planId,
      successUrl,
      cancelUrl,
    })
    return data
  },

  updateSubscriptionQuantity: async (quantity: number): Promise<{ subscribedBranchCount: number }> => {
    const { data } = await api.patch('/sources/me/subscription/quantity', { quantity })
    return data
  },
}

export interface SourceTransaction {
  id: string
  stripeInvoiceId: string
  planName: string | null
  status: string
  amountPaid: number
  amountDue: number
  currency: string
  createdAt: string | null
  periodStart: string | null
  periodEnd: string | null
  invoicePdf: string | null
  hostedInvoiceUrl: string | null
}

export const transactionsApi = {
  getMyTransactions: async (): Promise<{ items: SourceTransaction[] }> => {
    const { data } = await api.get('/sources/me/transactions')
    return data
  },
}
