import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { Modal } from './ui/Modal'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { Select } from './ui/Select'
import { branchesApi, CreateBranchRequest } from '../api/branches'
import { locationsApi, UNLocode } from '../api/locations'
import api from '../lib/api'
import toast from 'react-hot-toast'
import {
  MapPin, Mail, Globe, Clock, Plane, Navigation, Tag, Info,
  ChevronDown, ChevronUp,
} from 'lucide-react'

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const
const DAY_LABELS: Record<string, string> = {
  monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu',
  friday: 'Fri', saturday: 'Sat', sunday: 'Sun',
}
const DAY_CAPITALIZED: Record<string, string> = {
  monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday', thursday: 'Thursday',
  friday: 'Friday', saturday: 'Saturday', sunday: 'Sunday',
}

function buildRawJsonForCreate(
  openingHours: Record<string, string>,
  pickupInstructions: string,
  atAirport: boolean,
  brand: string
): Record<string, unknown> | null {
  const raw: Record<string, unknown> = {}
  const hasOpening = DAYS.some((d) => openingHours[d]?.trim())
  if (hasOpening) {
    const opening: Record<string, unknown> = {}
    DAYS.forEach((d) => {
      const val = openingHours[d]?.trim()
      if (!val) return
      const cap = DAY_CAPITALIZED[d]
      const parts = val.split(/\s*-\s*/)
      if (parts.length === 2) {
        opening[cap] = { attr: { Open: parts[0].trim(), Closed: parts[1].trim() } }
      } else {
        opening[cap] = { attr: { Open: val } }
      }
    })
    raw.Opening = opening
  }
  if (pickupInstructions.trim()) {
    raw.PickupInstructions = { attr: { Pickup: pickupInstructions.trim() } }
  }
  raw.AtAirport = String(atAirport)
  if (brand.trim()) raw.Brand = brand.trim()
  return Object.keys(raw).length ? raw : null
}

interface BranchCreateModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

interface SourceAgreementRow {
  id: string
  agreementRef: string
  status: string
  agent?: { companyName?: string }
}

