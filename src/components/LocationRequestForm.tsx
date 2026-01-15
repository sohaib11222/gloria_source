import React, { useState, useRef } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { Card, CardHeader, CardContent, CardTitle } from './ui/Card'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { locationRequestsApi, CreateLocationRequestRequest } from '../api/locationRequests'
import toast from 'react-hot-toast'

interface LocationRequestFormProps {
  onSuccess?: () => void
}

export const LocationRequestForm: React.FC<LocationRequestFormProps> = ({ onSuccess }) => {
  const [formData, setFormData] = useState<CreateLocationRequestRequest>({
    locationName: '',
    country: '',
    city: '',
    address: '',
    iataCode: '',
    reason: '',
  })

  const locationNameInputRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()

  const handleFocusForm = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()
    
    console.log('Button clicked! Attempting to focus form...')
    console.log('Input ref current:', locationNameInputRef.current)
    
    // Small delay to ensure DOM is ready
    setTimeout(() => {
      if (locationNameInputRef.current) {
        locationNameInputRef.current.focus()
        locationNameInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
        console.log('Form focused successfully!')
      } else {
        console.error('Input ref is null!')
        // Fallback: try to find the input by ID or querySelector
        const inputById = document.getElementById('location-name-input') as HTMLInputElement
        const inputByPlaceholder = document.querySelector('input[placeholder*="Manchester Airport"]') as HTMLInputElement
        const input = inputById || inputByPlaceholder
        
        if (input) {
          input.focus()
          input.scrollIntoView({ behavior: 'smooth', block: 'center' })
          console.log('Form focused via fallback method!')
        } else {
          console.error('Could not find input element!')
        }
      }
    }, 10)
  }

  const createMutation = useMutation({
    mutationFn: (data: CreateLocationRequestRequest) => locationRequestsApi.createRequest(data),
    onSuccess: () => {
      toast.success('Location request submitted successfully')
      queryClient.invalidateQueries({ queryKey: ['locationRequests'] })
      // Reset form
      setFormData({
        locationName: '',
        country: '',
        city: '',
        address: '',
        iataCode: '',
        reason: '',
      })
      onSuccess?.()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to submit location request')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.locationName || !formData.country) {
      toast.error('Please fill in required fields (Location Name and Country Code)')
      return
    }
    // Validate country code format (2-letter ISO 3166-1 alpha-2)
    const countryCodeRegex = /^[A-Z]{2}$/;
    if (!countryCodeRegex.test(formData.country)) {
      toast.error('Country code must be a 2-letter ISO 3166-1 alpha-2 code (e.g., GB, US, FR)')
      return
    }
    createMutation.mutate(formData)
  }

  return (
    <Card className="transform transition-all duration-300 hover:shadow-xl border-2 border-gray-100">
      <CardHeader className="bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleFocusForm}
            onMouseDown={(e) => {
              e.stopPropagation()
            }}
            onMouseUp={(e) => {
              e.stopPropagation()
            }}
            className="p-2 bg-white rounded-lg shadow-sm hover:shadow-md hover:bg-emerald-50 active:bg-emerald-100 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 relative z-10"
            style={{ pointerEvents: 'auto' }}
            aria-label="Focus form to enter location data"
            title="Click to start entering location data"
          >
            <Plus className="w-5 h-5 text-emerald-600" />
          </button>
          <div>
            <CardTitle className="text-xl font-bold text-gray-900">Request New Location</CardTitle>
            <p className="text-sm text-gray-600 mt-1">Submit a request for a location not in the UN/LOCODE database</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Input
                ref={locationNameInputRef}
                id="location-name-input"
                label="Location Name *"
                value={formData.locationName}
                onChange={(e) => setFormData({ ...formData, locationName: e.target.value })}
                required
                placeholder="e.g., Manchester Airport"
              />
            </div>
            <div>
              <Input
                label="Country Code *"
                value={formData.country}
                onChange={(e) => {
                  const value = e.target.value.toUpperCase().slice(0, 2);
                  setFormData({ ...formData, country: value });
                }}
                required
                placeholder="e.g., GB, US, FR"
                maxLength={2}
                className="font-mono"
                helperText="2-letter ISO 3166-1 alpha-2 country code (e.g., GB for United Kingdom, US for United States)"
              />
            </div>
            <div>
              <Input
                label="City"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="e.g., Manchester"
              />
            </div>
            <div>
              <Input
                label="IATA Code"
                value={formData.iataCode}
                onChange={(e) => setFormData({ ...formData, iataCode: e.target.value.toUpperCase() })}
                placeholder="e.g., MAN"
                maxLength={3}
                className="font-mono"
                helperText="3-letter airport code (optional)"
              />
            </div>
          </div>
          <div>
            <Input
              label="Address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Full street address (optional)"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for Request
            </label>
            <textarea
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
              rows={4}
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="Please explain why this location is needed. This helps administrators review your request more effectively."
            />
            <p className="text-xs text-gray-500 mt-1">Provide context about why this location should be added to the system</p>
          </div>
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              * Required fields
            </p>
            <Button 
              type="submit" 
              variant="primary" 
              loading={createMutation.isPending}
              className="flex items-center gap-2 shadow-md hover:shadow-lg transition-shadow"
            >
              <Plus className="w-4 h-4" />
              Submit Request
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

