import React, { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Modal } from './ui/Modal'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { Select } from './ui/Select'
import { branchesApi, Branch, UpdateBranchRequest } from '../api/branches'
import toast from 'react-hot-toast'
import {
  MapPin, Mail, Globe, Clock, Plane, Navigation, Tag,
  ChevronDown, ChevronUp, Info, Car
} from 'lucide-react'

interface BranchEditModalProps {
  branch: Branch | null
  isOpen: boolean
  onClose: () => void
}

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const
const DAY_LABELS: Record<string, string> = {
  monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu',
  friday: 'Fri', saturday: 'Sat', sunday: 'Sun',
}
const DAY_CAPITALIZED: Record<string, string> = {
  monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday', thursday: 'Thursday',
  friday: 'Friday', saturday: 'Saturday', sunday: 'Sunday',
}

/**
 * Robustly get a nested value from an object trying multiple key patterns.
 * e.g. for a day entry: { attr: { Open: "08:00" } } or { "@_Open": "08:00" } or { "@attributes": { Open: "08:00" } }
 */
function getAttr(obj: any, key: string): string {
  if (!obj || typeof obj !== 'object') return ''
  // Try: obj.attr.Key, obj["@attributes"].Key, obj["@_Key"], obj.Key, obj[key.toLowerCase()]
  const val =
    obj?.attr?.[key] ??
    obj?.['@attributes']?.[key] ??
    obj?.[`@_${key}`] ??
    obj?.[key] ??
    obj?.[key.toLowerCase()] ??
    ''
  return typeof val === 'object' ? '' : String(val ?? '')
}

function extractOpeningHours(branch: Branch | null): Record<string, string> {
  const hours: Record<string, string> = {}
  DAYS.forEach(d => { hours[d] = '' })
  if (!branch?.rawJson) return hours

  const raw = branch.rawJson
  const opening = raw.Opening || raw.opening
  if (!opening || typeof opening !== 'object') return hours

  for (const day of DAYS) {
    const cap = DAY_CAPITALIZED[day]
    const entry = opening[day] || opening[cap]
    if (!entry) continue

    if (typeof entry === 'string') {
      hours[day] = entry
      continue
    }

    // Handle { attr: { Open: "08:00", Closed: "16:00" } } format
    const openTime = getAttr(entry, 'Open')
    const closedTime = getAttr(entry, 'Closed') || getAttr(entry, 'Close')

    if (openTime && closedTime) {
      hours[day] = `${openTime} - ${closedTime}`
    } else if (openTime) {
      // Could be "HH:mm - HH:mm" already or just an open time
      hours[day] = openTime
    } else {
      hours[day] = 'Closed'
    }
  }
  return hours
}

function extractPickupInstructions(branch: Branch | null): string {
  if (!branch?.rawJson) return ''
  const raw = branch.rawJson
  const pi = raw.PickupInstructions || raw.pickupInstructions
  if (!pi) return ''
  if (typeof pi === 'string') return pi
  return getAttr(pi, 'Pickup')
}

function extractAtAirport(branch: Branch | null): boolean {
  if (!branch?.rawJson) return false
  const raw = branch.rawJson
  const val =
    raw.AtAirport ?? raw.atAirport ??
    raw['@_AtAirport'] ?? raw?.['@attributes']?.AtAirport ??
    raw?.attr?.AtAirport ?? ''
  return String(val).toLowerCase() === 'true'
}

function extractBrand(branch: Branch | null): string {
  if (!branch?.rawJson) return ''
  const raw = branch.rawJson
  return raw.Brand || raw.brand || raw['@_Brand'] || raw?.['@attributes']?.Brand || raw?.attr?.Brand || ''
}

function extractCars(branch: Branch | null): any[] {
  if (!branch?.rawJson) return []
  const raw = branch.rawJson
  const cars = raw.Cars || raw.cars
  if (!cars) return []
  const codeList = cars.Code || cars.code
  if (!codeList) return []
  return Array.isArray(codeList) ? codeList : [codeList]
}

