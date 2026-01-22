import api from '../lib/api'

export interface EndpointConfig {
  companyId: string
  companyName: string
  type: string
  httpEndpoint: string
  grpcEndpoint: string
  branchEndpointUrl?: string
  adapterType: string
  description: string
  status: string
  updatedAt: string
  lastGrpcTestResult?: any
  lastGrpcTestAt?: string
  lastLocationSyncAt?: string
}

export interface UpdateEndpointRequest {
  httpEndpoint: string
  grpcEndpoint: string
  branchEndpointUrl?: string
}

export interface UpdateEndpointResponse {
  message: string
  companyId: string
  httpEndpoint: string
  grpcEndpoint: string
  adapterType: string
  updatedAt: string
}

export interface Location {
  unlocode: string
  country: string
  place: string
  iata_code: string
  latitude: number
  longitude: number
}

export interface LocationsResponse {
  items: Location[]
  next_cursor: string
}

export interface SourceGrpcTestRequest {
  addr: string
  grpcEndpoints?: {
    health?: string
    locations?: string
    availability?: string
    bookings?: string
  }
}

export interface SourceGrpcTestResponse {
  ok: boolean
  addr: string
  totalMs: number
  endpoints: {
    health: {
      ok: boolean
      result?: {
        status: string
      }
      error?: string
      ms: number
    } | null
    locations: any | null
    availability: any | null
    bookings: any | null
  }
  tested: string[]
}

export interface ImportBranchesResponse {
  message?: string
  imported?: number
  updated?: number
  total?: number
  skipped?: number
  summary?: {
    total: number
    valid: number
    invalid: number
    imported: number
    updated: number
    skipped: number
  }
  validationErrors?: any[]
}

export const endpointsApi = {
  getConfig: async (): Promise<EndpointConfig> => {
    const response = await api.get('/endpoints/config')
    return response.data
  },

  updateConfig: async (data: UpdateEndpointRequest): Promise<UpdateEndpointResponse> => {
    const response = await api.put('/endpoints/config', data)
    return response.data
  },

  getLocations: async (): Promise<LocationsResponse> => {
    const response = await api.get('/locations')
    return response.data
  },

  getLocationsByAgreement: async (agreementId: string): Promise<LocationsResponse | { items: Location[] }> => {
    const response = await api.get(`/agreements/${agreementId}/locations`)
    const data = response.data
    const items = (data?.items || []).map((i: any) => ({
      unlocode: i.unlocode,
      country: '',
      place: '',
      iata_code: '',
      latitude: 0,
      longitude: 0,
    }))
    return { items }
  },

  testSourceGrpc: async (data: SourceGrpcTestRequest): Promise<SourceGrpcTestResponse> => {
    const response = await api.post('/test/source-grpc', data)
    return response.data
  },

  syncLocations: async (sourceId: string): Promise<any> => {
    const response = await api.post(`/coverage/source/${sourceId}/sync`)
    return response.data
  },

  getSyncedLocations: async (sourceId: string): Promise<LocationsResponse> => {
    const response = await api.get(`/coverage/source/${sourceId}`)
    return response.data
  },

  importBranches: async (): Promise<ImportBranchesResponse> => {
    const response = await api.post('/sources/import-branches')
    return response.data
  },

  uploadBranches: async (branchesData: any): Promise<ImportBranchesResponse> => {
    // If branchesData is a string (PHP var_dump or XML), wrap it in an object
    // to ensure it's sent correctly
    const payload = typeof branchesData === 'string' 
      ? { rawContent: branchesData } 
      : branchesData
    
    const response = await api.post('/sources/upload-branches', payload)
    return response.data
  },

  searchLocations: async (query: string, limit = 25, cursor = ''): Promise<{ items: Location[]; next_cursor: string; has_more: boolean }> => {
    const response = await api.get('/sources/locations/search', {
      params: { query, limit, cursor },
    })
    return response.data
  },

  addLocation: async (unlocode: string): Promise<{ message: string; location: Location }> => {
    const response = await api.post('/sources/locations', { unlocode })
    return response.data
  },

  removeLocation: async (unlocode: string): Promise<{ message: string; unlocode: string }> => {
    const response = await api.delete(`/sources/locations/${unlocode}`)
    return response.data
  },
}

