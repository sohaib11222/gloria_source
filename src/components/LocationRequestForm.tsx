import React, { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Card } from './ui/Card'
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

  const queryClient = useQueryClient()

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
      toast.error('Please fill in required fields')
      return
    }
    createMutation.mutate(formData)
  }

  return (
    <Card>
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Request New Location</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Input
                label="Location Name *"
                value={formData.locationName}
                onChange={(e) => setFormData({ ...formData, locationName: e.target.value })}
                required
                placeholder="e.g., Manchester Airport"
              />
            </div>
            <div>
              <Input
                label="Country *"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                required
                placeholder="e.g., United Kingdom"
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
                onChange={(e) => setFormData({ ...formData, iataCode: e.target.value })}
                placeholder="e.g., MAN"
              />
            </div>
          </div>
          <div>
            <Input
              label="Address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Full address"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
            <textarea
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="Why is this location needed?"
            />
          </div>
          <div className="flex justify-end">
            <Button type="submit" variant="primary" loading={createMutation.isPending}>
              Submit Request
            </Button>
          </div>
        </form>
      </div>
    </Card>
  )
}