function getCarAttr(car: any, key: string): string {
  if (!car) return ''
  return car?.attr?.[key] ?? car?.['@attributes']?.[key] ?? car?.[`@_${key}`] ?? car?.[key] ?? car?.[key.toLowerCase()] ?? ''
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

  const [openingHours, setOpeningHours] = useState<Record<string, string>>(() => {
    const h: Record<string, string> = {}
    DAYS.forEach(d => { h[d] = '' })
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
    cars: false,
  })

  const queryClient = useQueryClient()

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
      setOpeningHours(extractOpeningHours(branch))
      setPickupInstructions(extractPickupInstructions(branch))
      setAtAirport(extractAtAirport(branch))
      setBrand(extractBrand(branch))
    }
  }, [branch, isOpen])

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const updateMutation = useMutation({
    mutationFn: (data: UpdateBranchRequest) => {
      const updateData: UpdateBranchRequest = {}
      const basicKeys = [
        'name', 'status', 'locationType', 'collectionType', 'email', 'phone',
        'addressLine', 'city', 'postalCode', 'country', 'countryCode',
      ]
      basicKeys.forEach((key) => {
        const value = (data as any)[key]
        if (value !== '' && value !== null && value !== undefined) {
          (updateData as any)[key] = value || null
        }
      })

      if (data.latitude !== undefined && data.latitude !== null) {
        updateData.latitude = typeof data.latitude === 'string' ? parseFloat(data.latitude) || null : data.latitude
      }
      if (data.longitude !== undefined && data.longitude !== null) {
        updateData.longitude = typeof data.longitude === 'string' ? parseFloat(data.longitude) || null : data.longitude
      }

      // Build rawJson updates using the same format as imported data
      const rawJsonUpdates: any = {}

      // Opening hours - save in the same { Monday: { attr: { Open: "08:00", Closed: "16:00" } } } format
      const hasOpeningChanges = DAYS.some(d => openingHours[d] !== '')
      if (hasOpeningChanges) {
        const opening: any = {}
        DAYS.forEach(d => {
          const val = openingHours[d].trim()
          if (!val) return
          const cap = DAY_CAPITALIZED[d]
          const parts = val.split(/\s*-\s*/)
          if (parts.length === 2) {
            opening[cap] = { attr: { Open: parts[0].trim(), Closed: parts[1].trim() } }
          } else {
            opening[cap] = { attr: { Open: val } }
          }
        })
        rawJsonUpdates.Opening = opening
      }

      if (pickupInstructions) {
        rawJsonUpdates.PickupInstructions = { attr: { Pickup: pickupInstructions } }
      }
      rawJsonUpdates.AtAirport = String(atAirport)
      if (brand) {
        rawJsonUpdates.Brand = brand
      }

      if (Object.keys(rawJsonUpdates).length > 0) {
        updateData.rawJson = rawJsonUpdates
      }

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

  const cars = extractCars(branch)

  const SectionHeader = ({ id, icon: Icon, title, count }: { id: string; icon: any; title: string; count?: number }) => (
    <button
      type="button"
      onClick={() => toggleSection(id)}
      className="flex items-center justify-between w-full py-2.5 px-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
    >
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-gray-500" />
        <span className="text-sm font-semibold text-gray-700">{title}</span>
        {count !== undefined && (
          <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">{count}</span>
        )}
      </div>
      {expandedSections[id] ? (
        <ChevronUp className="w-4 h-4 text-gray-400" />
      ) : (
        <ChevronDown className="w-4 h-4 text-gray-400" />
      )}
    </button>
  )

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Branch" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">

        {/* Branch Code (read-only info bar) */}
        <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
          <Tag className="w-4 h-4 text-blue-600 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-xs text-blue-600 font-medium">Branch Code</div>
            <div className="text-sm font-mono font-semibold text-blue-900 truncate">{branch?.branchCode || '—'}</div>
          </div>
          {atAirport && (
            <span className="flex items-center gap-1 bg-blue-100 text-blue-700 text-xs font-medium px-2 py-1 rounded-full">
              <Plane className="w-3 h-3" /> Airport
            </span>
          )}
          {brand && (
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{brand}</span>
          )}
        </div>

        {/* ─── Basic Info ─── */}
        <SectionHeader id="basic" icon={Info} title="Basic Information" />
        {expandedSections.basic && (
          <div className="space-y-3 pl-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Name</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                <label className="block text-xs font-medium text-gray-600 mb-1">Location Type</label>
                <Input
                  value={formData.locationType}
                  onChange={(e) => setFormData({ ...formData, locationType: e.target.value })}
                  placeholder="e.g. Outside Airport, City Center"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Collection Type</label>
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
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  <span className="ml-2 text-xs font-medium text-gray-600 flex items-center gap-1">
                    <Plane className="w-3 h-3" /> At Airport
                  </span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* ─── Address ─── */}
        <SectionHeader id="address" icon={MapPin} title="Address" />
        {expandedSections.address && (
          <div className="space-y-3 pl-1">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Address Line</label>
              <Input
                value={formData.addressLine}
                onChange={(e) => setFormData({ ...formData, addressLine: e.target.value })}
                placeholder="Street address"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">City</label>
                <Input
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Postal Code</label>
                <Input
                  value={formData.postalCode}
                  onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                />
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
                <label className="block text-xs font-medium text-gray-600 mb-1">Country Code (ISO)</label>
                <Input
                  value={formData.countryCode}
                  onChange={(e) => setFormData({ ...formData, countryCode: e.target.value.toUpperCase().slice(0, 3) })}
                  placeholder="e.g. GB, AE, US"
                  maxLength={3}
                />
              </div>
              {/* UN/LOCODE (read-only, auto-assigned during import) */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">UN/LOCODE</label>
                <Input
                  value={formData.natoLocode}
                  disabled
                  className="bg-gray-100 text-gray-700 cursor-not-allowed font-mono"
                />
                <p className="text-xs text-gray-400 mt-0.5">Auto-assigned during import. Re-import to update.</p>
              </div>
            </div>
          </div>
        )}

        {/* ─── Contact ─── */}
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
                placeholder="+441234567890"
              />
            </div>
          </div>
        )}

        {/* ─── Coordinates ─── */}
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
                placeholder="e.g. 51.5074"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Longitude</label>
              <Input
                type="number"
                step="any"
                value={formData.longitude}
                onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                placeholder="e.g. -0.1278"
              />
            </div>
          </div>
        )}

        {/* ─── Opening Hours ─── */}
        <SectionHeader id="hours" icon={Clock} title="Opening Hours" />
        {expandedSections.hours && (
          <div className="space-y-2 pl-1">
            <p className="text-xs text-gray-500 mb-2">Format: HH:mm - HH:mm (open - close)</p>
            <div className="grid grid-cols-1 gap-1.5">
              {DAYS.map(day => {
                const val = openingHours[day]
                const hasValue = val && val.trim() !== ''
                return (
                  <div key={day} className="flex items-center gap-2">
                    <span className="w-10 text-xs font-semibold text-gray-500 text-right shrink-0">{DAY_LABELS[day]}</span>
                    <Input
                      value={val}
                      onChange={(e) => setOpeningHours({ ...openingHours, [day]: e.target.value })}
                      placeholder="e.g. 08:00 - 18:00"
                      className={`flex-1 text-sm ${hasValue ? 'border-green-300 bg-green-50/30' : ''}`}
                    />
                    {hasValue && (
                      <span className="text-xs text-green-600 shrink-0 w-6 text-center">&#10003;</span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ─── GLORIA Details (Pickup, etc.) ─── */}
        <SectionHeader id="gloria" icon={Globe} title="GLORIA Details" />
        {expandedSections.gloria && (
          <div className="space-y-3 pl-1">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Pickup Instructions</label>
              <textarea
                value={pickupInstructions}
                onChange={(e) => setPickupInstructions(e.target.value)}
                rows={3}
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-300 focus:border-blue-400 outline-none resize-y"
                placeholder="Instructions for customer pickup..."
              />
            </div>
            {branch?.rawJson && (
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <div className="text-xs font-medium text-gray-500 mb-2">Raw GLORIA Data</div>
                <pre className="text-xs text-gray-600 whitespace-pre-wrap break-words max-h-48 overflow-y-auto font-mono leading-relaxed">
                  {JSON.stringify(branch.rawJson, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* ─── Available Cars (read-only) ─── */}
        {cars.length > 0 && (
          <>
            <SectionHeader id="cars" icon={Car} title="Available Cars" count={cars.length} />
            {expandedSections.cars && (
              <div className="pl-1">
                <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-2 py-1.5 text-left font-medium text-gray-600">ACRISS</th>
                        <th className="px-2 py-1.5 text-left font-medium text-gray-600">Group</th>
                        <th className="px-2 py-1.5 text-left font-medium text-gray-600">Make</th>
                        <th className="px-2 py-1.5 text-left font-medium text-gray-600">Model</th>
                        <th className="px-2 py-1.5 text-center font-medium text-gray-600">Doors</th>
                        <th className="px-2 py-1.5 text-center font-medium text-gray-600">Seats</th>
                        <th className="px-2 py-1.5 text-right font-medium text-gray-600">Deposit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {cars.map((car, i) => {
                        const acriss = getCarAttr(car, 'Acrisscode')
                        const group = getCarAttr(car, 'Group')
                        const make = getCarAttr(car, 'Make')
                        const model = getCarAttr(car, 'Model')
                        const doors = getCarAttr(car, 'Doors')
                        const seats = getCarAttr(car, 'Seats')
                        const deposit = getCarAttr(car, 'DepositAmount')
                        return (
                          <tr key={i} className="hover:bg-gray-50">
                            <td className="px-2 py-1.5 font-mono font-semibold text-blue-700">{acriss || '—'}</td>
                            <td className="px-2 py-1.5 text-gray-700">{group || '—'}</td>
                            <td className="px-2 py-1.5 text-gray-700">{make || '—'}</td>
                            <td className="px-2 py-1.5 text-gray-700">{model || '—'}</td>
                            <td className="px-2 py-1.5 text-center text-gray-700">{doors || '—'}</td>
                            <td className="px-2 py-1.5 text-center text-gray-700">{seats || '—'}</td>
                            <td className="px-2 py-1.5 text-right text-gray-700">{deposit ? `€${deposit}` : '—'}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* ─── Actions ─── */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 sticky bottom-0 bg-white pb-1">
          <Button variant="secondary" onClick={onClose} type="button">
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
