import React, { useState, useEffect, useRef } from 'react'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { Modal } from './ui/Modal'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { Select } from './ui/Select'
import { branchesApi, Branch, UpdateBranchRequest } from '../api/branches'
import { locationsApi, UNLocode } from '../api/locations'
import toast from 'react-hot-toast'

interface BranchEditModalProps {
  branch: Branch | null
  isOpen: boolean
  onClose: () => void
}

export const BranchEditModal: React.FC<BranchEditModalProps> = ({ branch, isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    status: '',
    locationType: '',
    collectionType: '',
    email: '',
    phone: '',
    latitude: '',
    longitude: '',
    addressLine: '',
    city: '',
    postalCode: '',
    country: '',
    countryCode: '',
    natoLocode: '',
  })

  // UN/LOCODE search state
  const [locodeSearchQuery, setLocodeSearchQuery] = useState('')
  const [showLocodeDropdown, setShowLocodeDropdown] = useState(false)
  const [selectedLocode, setSelectedLocode] = useState<UNLocode | null>(null)
  const locodeInputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const queryClient = useQueryClient()

  // Search UN/LOCODEs
  const { data: locodeResults, isLoading: isLoadingLocodes } = useQuery({
    queryKey: ['unlocodes', locodeSearchQuery],
    queryFn: () => locationsApi.searchUNLocodes({ query: locodeSearchQuery, limit: 10 }),
    enabled: locodeSearchQuery.length >= 2 && showLocodeDropdown,
  })

  useEffect(() => {
    if (branch) {
      setFormData({
        name: branch.name || '',
        status: branch.status || '',
        locationType: branch.locationType || '',
        collectionType: branch.collectionType || '',
        email: branch.email || '',
        phone: branch.phone || '',
        latitude: branch.latitude?.toString() || '',
        longitude: branch.longitude?.toString() || '',
        addressLine: branch.addressLine || '',
        city: branch.city || '',
        postalCode: branch.postalCode || '',
        country: branch.country || '',
        countryCode: branch.countryCode || '',
        natoLocode: branch.natoLocode || '',
      })
      setLocodeSearchQuery(branch.natoLocode || '')
      setSelectedLocode(null)
    }
  }, [branch, isOpen])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        locodeInputRef.current &&
        !locodeInputRef.current.contains(event.target as Node)
      ) {
        setShowLocodeDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLocodeSearch = (query: string) => {
    setLocodeSearchQuery(query)
    setFormData({ ...formData, natoLocode: query })
    setShowLocodeDropdown(query.length >= 2)
  }

  const handleSelectLocode = (locode: UNLocode) => {
    setFormData({
      ...formData,
      natoLocode: locode.unlocode,
      city: locode.place || formData.city,
      country: locode.country || formData.country,
      latitude: locode.latitude?.toString() || formData.latitude,
      longitude: locode.longitude?.toString() || formData.longitude,
    })
    setLocodeSearchQuery(locode.unlocode)
    setSelectedLocode(locode)
    setShowLocodeDropdown(false)
  }

  const updateMutation = useMutation({
    mutationFn: (data: UpdateBranchRequest) => {
      const updateData: UpdateBranchRequest = {}
      Object.keys(data).forEach((key) => {
        const value = (data as any)[key]
        if (value !== '' && value !== null && value !== undefined) {
          if (key === 'latitude' || key === 'longitude') {
            updateData[key] = parseFloat(value) || null
          } else {
            updateData[key as keyof UpdateBranchRequest] = value || null
          }
        }
      })
      return branchesApi.updateBranch(branch!.id, updateData)
    },
    onSuccess: () => {
      toast.success('Branch updated successfully')
      queryClient.invalidateQueries({ queryKey: ['branches'] })
      onClose()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update branch')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateMutation.mutate(formData as any)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Branch">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <Select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              options={[
                { value: '', label: 'Select status' },
                { value: 'ACTIVE', label: 'Active' },
                { value: 'INACTIVE', label: 'Inactive' },
              ]}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location Type</label>
            <Input
              value={formData.locationType}
              onChange={(e) => setFormData({ ...formData, locationType: e.target.value })}
            />
          </div>
          <div className="relative" ref={locodeInputRef}>
            <label className="block text-sm font-medium text-gray-700 mb-1">UN/LOCODE</label>
            <Input
              value={locodeSearchQuery}
              onChange={(e) => handleLocodeSearch(e.target.value)}
              onFocus={() => locodeSearchQuery.length >= 2 && setShowLocodeDropdown(true)}
              placeholder="Search UN/LOCODE (e.g., GBMAN, Manchester)"
              className="w-full"
            />
            {showLocodeDropdown && (
              <div
                ref={dropdownRef}
                className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto"
              >
                {isLoadingLocodes ? (
                  <div className="p-3 text-sm text-gray-500">Searching...</div>
                ) : locodeResults?.items && locodeResults.items.length > 0 ? (
                  locodeResults.items.map((locode) => (
                    <div
                      key={locode.unlocode}
                      className="p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                      onClick={() => handleSelectLocode(locode)}
                    >
                      <div className="font-medium text-sm">{locode.unlocode}</div>
                      <div className="text-xs text-gray-600">
                        {locode.place}, {locode.country}
                        {locode.iata_code && ` • IATA: ${locode.iata_code}`}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-3 text-sm text-gray-500">No UN/LOCODEs found</div>
                )}
              </div>
            )}
            {selectedLocode && (
              <div className="mt-1 text-xs text-gray-600">
                Selected: {selectedLocode.unlocode} - {selectedLocode.place}, {selectedLocode.country}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
            <Input
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
            <Input
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <Input
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
            <Input
              type="number"
              step="any"
              value={formData.latitude}
              onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
            <Input
              type="number"
              step="any"
              value={formData.longitude}
              onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
          <Input
            value={formData.addressLine}
            onChange={(e) => setFormData({ ...formData, addressLine: e.target.value })}
          />
        </div>
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={updateMutation.isPending}>
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  )
}

