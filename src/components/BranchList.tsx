import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, Edit, MapPin, X } from 'lucide-react'
import { Card } from './ui/Card'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { Select } from './ui/Select'
import { Badge } from './ui/Badge'
import { Loader } from './ui/Loader'
import { branchesApi, Branch } from '../api/branches'
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
  const [page, setPage] = useState(0)
  const limit = 25

  const queryClient = useQueryClient()

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
    setPage(0)
  }

  const hasActiveFilters = Object.values(filters).some((v) => v !== '')

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="w-4 h-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Select
                label="Status"
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
            <div>
              <Select
                label="Location Type"
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
            <div>
              <Input
                label="Search"
                placeholder="Branch code, name, city..."
                value={filters.search}
                onChange={(e) => {
                  setFilters({ ...filters, search: e.target.value })
                  setPage(0)
                }}
                icon={<Search className="w-4 h-4" />}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Branches Table */}
      <Card>
        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Branches ({branchesData?.total ?? 0})
          </h3>
          {isLoading ? (
            <Loader className="min-h-48" />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Branch Code
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Location
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        UN/LOCODE
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(branchesData?.items ?? []).map((branch) => (
                      <tr key={branch.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {branch.branchCode}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{branch.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {branch.city && branch.country
                            ? `${branch.city}, ${branch.country}`
                            : '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge
                            variant={
                              branch.status === 'ACTIVE'
                                ? 'success'
                                : branch.status === 'INACTIVE'
                                ? 'error'
                                : 'secondary'
                            }
                          >
                            {branch.status || '—'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {branch.natoLocode ? (
                            <Badge variant="info">{branch.natoLocode}</Badge>
                          ) : (
                            <Badge variant="warning">Unmapped</Badge>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {onEdit && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onEdit(branch)}
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

              {/* Pagination */}
              {branchesData && branchesData.total > limit && (
                <div className="mt-4 flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    Showing {page * limit + 1} to {Math.min((page + 1) * limit, branchesData.total)} of{' '}
                    {branchesData.total} branches
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                      disabled={page === 0}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={!branchesData.hasMore}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </Card>
    </div>
  )
}

