import React, { useState, useEffect, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, Edit, MapPin, X, Plus, Filter, Store, Building2, Globe, Upload, Settings } from 'lucide-react'
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

interface BranchListProps {
  onEdit?: (branch: Branch) => void
}

export const BranchList: React.FC<BranchListProps> = ({ onEdit }) => {
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
  const [isSavingEndpoint, setIsSavingEndpoint] = useState(false)
  const limit = 25

  const queryClient = useQueryClient()

  // Load endpoint configuration
  const { data: endpointConfig } = useQuery({
    queryKey: ['endpointConfig'],
    queryFn: () => endpointsApi.getConfig(),
  })

  // Set endpoint URL when config loads
  useEffect(() => {
    if (endpointConfig?.branchEndpointUrl) {
      setEndpointUrl(endpointConfig.branchEndpointUrl)
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
      const errorMessage = error.response?.data?.message || error.message || 'Failed to import branches from endpoint'
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
    // Refresh branches list
    queryClient.invalidateQueries({ queryKey: ['branches'] })
  }

  const handleSaveEndpointUrl = async () => {
    setIsSavingEndpoint(true)
    try {
      await endpointsApi.updateConfig({
        httpEndpoint: endpointConfig?.httpEndpoint || '',
        grpcEndpoint: endpointConfig?.grpcEndpoint || '',
        branchEndpointUrl: endpointUrl,
      })
      queryClient.invalidateQueries({ queryKey: ['endpointConfig'] })
      setIsEndpointConfigOpen(false)
      toast.success('Branch endpoint URL configured successfully')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save endpoint URL')
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
                        className="flex items-center gap-2"
                      >
                        <Upload className="w-4 h-4" />
                        Upload File
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Add Branch
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto rounded border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Branch Code
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Location
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          UN/LOCODE
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {(branchesData?.items ?? []).map((branch) => (
                        <tr key={branch.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <Store className="w-4 h-4 text-gray-400" />
                              <span className="text-sm font-medium text-gray-900 font-mono">
                                {branch.branchCode}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-gray-900">{branch.name}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <MapPin className="w-4 h-4 text-gray-400" />
                              <span>
                                {branch.city && branch.country
                                  ? `${branch.city}, ${branch.country}`
                                  : '—'}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <Badge
                              variant={
                                branch.status === 'ACTIVE'
                                  ? 'success'
                                  : branch.status === 'INACTIVE'
                                  ? 'danger'
                                  : 'secondary'
                              }
                            >
                              {branch.status || '—'}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {branch.natoLocode ? (
                              <Badge variant="info" className="font-mono">
                                {branch.natoLocode}
                              </Badge>
                            ) : (
                              <Badge variant="warning">Unmapped</Badge>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right">
                            {onEdit && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onEdit(branch)}
                                className="hover:bg-blue-100 hover:text-blue-700"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
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
              helperText="Enter the URL of your endpoint that returns branch data in OTA format or PHP var_dump format"
            />
          </div>
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Supported formats:</strong>
            </p>
            <ul className="text-xs text-blue-700 mt-2 list-disc list-inside space-y-1">
              <li>OTA XML format (OTA_VehLocSearchRS)</li>
              <li>PHP var_dump output format</li>
              <li>JSON format with Branches array</li>
            </ul>
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

