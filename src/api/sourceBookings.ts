import api from '../lib/api'

export type SourceBookingView = 'reservations' | 'cancellations' | 'all'

export interface SourceBookingRow {
  id: string
  agentId: string
  agentCompanyName: string
  agentEmail: string | null
  agreementRef: string
  supplierBookingRef: string | null
  agentBookingRef: string | null
  status: string
  pickupUnlocode: string | null
  dropoffUnlocode: string | null
  pickupDateTime: string | null
  dropoffDateTime: string | null
  vehicleClass: string | null
  vehicleMakeModel: string | null
  ratePlanCode: string | null
  customerName: string | null
  contact: string | null
  createdAt: string
  updatedAt: string
}

export interface SourceBookingsListResponse {
  items: SourceBookingRow[]
  total: number
  limit: number
  offset: number
  hasMore: boolean
  view: SourceBookingView | 'all'
}

export const sourceBookingsApi = {
  list: async (params: {
    view: SourceBookingView | 'all'
    limit?: number
    offset?: number
  }): Promise<SourceBookingsListResponse> => {
    const { data } = await api.get('/sources/bookings', {
      params: {
        view: params.view,
        limit: params.limit ?? 100,
        offset: params.offset ?? 0,
      },
    })
    return data
  },
}
