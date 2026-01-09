import React, { useState, useEffect, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, Edit, MapPin, X, Plus, Filter, Store, Building2, Globe } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { Select } from './ui/Select'
import { Badge } from './ui/Badge'
import { Loader } from './ui/Loader'
import { branchesApi, Branch } from '../api/branches'
import { BranchCreateModal } from './BranchCreateModal'
import toast from 'react-hot-toast'

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
  const limit = 25

  const queryClient = useQueryClient()

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
                      : 'Get started by importing branches from your endpoint or creating a new branch.'}
                  </p>
                  {!hasActiveFilters && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setIsCreateModalOpen(true)}
                      className="flex items-center gap-2 mx-auto"
                    >
                      <Plus className="w-4 h-4" />
                      Add Branch
                    </Button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Branch Code
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Location
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          UN/LOCODE
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {(branchesData?.items ?? []).map((branch) => (
                        <tr key={branch.id} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 cursor-pointer">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div className="p-1.5 bg-blue-100 rounded-lg">
                                <Store className="w-4 h-4 text-blue-600" />
                              </div>
                              <span className="text-sm font-bold text-gray-900 font-mono">
                                {branch.branchCode}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm font-semibold text-gray-900">{branch.name}</span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <MapPin className="w-4 h-4 text-gray-400" />
                              <span>
                                {branch.city && branch.country
                                  ? `${branch.city}, ${branch.country}`
                                  : '—'}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge
                              variant={
                                branch.status === 'ACTIVE'
                                  ? 'success'
                                  : branch.status === 'INACTIVE'
                                  ? 'danger'
                                  : 'secondary'
                              }
                              className="font-semibold"
                            >
                              {branch.status || '—'}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {branch.natoLocode ? (
                              <Badge variant="info" className="font-mono font-semibold">
                                <Globe className="w-3 h-3 mr-1" />
                                {branch.natoLocode}
                              </Badge>
                            ) : (
                              <Badge variant="warning" className="font-semibold">Unmapped</Badge>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
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
    </div>
  )
}

