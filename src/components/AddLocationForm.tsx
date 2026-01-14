import React, { useState, useEffect, useCallback } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Input } from './ui/Input'
import { endpointsApi, Location } from '../api/endpoints'
import toast from 'react-hot-toast'

interface AddLocationFormProps {
  onSuccess?: () => void
  onLocationAdded?: (location: Location) => void
}

export const AddLocationForm: React.FC<AddLocationFormProps> = ({ onSuccess, onLocationAdded }) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Location[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)
  const [showResults, setShowResults] = useState(false)

  const queryClient = useQueryClient()

  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      setShowResults(false)
      return
    }

    setIsSearching(true)
    try {
      const response = await endpointsApi.searchLocations(query, 10)
      setSearchResults(response.items)
      setShowResults(true)
    } catch (error: any) {
      console.error('Failed to search locations:', error)
      toast.error(error.response?.data?.message || 'Failed to search locations')
      setSearchResults([])
      setShowResults(false)
    } finally {
      setIsSearching(false)
    }
  }, [])

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      setShowResults(false)
      return
    }

    const timeoutId = setTimeout(() => {
      performSearch(searchQuery)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchQuery, performSearch])

  const addLocationMutation = useMutation({
    mutationFn: (unlocode: string) => endpointsApi.addLocation(unlocode),
    onSuccess: (data) => {
      toast.success(`Location ${data.location.unlocode} added successfully!`)
      queryClient.invalidateQueries({ queryKey: ['locations'] })
      queryClient.invalidateQueries({ queryKey: ['syncedLocations'] })
      setSelectedLocation(null)
      setSearchQuery('')
      setSearchResults([])
      setShowResults(false)
      onLocationAdded?.(data.location)
      onSuccess?.()
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Failed to add location'
      const errorCode = error.response?.data?.error
      
      if (errorCode === 'LOCATION_ALREADY_ADDED') {
        toast.error('This location is already in your coverage')
      } else if (errorCode === 'UNLOCODE_NOT_FOUND') {
        toast.error('Location not found. Please search for a valid UN/LOCODE.')
      } else {
        toast.error(errorMessage)
      }
    },
  })

  const handleSelectLocation = (location: Location) => {
    setSelectedLocation(location)
    setSearchQuery(`${location.unlocode} - ${location.place}, ${location.country}`)
    setShowResults(false)
  }

  const handleAddLocation = useCallback(() => {
    if (!selectedLocation) {
      toast.error('Please select a location first')
      return
    }

    console.log('handleAddLocation called with:', selectedLocation.unlocode)
    try {
      addLocationMutation.mutate(selectedLocation.unlocode)
    } catch (error) {
      console.error('Error in handleAddLocation:', error)
      toast.error('Failed to add location')
    }
  }, [selectedLocation, addLocationMutation])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowResults(false)
    }
  }

  return (
    <div className="relative z-0">
      <div className="space-y-4">
          <div className="relative z-10">
            <Input
              label="Search Location"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setSelectedLocation(null)
              }}
              onKeyDown={handleKeyDown}
              placeholder="e.g., GBMAN, Manchester, GB, or MAN"
              disabled={addLocationMutation.isPending}
            />
            
            {/* Search Results Dropdown */}
            {showResults && searchResults.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {searchResults.map((location) => (
                  <button
                    key={location.unlocode}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleSelectLocation(location)
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <code className="text-xs font-mono text-blue-600 font-semibold">
                            {location.unlocode}
                          </code>
                          {location.iata_code && (
                            <span className="text-xs text-gray-500">({location.iata_code})</span>
                          )}
                        </div>
                        <div className="text-sm font-medium text-gray-900 mt-0.5">
                          {location.place}
                        </div>
                        <div className="text-xs text-gray-500">
                          {location.country}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {isSearching && (
              <div className="absolute right-3 top-9">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              </div>
            )}
          </div>

          {selectedLocation && (
            <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg relative">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <code className="text-sm font-mono text-blue-600 font-semibold bg-white px-2 py-1 rounded">
                      {selectedLocation.unlocode}
                    </code>
                    {selectedLocation.iata_code && (
                      <span className="text-xs text-gray-600 bg-white px-2 py-1 rounded">({selectedLocation.iata_code})</span>
                    )}
                  </div>
                  <div className="text-sm font-medium text-gray-900">
                    {selectedLocation.place}
                  </div>
                  <div className="text-xs text-gray-600">
                    {selectedLocation.country}
                  </div>
                </div>
                <div 
                  className="flex-shrink-0"
                  style={{ position: 'relative', zIndex: 100 }}
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      console.log('Add Location button clicked')
                      console.log('selectedLocation:', selectedLocation)
                      console.log('isPending:', addLocationMutation.isPending)
                      
                      if (!selectedLocation) {
                        toast.error('Please select a location first')
                        return
                      }
                      
                      if (addLocationMutation.isPending) {
                        console.log('Mutation already in progress, ignoring click')
                        return
                      }
                      
                      console.log('Calling handleAddLocation with:', selectedLocation.unlocode)
                      handleAddLocation()
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                    }}
                    disabled={addLocationMutation.isPending}
                    className="inline-flex items-center justify-center font-medium rounded transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed bg-slate-700 text-white hover:bg-slate-800 focus:ring-slate-500 border border-slate-700 px-3 py-1.5 text-sm shadow-md hover:shadow-lg cursor-pointer"
                    style={{ 
                      pointerEvents: addLocationMutation.isPending ? 'none' : 'auto',
                      position: 'relative',
                      zIndex: 100
                    }}
                  >
                    {addLocationMutation.isPending && (
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    )}
                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    {addLocationMutation.isPending ? 'Adding...' : 'Add Location'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {showResults && searchResults.length === 0 && searchQuery.trim() && !isSearching && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                No locations found. Try a different search term or use a valid UN/LOCODE.
              </p>
            </div>
          )}
        </div>
    </div>
  )
}

