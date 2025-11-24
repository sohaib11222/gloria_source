import api from '../lib/api'

export interface LocationRequest {
  id: string
  sourceId: string
  locationName: string
  country: string
  city?: string | null
  address?: string | null
  iataCode?: string | null
  reason?: string | null
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  adminNotes?: string | null
  createdAt: string
  updatedAt: string
  reviewedBy?: string | null
  reviewedAt?: string | null
}

export interface LocationRequestListResponse {
  items: LocationRequest[]
  total: number
  limit: number
  offset: number
  hasMore: boolean
}

export interface CreateLocationRequestRequest {
  locationName: string
  country: string
  city?: string
  address?: string
  iataCode?: string
  reason?: string
}

export const locationRequestsApi = {
  createRequest: async (data: CreateLocationRequestRequest): Promise<LocationRequest> => {
    const response = await api.post('/locations/request', data)
    return response.data
  },

  listRequests: async (params?: {
    status?: string
    limit?: number
    offset?: number
  }): Promise<LocationRequestListResponse> => {
    const response = await api.get('/locations/requests', { params })
    return response.data
  },

  getRequest: async (id: string): Promise<LocationRequest> => {
    const response = await api.get(`/locations/requests/${id}`)
    return response.data
  },
}

