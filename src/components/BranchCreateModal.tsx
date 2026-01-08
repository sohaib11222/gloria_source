import React, { useState, useEffect, useRef } from 'react'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { Modal } from './ui/Modal'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { Select } from './ui/Select'
import { branchesApi, CreateBranchRequest } from '../api/branches'
import { locationsApi, UNLocode } from '../api/locations'
import toast from 'react-hot-toast'

interface BranchCreateModalProps {
  isOpen: boolean
  onClose: () => void
}

export const BranchCreateModal: React.FC<BranchCreateModalProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    branchCode: '',
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
    agreementId: '',
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

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        branchCode: '',
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
        agreementId: '',
      })
      setLocodeSearchQuery('')
      setSelectedLocode(null)
    }
  }, [isOpen])

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

  const createMutation = useMutation({
    mutationFn: (data: CreateBranchRequest) => {
      const createData: CreateBranchRequest = {
        branchCode: data.branchCode,
        name: data.name,
        status: data.status || undefined,
        locationType: data.locationType || undefined,
        collectionType: data.collectionType || undefined,
        email: data.email || null,
        phone: data.phone || null,
        latitude: data.latitude ? parseFloat(data.latitude.toString()) : null,
        longitude: data.longitude ? parseFloat(data.longitude.toString()) : null,
        addressLine: data.addressLine || null,
        city: data.city || null,
        postalCode: data.postalCode || null,
        country: data.country || null,
        countryCode: data.countryCode || null,
        natoLocode: data.natoLocode || null,
        agreementId: data.agreementId || null,
      }
      return branchesApi.createBranch(createData)
    },
    onSuccess: () => {
      toast.success('Branch created successfully')
      queryClient.invalidateQueries({ queryKey: ['branches'] })
      onClose()
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Failed to create branch'
      const errorCode = error.response?.data?.error
      
      if (errorCode === 'BRANCH_CODE_EXISTS') {
        toast.error(`Branch code "${formData.branchCode}" already exists`)
      } else if (errorCode === 'INVALID_UNLOCODE') {
        toast.error('Invalid UN/LOCODE. Please select a valid code from the dropdown.')
      } else {
        toast.error(errorMessage)
      }
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate required fields
    if (!formData.branchCode.trim()) {
      toast.error('Branch code is required')
      return
    }
    if (!formData.name.trim()) {
      toast.error('Name is required')
      return
    }

    createMutation.mutate(formData as any)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Branch">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Branch Code <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.branchCode}
              onChange={(e) => setFormData({ ...formData, branchCode: e.target.value.toUpperCase() })}
              placeholder="e.g., MAN001"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Branch name"
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
            <Select
              value={formData.locationType}
              onChange={(e) => setFormData({ ...formData, locationType: e.target.value })}
              options={[
                { value: '', label: 'Select type' },
                { value: 'AIRPORT', label: 'Airport' },
                { value: 'CITY', label: 'City' },
                { value: 'RAILWAY', label: 'Railway' },
              ]}
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
              placeholder="City name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
            <Input
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              placeholder="Country name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="branch@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <Input
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+1 234 567 8900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
            <Input
              type="number"
              step="any"
              value={formData.latitude}
              onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
              placeholder="51.5074"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
            <Input
              type="number"
              step="any"
              value={formData.longitude}
              onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
              placeholder="-0.1278"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
          <Input
            value={formData.addressLine}
            onChange={(e) => setFormData({ ...formData, addressLine: e.target.value })}
            placeholder="Street address"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
          <Input
            value={formData.postalCode}
            onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
            placeholder="Postal/ZIP code"
          />
        </div>
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="secondary" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={createMutation.isPending}>
            Create Branch
          </Button>
        </div>
      </form>
    </Modal>
  )
}

