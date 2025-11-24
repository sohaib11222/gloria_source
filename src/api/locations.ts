import api from '../lib/api'

export interface UNLocode {
  unlocode: string
  country: string
  place: string
  iata_code: string
  latitude: number
  longitude: number
}

export interface UNLocodeListResponse {
  items: UNLocode[]
  next_cursor: string
}

export const locationsApi = {
  searchUNLocodes: async (params?: {
    query?: string
    limit?: number
    cursor?: string
  }): Promise<UNLocodeListResponse> => {
    const response = await api.get('/locations', { params })
    return response.data
  },
}

