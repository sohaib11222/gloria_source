import api from '../lib/api'

export interface EndpointConfig {
  companyId: string
  companyName: string
  type: string
  httpEndpoint: string
  grpcEndpoint: string
  adapterType: string
  description: string
  status: string
  updatedAt: string
}

export interface UpdateEndpointRequest {
  httpEndpoint: string
  grpcEndpoint: string
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
}

