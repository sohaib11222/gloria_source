import React, { useState, useEffect, useCallback } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from './ui/Button'
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
  }, [searchQuery])

  const performSearch = async (query: string) => {
    if (!query.trim()) return

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
  }

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

  const handleAddLocation = () => {
    if (!selectedLocation) {
      toast.error('Please select a location first')
      return
    }

    addLocationMutation.mutate(selectedLocation.unlocode)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowResults(false)
    }
  }

  return (
    <div>
      <div className="space-y-4">
          <div className="relative">
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
                    onClick={() => handleSelectLocation(location)}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0"
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
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <code className="text-sm font-mono text-blue-600 font-semibold">
                      {selectedLocation.unlocode}
                    </code>
                    {selectedLocation.iata_code && (
                      <span className="text-xs text-gray-600">({selectedLocation.iata_code})</span>
                    )}
                  </div>
                  <div className="text-sm font-medium text-gray-900 mt-0.5">
                    {selectedLocation.place}
                  </div>
                  <div className="text-xs text-gray-600">
                    {selectedLocation.country}
                  </div>
                </div>
                <Button
                  onClick={handleAddLocation}
                  loading={addLocationMutation.isPending}
                  variant="primary"
                  size="sm"
                >
                  Add Location
                </Button>
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

