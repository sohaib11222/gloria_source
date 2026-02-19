import api from '../lib/api'

export type BranchEndpointFormat = 'XML' | 'JSON' | 'PHP' | 'CSV' | 'EXCEL'

export interface EndpointConfig {
  companyId: string
  companyName: string
  type: string
  httpEndpoint: string
  grpcEndpoint: string
  branchEndpointUrl?: string
  branchEndpointFormat?: BranchEndpointFormat | null
  branchDefaultCountryCode?: string | null
  locationEndpointUrl?: string
  locationListEndpointUrl?: string | null
  locationListRequestRoot?: string | null
  locationListAccountId?: string | null
  availabilityEndpointUrl?: string
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
  branchEndpointFormat?: BranchEndpointFormat | null
  branchDefaultCountryCode?: string | null
  locationEndpointUrl?: string
  locationListEndpointUrl?: string
  locationListRequestRoot?: string
  locationListAccountId?: string
  availabilityEndpointUrl?: string
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

export interface ImportLocationsResponse {
  message: string
  imported: number
  updated: number
  skipped: number
  total: number
  errors?: Array<{
    index: number
    unlocode?: string
    error: string
  }>
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

  importLocations: async (): Promise<ImportLocationsResponse> => {
    const response = await api.post('/sources/import-locations')
    return response.data
  },

  importLocationList: async (): Promise<ImportLocationsResponse & { branchesImported?: number; branchesUpdated?: number }> => {
    const response = await api.post('/sources/import-location-list')
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

  fetchAvailability: async (params?: {
    url?: string
    adapterType?: 'xml' | 'json' | 'grpc'
    pickupDateTime?: string
    returnDateTime?: string
    pickupLoc?: string
    returnLoc?: string
    requestorId?: string
    driverAge?: number
    citizenCountry?: string
    force?: boolean
  }): Promise<FetchAvailabilityResponse> => {
    const response = await api.post('/sources/fetch-availability', params ?? {})
    return response.data
  },

  getAvailabilitySamples: async (): Promise<{ samples: StoredAvailabilitySample[] }> => {
    const response = await api.get('/sources/availability-samples')
    return response.data
  },
}

export interface IncludedTerm {
  code?: string
  mandatory?: string
  header?: string
  price?: string
  excess?: string
  deposit?: string
  details?: string
}

export interface PricedEquip {
  description?: string
  equip_type?: string
  vendor_equip_id?: string
  charge?: {
    Amount?: string | number
    UnitCharge?: string | number
    Quantity?: string | number
    TaxInclusive?: string
  }
}

export interface OfferSummaryItem {
  vehicle_class: string
  vehicle_make_model: string
  total_price: number
  currency: string
  availability_status: string
  picture_url?: string
  transmission_type?: string
  vehicle_category?: string
  air_condition_ind?: string
  veh_id?: string
  door_count?: string
  baggage?: string
  included?: IncludedTerm[]
  not_included?: IncludedTerm[]
  priced_equips?: PricedEquip[]
}

export interface StoredAvailabilitySample {
  id: string
  criteriaHash: string
  pickupLoc: string
  returnLoc: string
  pickupIso: string
  returnIso: string
  offersCount: number
  adapterType?: 'xml' | 'json' | 'grpc'
  offersSummary?: OfferSummaryItem[] | null
  criteria?: {
    pickupLoc: string
    returnLoc: string
    pickupIso: string
    returnIso: string
    requestorId?: string
    driverAge?: number
    citizenCountry?: string
    adapterType?: 'xml' | 'json' | 'grpc'
  } | null
  fetchedAt: string
  updatedAt: string
}

export interface FetchAvailabilityResponse {
  message: string
  offersCount: number
  stored: boolean
  isNew: boolean
  duplicate?: boolean
  adapterType?: 'xml' | 'json' | 'grpc'
  offersSummary?: OfferSummaryItem[]
  criteria?: {
    pickupLoc: string
    returnLoc: string
    pickupIso: string
    returnIso: string
    requestorId?: string
    driverAge?: number
    citizenCountry?: string
    adapterType?: 'xml' | 'json' | 'grpc'
  }
  rawResponsePreview?: string
  parsedPreview?: any
  error?: string
  details?: any
}