export const BranchCreateModal: React.FC<BranchCreateModalProps> = ({ isOpen, onClose, onSuccess }) => {
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

  const [openingHours, setOpeningHours] = useState<Record<string, string>>(() => {
    const h: Record<string, string> = {}
    DAYS.forEach((d) => { h[d] = '' })
    return h
  })
  const [pickupInstructions, setPickupInstructions] = useState('')
  const [atAirport, setAtAirport] = useState(false)
  const [brand, setBrand] = useState('')

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    basic: true,
    address: true,
    contact: true,
    coordinates: true,
    hours: true,
    gloria: false,
    agreement: true,
  })

  const [locodeSearchQuery, setLocodeSearchQuery] = useState('')
  const [showLocodeDropdown, setShowLocodeDropdown] = useState(false)
  const [selectedLocode, setSelectedLocode] = useState<UNLocode | null>(null)
  const locodeInputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const queryClient = useQueryClient()

  const { data: agreementsData } = useQuery({
    queryKey: ['agreements', 'branch-create-modal'],
    queryFn: async () => {
      const { data } = await api.get('/agreements', { params: { scope: 'source' } })
      return data as { items?: SourceAgreementRow[] }
    },
    enabled: isOpen,
    staleTime: 30_000,
  })

  const agreementOptions = React.useMemo(() => {
    const items = agreementsData?.items ?? []
    const active = items.filter((a) => ['ACTIVE', 'ACCEPTED'].includes(String(a.status || '').toUpperCase()))
    const opts = [{ value: '', label: 'None (default — all agreements)' }]
    active.forEach((a) => {
      opts.push({
        value: a.id,
        label: `${a.agreementRef} — ${a.agent?.companyName || 'Agent'} (${a.status})`,
      })
    })
    return opts
  }, [agreementsData])

  const { data: locodeResults, isLoading: isLoadingLocodes } = useQuery({
    queryKey: ['unlocodes', locodeSearchQuery],
    queryFn: () => locationsApi.searchUNLocodes({ query: locodeSearchQuery, limit: 12 }),
    enabled: locodeSearchQuery.length >= 2 && showLocodeDropdown,
  })

  const resetForm = useCallback(() => {
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
    const h: Record<string, string> = {}
    DAYS.forEach((d) => { h[d] = '' })
    setOpeningHours(h)
    setPickupInstructions('')
    setAtAirport(false)
    setBrand('')
    setLocodeSearchQuery('')
    setSelectedLocode(null)
    setShowLocodeDropdown(false)
  }, [])

  useEffect(() => {
    if (isOpen) resetForm()
  }, [isOpen, resetForm])

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

  const handleLocodeInput = (query: string) => {
    const upper = query.toUpperCase()
    setLocodeSearchQuery(upper)
    setFormData((prev) => ({ ...prev, natoLocode: upper }))
    setSelectedLocode(null)
    setShowLocodeDropdown(upper.length >= 2)
  }

  const handleSelectLocode = (locode: UNLocode) => {
    setFormData((prev) => ({
      ...prev,
      natoLocode: locode.unlocode,
      city: locode.place || prev.city,
      country: locode.country || prev.country,
      latitude: locode.latitude != null ? String(locode.latitude) : prev.latitude,
      longitude: locode.longitude != null ? String(locode.longitude) : prev.longitude,
    }))
    setLocodeSearchQuery(locode.unlocode)
    setSelectedLocode(locode)
    setShowLocodeDropdown(false)
  }

  const createMutation = useMutation({
    mutationFn: (payload: CreateBranchRequest) => branchesApi.createBranch(payload),
    onSuccess: () => {
      toast.success('Branch created successfully')
      queryClient.invalidateQueries({ queryKey: ['branches'] })
      onSuccess?.()
      onClose()
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Failed to create branch'
      const errorCode = error.response?.data?.error
      if (errorCode === 'BRANCH_CODE_EXISTS') {
        toast.error(`Branch code "${formData.branchCode}" already exists`)
      } else if (errorCode === 'INVALID_UNLOCODE_FORMAT') {
        toast.error(errorMessage)
      } else if (errorCode === 'INVALID_UNLOCODE') {
        toast.error('Invalid UN/LOCODE. Use the search list or a valid 4–5 character code.')
      } else {
        toast.error(errorMessage)
      }
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.branchCode.trim()) {
      toast.error('Branch code is required')
      return
    }
    if (!formData.name.trim()) {
      toast.error('Name is required')
      return
    }

    const rawJson = buildRawJsonForCreate(openingHours, pickupInstructions, atAirport, brand)

    const createData: CreateBranchRequest = {
      branchCode: formData.branchCode.trim(),
      name: formData.name.trim(),
      status: formData.status || undefined,
      locationType: formData.locationType || undefined,
      collectionType: formData.collectionType || undefined,
      email: formData.email.trim() || null,
      phone: formData.phone.trim() || null,
      latitude: formData.latitude ? parseFloat(formData.latitude) : null,
      longitude: formData.longitude ? parseFloat(formData.longitude) : null,
      addressLine: formData.addressLine.trim() || null,
      city: formData.city.trim() || null,
      postalCode: formData.postalCode.trim() || null,
      country: formData.country.trim() || null,
      countryCode: formData.countryCode.trim().toUpperCase().slice(0, 3) || null,
      natoLocode: formData.natoLocode.trim() || null,
      agreementId: formData.agreementId.trim() || null,
      ...(rawJson ? { rawJson } : {}),
    }

    createMutation.mutate(createData)
  }

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }))
  }

  const SectionHeader = ({ id, icon: Icon, title }: { id: string; icon: React.ComponentType<{ className?: string }>; title: string }) => (
    <button
      type="button"
      onClick={() => toggleSection(id)}
      className="flex items-center justify-between w-full py-2.5 px-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
    >
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-gray-500" />
        <span className="text-sm font-semibold text-gray-700">{title}</span>
      </div>
      {expandedSections[id] ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
    </button>
  )

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Branch" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4 max-h-[80vh] overflow-y-auto pr-1">
        <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
          <Tag className="w-4 h-4 text-blue-600 shrink-0" />
          <div className="flex-1 min-w-0">
            <label className="block text-xs text-blue-600 font-medium">Branch Code *</label>
            <Input
              value={formData.branchCode}
              onChange={(e) => setFormData({ ...formData, branchCode: e.target.value.toUpperCase() })}
              placeholder="e.g. KEFA01"
              className="mt-0.5 font-mono font-semibold"
              required
            />
          </div>
          {atAirport && (
            <span className="flex items-center gap-1 bg-blue-100 text-blue-700 text-xs font-medium px-2 py-1 rounded-full shrink-0">
              <Plane className="w-3 h-3" /> Airport
            </span>
          )}
        </div>

        <SectionHeader id="agreement" icon={Info} title="Agreement (optional)" />
        {expandedSections.agreement && (
          <div className="pl-1 space-y-2">
            <p className="text-xs text-gray-500">
              Tie this branch to a specific agreement when availability or pricing differs by contract.
            </p>
            <Select
              value={formData.agreementId}
              onChange={(e) => setFormData({ ...formData, agreementId: e.target.value })}
              options={agreementOptions}
            />
          </div>
        )}

        <SectionHeader id="basic" icon={Info} title="Basic information" />
        {expandedSections.basic && (
          <div className="space-y-3 pl-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Name *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Branch display name"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
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
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Location type</label>
                <Input
                  value={formData.locationType}
                  onChange={(e) => setFormData({ ...formData, locationType: e.target.value })}
                  placeholder="e.g. Airport Meet And Greet, City Center"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Collection type</label>
                <Input
                  value={formData.collectionType}
                  onChange={(e) => setFormData({ ...formData, collectionType: e.target.value })}
                  placeholder="e.g. AIRPORT, CITY"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Brand</label>
                <Input
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="e.g. Europcar"
                />
              </div>
              <div className="flex items-center gap-3 pt-5">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={atAirport}
                    onChange={(e) => setAtAirport(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600" />
                  <span className="ml-2 text-xs font-medium text-gray-600 flex items-center gap-1">
                    <Plane className="w-3 h-3" /> At airport
                  </span>
                </label>
              </div>
            </div>
          </div>
        )}

        <SectionHeader id="address" icon={MapPin} title="Address" />
        {expandedSections.address && (
          <div className="space-y-3 pl-1">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Address line</label>
              <Input
                value={formData.addressLine}
                onChange={(e) => setFormData({ ...formData, addressLine: e.target.value })}
                placeholder="Street address"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">City</label>
                <Input value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Postal code</label>
                <Input value={formData.postalCode} onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Country</label>
                <Input
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  placeholder="Country name"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Country code (ISO)</label>
                <Input
                  value={formData.countryCode}
                  onChange={(e) => setFormData({ ...formData, countryCode: e.target.value.toUpperCase().slice(0, 3) })}
                  placeholder="e.g. IS, GB"
                  maxLength={3}
                />
              </div>
              <div className="sm:col-span-2 relative">
                <label className="block text-xs font-medium text-gray-600 mb-1">UN/LOCODE</label>
                <Input
                  ref={locodeInputRef}
                  value={locodeSearchQuery}
                  onChange={(e) => handleLocodeInput(e.target.value)}
                  onFocus={() => locodeSearchQuery.length >= 2 && setShowLocodeDropdown(true)}
                  placeholder="Search or type 4–5 chars (e.g. ISKEF)"
                  className="font-mono"
                  maxLength={8}
                />
                {showLocodeDropdown && (
                  <div
                    ref={dropdownRef}
                    className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-y-auto"
                  >
                    {isLoadingLocodes ? (
                      <div className="p-2 text-xs text-gray-500">Searching…</div>
                    ) : locodeResults?.items && locodeResults.items.length > 0 ? (
                      locodeResults.items.map((locode) => (
                        <button
                          key={locode.unlocode}
                          type="button"
                          className="w-full text-left px-3 py-2 hover:bg-blue-50 border-b border-gray-100 last:border-0 text-sm"
                          onClick={() => handleSelectLocode(locode)}
                        >
                          <span className="font-mono font-semibold">{locode.unlocode}</span>
                          <span className="text-gray-600 text-xs block">
                            {locode.place}, {locode.country}
                          </span>
                        </button>
                      ))
                    ) : (
                      <div className="p-2 text-xs text-gray-500">No matches — you can still save a valid code.</div>
                    )}
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Search the built-in UN/LOCODE list. If missing, type a 4–5 character code; Gloria registers it on save.
                </p>
                {selectedLocode && (
                  <p className="text-xs text-blue-700 mt-0.5">
                    Selected: {selectedLocode.unlocode} — {selectedLocode.place}, {selectedLocode.country}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <SectionHeader id="contact" icon={Mail} title="Contact" />
        {expandedSections.contact && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-1">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="branch@example.com"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+354 511 5660"
              />
            </div>
          </div>
        )}

        <SectionHeader id="coordinates" icon={Navigation} title="Coordinates" />
        {expandedSections.coordinates && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-1">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Latitude</label>
              <Input
                type="number"
                step="any"
                value={formData.latitude}
                onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                placeholder="64.001"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Longitude</label>
              <Input
                type="number"
                step="any"
                value={formData.longitude}
                onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                placeholder="-22.605"
              />
            </div>
          </div>
        )}

        <SectionHeader id="hours" icon={Clock} title="Opening hours" />
        {expandedSections.hours && (
          <div className="space-y-2 pl-1">
            <p className="text-xs text-gray-500 mb-2">Format: HH:mm - HH:mm (open - close)</p>
            <div className="grid grid-cols-1 gap-1.5">
              {DAYS.map((day) => {
                const val = openingHours[day]
                const hasValue = val && val.trim() !== ''
                return (
                  <div key={day} className="flex items-center gap-2">
                    <span className="w-10 text-xs font-semibold text-gray-500 text-right shrink-0">{DAY_LABELS[day]}</span>
                    <Input
                      value={val}
                      onChange={(e) => setOpeningHours({ ...openingHours, [day]: e.target.value })}
                      placeholder="e.g. 04:00 - 18:00"
                      className={`flex-1 text-sm ${hasValue ? 'border-green-300 bg-green-50/30' : ''}`}
                    />
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <SectionHeader id="gloria" icon={Globe} title="GLORIA details" />
        {expandedSections.gloria && (
          <div className="pl-1">
            <label className="block text-xs font-medium text-gray-600 mb-1">Pickup instructions</label>
            <textarea
              value={pickupInstructions}
              onChange={(e) => setPickupInstructions(e.target.value)}
              rows={3}
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-300 focus:border-blue-400 outline-none resize-y"
              placeholder="Instructions for customer pickup…"
            />
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 sticky bottom-0 bg-white pb-1">
          <Button variant="secondary" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={createMutation.isPending}>
            Create branch
          </Button>
        </div>
      </form>
    </Modal>
  )
}
