import React, { useState, useEffect, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, Edit, MapPin, X, Plus, Filter, Store, Building2, Globe, Upload, Settings, RefreshCw, Phone, Clock, ChevronDown, ChevronUp, Plane, Navigation, Info } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { Select } from './ui/Select'
import { Badge } from './ui/Badge'
import { Loader } from './ui/Loader'
import { branchesApi, Branch } from '../api/branches'
import { endpointsApi } from '../api/endpoints'
import { BranchCreateModal } from './BranchCreateModal'
import { BranchUploadModal } from './BranchUploadModal'
import { ValidationErrorsDisplay } from './ValidationErrorsDisplay'
import { Modal } from './ui/Modal'
import toast from 'react-hot-toast'
import { ImportBranchesResponse } from '../api/endpoints'
import { BranchQuotaExceededPayload } from '../api/subscription'

const PLAN_REQUIRED_TITLE = 'Select a plan to continue.'

function getOpeningHours(branch: Branch): Record<string, string> | null {
  const raw = branch.rawJson
  if (!raw) return null
  const opening = raw.Opening || raw.opening || raw.LocationDetail?.Opening
  if (!opening || typeof opening !== 'object') return null
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  const capsMap: Record<string, string> = {
    monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday', thursday: 'Thursday',
    friday: 'Friday', saturday: 'Saturday', sunday: 'Sunday',
  }
  const result: Record<string, string> = {}
  for (const day of days) {
    const d = opening[day] || opening[capsMap[day]]
    if (!d) continue
    if (typeof d === 'string') { result[day] = d.trim(); continue }
    const openTime = d?.attr?.Open || d?.['@_Open'] || d?.['@attributes']?.Open || d?.Open || ''
    const closeTime = d?.attr?.Closed || d?.attr?.Close || d?.['@_Closed'] || d?.['@attributes']?.Closed || d?.Closed || ''
    if (openTime && closeTime) {
      result[day] = `${String(openTime).trim()} - ${String(closeTime).trim()}`
    } else if (openTime) {
      result[day] = String(openTime).replace(/\n/g, '').trim()
    }
  }
  return Object.keys(result).length > 0 ? result : null
}

function getPickupInstructions(branch: Branch): string | null {
  const raw = branch.rawJson
  if (!raw) return null
  const pi = raw.PickupInstructions || raw.pickupInstructions || raw.LocationDetail?.PickupInstructions
  if (!pi) return null
  if (typeof pi === 'string') return pi
  return pi?.attr?.Pickup || pi?.['@_Pickup'] || pi?.['@attributes']?.Pickup || pi?.Pickup || null
}

function getAtAirport(branch: Branch): boolean | null {
  const raw = branch.rawJson
  if (!raw) return null
  const val = raw.AtAirport ?? raw.atAirport ?? raw.attr?.AtAirport ?? raw['@_AtAirport'] ?? raw['@attributes']?.AtAirport ?? raw.LocationDetail?.['@_AtAirport'] ?? null
  if (val === 'true' || val === true) return true
  if (val === 'false' || val === false) return false
  return null
}

const DAY_SHORT: Record<string, string> = {
  monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu',
  friday: 'Fri', saturday: 'Sat', sunday: 'Sun',
}

