import api from '../lib/api'

export interface Branch {
  id: string
  sourceId: string
  agreementId?: string | null
  branchCode: string
  name: string
  status?: string | null
  locationType?: string | null
  collectionType?: string | null
  email?: string | null
  phone?: string | null
  latitude?: number | null
  longitude?: number | null
  addressLine?: string | null
  city?: string | null
  postalCode?: string | null
  country?: string | null
  countryCode?: string | null
  natoLocode?: string | null
  rawJson?: any
  createdAt: string
  updatedAt: string
}

export interface BranchListResponse {
  items: Branch[]
  total: number
  limit: number
  offset: number
  hasMore: boolean
}

export interface CreateBranchRequest {
  branchCode: string
  name: string
  status?: string
  locationType?: string
  collectionType?: string
  email?: string | null
  phone?: string | null
  latitude?: number | null
  longitude?: number | null
  addressLine?: string | null
  city?: string | null
  postalCode?: string | null
  country?: string | null
  countryCode?: string | null
  natoLocode?: string | null
  agreementId?: string | null
}

export interface UpdateBranchRequest {
  name?: string
  status?: string
  locationType?: string
  collectionType?: string
  email?: string | null
  phone?: string | null
  latitude?: number | null
  longitude?: number | null
  addressLine?: string | null
  city?: string | null
  postalCode?: string | null
  country?: string | null
  countryCode?: string | null
  natoLocode?: string | null
}

export const branchesApi = {
  listBranches: async (params?: {
    status?: string
    locationType?: string
    search?: string
    limit?: number
    offset?: number
  }): Promise<BranchListResponse> => {
    const response = await api.get('/sources/branches', { params })
    return response.data
  },

  getBranch: async (id: string): Promise<Branch> => {
    const response = await api.get(`/sources/branches/${id}`)
    return response.data
  },

  createBranch: async (data: CreateBranchRequest): Promise<Branch> => {
    const response = await api.post('/sources/branches', data)
    return response.data
  },

  updateBranch: async (id: string, data: UpdateBranchRequest): Promise<Branch> => {
    const response = await api.patch(`/sources/branches/${id}`, data)
    return response.data
  },

  listUnmappedBranches: async (params?: {
    limit?: number
    offset?: number
  }): Promise<BranchListResponse> => {
    const response = await api.get('/sources/branches/unmapped', { params })
    return response.data
  },
}