const BranchTable: React.FC<{
  branches: Branch[]
  onEdit?: (branch: Branch) => void
  subscriptionActive: boolean
}> = ({ branches, onEdit, subscriptionActive }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  return (
    <div className="overflow-x-auto rounded border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-8"></th>
            <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Code</th>
            <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Name</th>
            <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Country</th>
            <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">City</th>
            <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Phone</th>
            <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Type</th>
            <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
            <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">LOCODE</th>
            <th className="px-3 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider w-20">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {branches.map((branch) => {
            const isExpanded = expandedId === branch.id
            const atAirport = getAtAirport(branch)
            const hours = getOpeningHours(branch)
            const pickup = getPickupInstructions(branch)
            const hasDetails = hours || pickup || branch.latitude || branch.email || branch.addressLine

            return (
              <React.Fragment key={branch.id}>
                <tr
                  className={`hover:bg-gray-50 transition-colors cursor-pointer ${isExpanded ? 'bg-blue-50/50' : ''}`}
                  onClick={() => hasDetails && setExpandedId(isExpanded ? null : branch.id)}
                >
                  <td className="px-3 py-2.5 align-middle text-center">
                    {hasDetails && (
                      isExpanded
                        ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" />
                        : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                    )}
                  </td>
                  <td className="px-3 py-2.5 align-middle">
                    <span className="text-sm font-medium text-gray-900 font-mono">{branch.branchCode || '—'}</span>
                  </td>
                  <td className="px-3 py-2.5 align-middle">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm text-gray-900">{branch.name || '—'}</span>
                      {atAirport === true && (
                        <Plane className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" title="Airport location" />
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 align-middle">
                    {branch.countryCode ? (
                      <Badge variant="default" className="font-mono text-xs px-1.5 py-0.5">
                        {branch.countryCode}
                      </Badge>
                    ) : branch.country ? (
                      <span className="text-xs text-gray-600">{branch.country}</span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 align-middle">
                    <span className="text-sm text-gray-600">{branch.city || '—'}</span>
                  </td>
                  <td className="px-3 py-2.5 align-middle">
                    {branch.phone ? (
                      <span className="text-xs text-gray-600 whitespace-nowrap">{branch.phone}</span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 align-middle">
                    <div className="flex items-center gap-1">
                      {atAirport === true && (
                        <Badge variant="info" className="text-[10px] px-1 py-0">Airport</Badge>
                      )}
                      {branch.locationType && branch.locationType !== 'AIRPORT' && (
                        <span className="text-xs text-gray-600">{branch.locationType}</span>
                      )}
                      {!atAirport && !branch.locationType && <span className="text-gray-300">—</span>}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 align-middle">
                    <Badge
                      variant={
                        branch.status === 'ACTIVE' ? 'success' : branch.status === 'INACTIVE' ? 'danger' : 'default'
                      }
                    >
                      {branch.status || '—'}
                    </Badge>
                  </td>
                  <td className="px-3 py-2.5 align-middle">
                    {branch.natoLocode ? (
                      <Badge variant="info" className="font-mono text-xs">{branch.natoLocode}</Badge>
                    ) : (
                      <Badge variant="warning" className="text-xs">Unmapped</Badge>
                    )}
                  </td>
                  <td className="px-3 py-2.5 align-middle text-right">
                    {onEdit && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); onEdit(branch) }}
                        disabled={!subscriptionActive}
                        title={!subscriptionActive ? PLAN_REQUIRED_TITLE : 'Edit branch'}
                        className="hover:bg-blue-100 hover:text-blue-700"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    )}
                  </td>
                </tr>
                {isExpanded && (
                  <tr className="bg-blue-50/30">
                    <td colSpan={10} className="px-6 py-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                        {/* Address */}
                        {branch.addressLine && (
                          <div>
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase mb-1">
                              <MapPin className="w-3 h-3" /> Address
                            </div>
                            <p className="text-gray-700">{branch.addressLine}</p>
                            <p className="text-gray-600">
                              {[branch.city, branch.postalCode, branch.country || branch.countryCode].filter(Boolean).join(', ')}
                            </p>
                          </div>
                        )}

                        {/* Contact */}
                        {(branch.phone || branch.email) && (
                          <div>
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase mb-1">
                              <Phone className="w-3 h-3" /> Contact
                            </div>
                            {branch.phone && <p className="text-gray-700">{branch.phone}</p>}
                            {branch.email && <p className="text-gray-600">{branch.email}</p>}
                          </div>
                        )}

                        {/* Coordinates */}
                        {(branch.latitude || branch.longitude) && (
                          <div>
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase mb-1">
                              <Navigation className="w-3 h-3" /> Coordinates
                            </div>
                            <p className="text-gray-700 font-mono text-xs">
                              {branch.latitude?.toFixed(6)}, {branch.longitude?.toFixed(6)}
                            </p>
                          </div>
                        )}

                        {/* Opening Hours */}
                        {hours && (
                          <div className="md:col-span-2 lg:col-span-1">
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase mb-1">
                              <Clock className="w-3 h-3" /> Opening Hours
                            </div>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                              {Object.entries(hours).map(([day, time]) => (
                                <div key={day} className="flex justify-between text-xs">
                                  <span className="text-gray-500 font-medium">{DAY_SHORT[day] || day}</span>
                                  <span className="text-gray-700 ml-2">{time}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Pickup Instructions */}
                        {pickup && (
                          <div className="md:col-span-2 lg:col-span-3">
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase mb-1">
                              <Info className="w-3 h-3" /> Pickup Instructions
                            </div>
                            <p className="text-gray-700 text-xs leading-relaxed bg-white p-2 rounded border border-gray-200">
                              {pickup}
                            </p>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

interface BranchListProps {
  subscriptionActive?: boolean
  onEdit?: (branch: Branch) => void
  onQuotaExceeded?: (payload: BranchQuotaExceededPayload, retry: () => Promise<void>) => void
  hideHeader?: boolean // When true, hides the CardHeader with title and action buttons
}

export const BranchList: React.FC<BranchListProps> = ({ subscriptionActive = true, onEdit, onQuotaExceeded, hideHeader = false }) => {
  const [filters, setFilters] = useState({
    status: '',
    locationType: '',
    search: '',
  })
  const [searchInput, setSearchInput] = useState('')
  const [page, setPage] = useState(0)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [showImportResult, setShowImportResult] = useState(false)
  const [importResult, setImportResult] = useState<ImportBranchesResponse | null>(null)
  const [isEndpointConfigOpen, setIsEndpointConfigOpen] = useState(false)
  const [endpointUrl, setEndpointUrl] = useState('')
  const [branchEndpointFormat, setBranchEndpointFormat] = useState<string>('')
  const [branchDefaultCountryCode, setBranchDefaultCountryCode] = useState('')
  const [isSavingEndpoint, setIsSavingEndpoint] = useState(false)
  const [showStructureHelp, setShowStructureHelp] = useState(false)
  const limit = 25

  const queryClient = useQueryClient()

  // Load endpoint configuration
  const { data: endpointConfig } = useQuery({
    queryKey: ['endpointConfig'],
    queryFn: () => endpointsApi.getConfig(),
  })

  // Set endpoint config when it loads
  useEffect(() => {
    if (endpointConfig) {
      if (endpointConfig.branchEndpointUrl) setEndpointUrl(endpointConfig.branchEndpointUrl)
      setBranchEndpointFormat(endpointConfig.branchEndpointFormat || '')
      setBranchDefaultCountryCode(endpointConfig.branchDefaultCountryCode || '')
    }
  }, [endpointConfig])

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: searchInput }))
      setPage(0)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchInput])

  const { data: branchesData, isLoading } = useQuery({
    queryKey: ['branches', filters, page],
    queryFn: () =>
      branchesApi.listBranches({
        ...filters,
        limit,
        offset: page * limit,
      }),
  })

  const clearFilters = () => {
    setFilters({
      status: '',
      locationType: '',
      search: '',
    })
    setSearchInput('')
    setPage(0)
  }

  const hasActiveFilters = useMemo(() => {
    return Object.values(filters).some((v) => v !== '')
  }, [filters])

  const importBranchesMutation = useMutation({
    mutationFn: async () => {
      try {
        const response = await endpointsApi.importBranches()
        return response
      } catch (error: any) {
        // Handle 422 responses - backend now returns 200, but keep this for backwards compatibility
        if (error.response?.status === 422 && error.response?.data) {
          // Extract the response data - it contains summary and validationErrors
          const data = error.response.data
          console.warn('[BranchList] Received 422 response (should be 200 now):', data)
          return {
            ...data,
            summary: data.summary || {
              total: data.total || 0,
              valid: 0,
              invalid: data.summary?.invalid || (data.validationErrors?.length || 0),
              imported: data.summary?.imported || data.imported || 0,
              updated: data.summary?.updated || data.updated || 0,
              skipped: data.summary?.skipped || data.skipped || 0
            },
            validationErrors: data.validationErrors || data.invalidDetails || []
          }
        }
        // Re-throw other errors
        throw error
      }
    },
    onSuccess: (data) => {
      // Debug logging
      console.log('[BranchList] Import result:', data)
      
      // Get validation errors and invalid count from backend
      const invalidCount = data.summary?.invalid || data.validationErrors?.length || 0
      const validationErrors = data.validationErrors || data.invalidDetails || []
      
      console.log('[BranchList] Validation errors from backend:', {
        invalidCount,
        validationErrorsCount: validationErrors.length,
        validationErrors,
        summary: data.summary
      })
      
      // Normalize the data structure - include validation errors even if branches were imported
      const normalizedData = {
        ...data,
        validationErrors: validationErrors, // Always include validation errors if present
        summary: {
          total: data.summary?.total || data.total || 0,
          valid: data.summary?.valid || Math.max(0, (data.summary?.total || data.total || 0) - invalidCount),
          invalid: invalidCount, // Show actual invalid count from backend
          imported: data.summary?.imported || data.imported || 0,
          updated: data.summary?.updated || data.updated || 0,
          skipped: data.summary?.skipped || data.skipped || 0
        }
      }
      
      console.log('[BranchList] Normalized data:', normalizedData)
      
      // Invalidate and refetch branches
      queryClient.invalidateQueries({ queryKey: ['branches'] })
      
      // Store result and show modal
      setImportResult(normalizedData)
      setShowImportResult(true)
      
      // Show appropriate toast based on result - use normalized summary
      const summary = normalizedData.summary
      
      if (summary.imported + summary.updated > 0) {
        // Success (complete or partial)
        if (summary.skipped > 0) {
          toast.success(
            `Branches imported successfully! ${summary.imported} imported, ${summary.updated} updated, ${summary.skipped} skipped.`,
            { duration: 5000 }
          )
        } else {
          toast.success(
            `Branches imported successfully! ${summary.imported} imported, ${summary.updated} updated.`,
            { duration: 5000 }
          )
        }
      } else if (summary.skipped > 0) {
        // All skipped
        toast.warning(
          `Import completed but no branches were imported. ${summary.skipped} branch(es) were skipped.`,
          { duration: 7000 }
        )
      } else {
        // No branches found
        toast.error(
          `No branches found to import.`,
          { duration: 5000 }
        )
      }
    },
    onError: (error: any) => {
      console.error('Failed to import branches:', error)
      const status = error.response?.status
      const data = error.response?.data || {}
      if (status === 402 && data.error === 'BRANCH_QUOTA_EXCEEDED' && onQuotaExceeded) {
        onQuotaExceeded(data as BranchQuotaExceededPayload, () => importBranchesMutation.mutateAsync())
        return
      }
      const errorMessage = data.message || error.message || 'Failed to import branches from endpoint'
      toast.error(errorMessage)
    },
    onSettled: () => {
      setIsImporting(false)
    },
  })

  const handleImportBranches = async () => {
    setIsImporting(true)
    try {
      await importBranchesMutation.mutateAsync()
    } catch (error) {
      // Error handling is done in onError callback
    }
  }

  const handleUploadSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['branches'] })
  }

  const handleCreateBranchSuccess = async () => {
    queryClient.invalidateQueries({ queryKey: ['branches'] })
    if (endpointConfig?.branchEndpointUrl) {
      try {
        await importBranchesMutation.mutateAsync()
        toast.success('Branch added and synced from endpoint')
      } catch {
        toast.success('Branch added. Sync from endpoint failed or was skipped.')
      }
    }
  }

  const handleSaveEndpointUrl = async () => {
    setIsSavingEndpoint(true)
    try {
      await endpointsApi.updateConfig({
        httpEndpoint: endpointConfig?.httpEndpoint || '',
        grpcEndpoint: endpointConfig?.grpcEndpoint || '',
        branchEndpointUrl: endpointUrl,
        branchEndpointFormat: branchEndpointFormat || undefined,
        branchDefaultCountryCode: branchDefaultCountryCode.trim() || undefined,
      })
      queryClient.invalidateQueries({ queryKey: ['endpointConfig'] })
      setIsEndpointConfigOpen(false)
      toast.success('Branch endpoint configured successfully')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save endpoint configuration')
    } finally {
      setIsSavingEndpoint(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="transform transition-all duration-300 hover:shadow-xl border-2 border-gray-100">
        <CardHeader className="bg-gradient-to-r from-purple-50 via-pink-50 to-rose-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <Filter className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-gray-900">Filters</CardTitle>
                <p className="text-sm text-gray-600 mt-1">Filter branches by status, type, or search</p>
              </div>
            </div>
            {hasActiveFilters && (
              <>
                <Badge variant="info" className="font-bold">
                  {Object.values(filters).filter((v) => v !== '').length} active
                </Badge>
                <Button variant="ghost" size="sm" onClick={clearFilters} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
                  <X className="w-4 h-4" />
                  Clear All
                </Button>
              </>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
              <div className="flex items-center gap-2 mb-3">
                <Building2 className="w-4 h-4 text-blue-600" />
                <label className="text-sm font-bold text-gray-700">Status</label>
              </div>
              <Select
                value={filters.status}
                onChange={(e) => {
                  setFilters({ ...filters, status: e.target.value })
                  setPage(0)
                }}
                options={[
                  { value: '', label: 'All statuses' },
                  { value: 'ACTIVE', label: 'Active' },
                  { value: 'INACTIVE', label: 'Inactive' },
                ]}
              />
            </div>
            <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-100">
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="w-4 h-4 text-purple-600" />
                <label className="text-sm font-bold text-gray-700">Location Type</label>
              </div>
              <Select
                value={filters.locationType}
                onChange={(e) => {
                  setFilters({ ...filters, locationType: e.target.value })
                  setPage(0)
                }}
                options={[
                  { value: '', label: 'All types' },
                  { value: 'AIRPORT', label: 'Airport' },
                  { value: 'CITY', label: 'City' },
                  { value: 'RAILWAY', label: 'Railway' },
                ]}
              />
            </div>
            <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100">
              <div className="flex items-center gap-2 mb-3">
                <Search className="w-4 h-4 text-green-600" />
                <label className="text-sm font-bold text-gray-700">Search</label>
              </div>
              <div className="relative">
                <Input
                  placeholder="Branch code, name, city..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  helperText={searchInput && searchInput !== filters.search ? 'Searching...' : undefined}
                />
                <div className="absolute right-3 top-2.5 text-gray-400">
                  <Search className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Branches Table */}
      <Card className="transform transition-all duration-300 hover:shadow-xl border-2 border-gray-100">
        {!hideHeader && (
          <CardHeader className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <Store className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-gray-900">
                    Branches
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    {branchesData?.total ?? 0} branch{branchesData?.total !== 1 ? 'es' : ''} found
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsUploadModalOpen(true)}
                  className="flex items-center gap-2 shadow-md hover:shadow-lg"
                >
                  <Upload className="w-4 h-4" />
                  Upload File
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsEndpointConfigOpen(true)}
                  className="flex items-center gap-2 shadow-md hover:shadow-lg"
                  title="Configure branch import endpoint URL"
                >
                  <Settings className="w-4 h-4" />
                  Configure Endpoint
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleImportBranches}
                  loading={isImporting}
                  disabled={isImporting}
                  className="flex items-center gap-2 shadow-md hover:shadow-lg"
                  title={endpointConfig?.branchEndpointUrl ? `Import from ${endpointConfig.branchEndpointUrl}` : 'Import from configured endpoint'}
                >
                  <Upload className="w-4 h-4" />
                  Import from Endpoint
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleImportBranches}
                  loading={isImporting}
                  disabled={isImporting}
                  className="flex items-center gap-2 shadow-md hover:shadow-lg"
                  title="Sync branches from configured endpoint"
                >
                  <RefreshCw className={`w-4 h-4 ${isImporting ? 'animate-spin' : ''}`} />
                  Sync
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsCreateModalOpen(true)}
                  className="flex items-center gap-2 shadow-md hover:shadow-lg"
                >
                  <Plus className="w-4 h-4" />
                  Add Branch
                </Button>
              </div>
            </div>
          </CardHeader>
        )}
        <CardContent className="pt-6">
          {isLoading ? (
            <Loader className="min-h-48" />
          ) : (
            <>
              {(branchesData?.items ?? []).length === 0 ? (
                <div className="text-center py-16">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                    <Store className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No branches found</h3>
                  <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
                    {hasActiveFilters 
                      ? 'Try adjusting your filters to see more results.'
                      : 'Get started by uploading a JSON file, importing from your endpoint, or creating a new branch.'}
                  </p>
                  {!hasActiveFilters && (
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setIsUploadModalOpen(true)}
                        disabled={!subscriptionActive}
                        title={!subscriptionActive ? PLAN_REQUIRED_TITLE : undefined}
                        className="flex items-center gap-2"
                      >
                        <Upload className="w-4 h-4" />
                        Upload File
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setIsCreateModalOpen(true)}
                        disabled={!subscriptionActive}
                        title={!subscriptionActive ? PLAN_REQUIRED_TITLE : undefined}
                        className="flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Add Branch
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <BranchTable
                  branches={branchesData?.items ?? []}
                  onEdit={onEdit}
                  subscriptionActive={subscriptionActive}
                />
              )}

              {/* Pagination */}
              {branchesData && branchesData.total > limit && (
                <div className="mt-6 pt-6 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm font-medium text-gray-700">
                    Showing <span className="font-bold text-gray-900">{page * limit + 1}</span> to{' '}
                    <span className="font-bold text-gray-900">{Math.min((page + 1) * limit, branchesData.total)}</span> of{' '}
                    <span className="font-bold text-gray-900">{branchesData.total}</span> branches
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                      disabled={page === 0}
                      className="shadow-sm hover:shadow-md"
                    >
                      Previous
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={!branchesData.hasMore}
                      className="shadow-sm hover:shadow-md"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Create Branch Modal */}
      <BranchCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateBranchSuccess}
      />

      {/* Upload Branches Modal */}
      <BranchUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={handleUploadSuccess}
      />

      {/* Import Results Modal */}
      <Modal
        isOpen={showImportResult && importResult !== null}
        onClose={() => {
          setShowImportResult(false)
          setImportResult(null)
        }}
        title="Import Results"
        size="xl"
      >
        {importResult && (
          <div className="max-h-[85vh] overflow-y-auto -mx-6 -mt-6 px-6 pt-6">
            <ValidationErrorsDisplay
              summary={importResult.summary || {
                total: importResult.total || 0,
                valid: importResult.summary?.valid || Math.max(0, (importResult.total || 0) - (importResult.summary?.invalid || importResult.validationErrors?.length || 0)),
                invalid: importResult.summary?.invalid || importResult.validationErrors?.length || 0,
                imported: importResult.summary?.imported || importResult.imported || 0,
                updated: importResult.summary?.updated || importResult.updated || 0,
                skipped: importResult.summary?.skipped || importResult.skipped || 0,
              }}
              validationErrors={importResult.validationErrors || importResult.invalidDetails || []}
              message={importResult.message || 'Import completed'}
            />
          </div>
        )}
      </Modal>

      {/* Endpoint Configuration Modal */}
      <Modal
        isOpen={isEndpointConfigOpen}
        onClose={() => setIsEndpointConfigOpen(false)}
        title="Configure Branch Import Endpoint"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Branch Endpoint URL
            </label>
            <Input
              value={endpointUrl}
              onChange={(e) => setEndpointUrl(e.target.value)}
              placeholder="https://example.com/loctest.php"
              helperText="URL that returns branch data (XML, JSON, PHP, CSV, or Excel)"
            />
          </div>
          <div>
            <Select
              label="Response / file format"
              value={branchEndpointFormat}
              onChange={(e) => setBranchEndpointFormat(e.target.value)}
              options={[
                { value: '', label: 'Auto-detect' },
                { value: 'XML', label: 'OTA XML (OTA_VehLocSearchRS)' },
                { value: 'JSON', label: 'JSON (Branches array or OTA)' },
                { value: 'PHP', label: 'PHP var_dump' },
                { value: 'CSV', label: 'CSV' },
                { value: 'EXCEL', label: 'Excel (.xlsx / .xls)' },
              ]}
              helperText="Set when your endpoint or file type is known"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Default country code
            </label>
            <Input
              value={branchDefaultCountryCode}
              onChange={(e) => setBranchDefaultCountryCode(e.target.value.toUpperCase().slice(0, 3))}
              placeholder="e.g. AE, US"
              maxLength={3}
              helperText="ISO 2–3 letter code used to map branches to a country when not in the data"
            />
          </div>
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Supported formats:</strong> OTA XML, PHP var_dump, JSON, CSV, Excel (.xlsx/.xls)
            </p>
          </div>
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <button
              type="button"
              className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 text-left text-sm font-medium text-gray-700 hover:bg-gray-100"
              onClick={() => setShowStructureHelp(!showStructureHelp)}
            >
              <span>Expected structure / column mapping</span>
              <span className="text-gray-500">{showStructureHelp ? '▼' : '▶'}</span>
            </button>
            {showStructureHelp && (
              <div className="p-4 bg-white border-t border-gray-200 text-sm text-gray-600 space-y-3">
                <p><strong>CSV / Excel columns</strong> (case-insensitive; first row = headers):</p>
                <ul className="list-disc list-inside space-y-1">
                  <li><code>Branchcode</code> or <code>Code</code> – branch identifier</li>
                  <li><code>Name</code> – branch name</li>
                  <li><code>CountryCode</code>, <code>Country</code> – country (or use default above)</li>
                  <li><code>City</code>, <code>AddressLine</code>, <code>PostalCode</code></li>
                  <li><code>Latitude</code>, <code>Longitude</code></li>
                  <li><code>AtAirport</code> (true/false), <code>LocationType</code>, <code>CollectionType</code></li>
                  <li><code>Phone</code>, <code>Email</code></li>
                </ul>
                <p><strong>JSON</strong>: <code>Branches</code> array or OTA <code>OTA_VehLocSearchRS</code> / <code>gloria</code>.</p>
                <p><strong>XML / PHP</strong>: OTA VehLocSearchRS structure (VehMatchedLocs / LocationDetail).</p>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              variant="secondary"
              onClick={() => setIsEndpointConfigOpen(false)}
              type="button"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSaveEndpointUrl}
              loading={isSavingEndpoint}
              disabled={!endpointUrl.trim()}
            >
              Save
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

