import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Clock, CheckCircle, XCircle, Eye } from 'lucide-react'
import { Card } from './ui/Card'
import { Button } from './ui/Button'
import { Select } from './ui/Select'
import { Badge } from './ui/Badge'
import { Loader } from './ui/Loader'
import { Modal } from './ui/Modal'
import { locationRequestsApi, LocationRequest } from '../api/locationRequests'
import { formatDate } from '../lib/utils'

interface LocationRequestListProps {
  onView?: (request: LocationRequest) => void
}

export const LocationRequestList: React.FC<LocationRequestListProps> = ({ onView }) => {
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(0)
  const limit = 25
  const [selectedRequest, setSelectedRequest] = useState<LocationRequest | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

  const { data: requestsData, isLoading } = useQuery({
    queryKey: ['locationRequests', statusFilter, page],
    queryFn: () =>
      locationRequestsApi.listRequests({
        status: statusFilter || undefined,
        limit,
        offset: page * limit,
      }),
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Badge variant="success">Approved</Badge>
      case 'REJECTED':
        return <Badge variant="error">Rejected</Badge>
      case 'PENDING':
        return <Badge variant="warning">Pending</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'REJECTED':
        return <XCircle className="w-5 h-5 text-red-600" />
      case 'PENDING':
        return <Clock className="w-5 h-5 text-yellow-600" />
      default:
        return null
    }
  }

  return (
    <div className="space-y-4">
      {/* Filter */}
      <Card>
        <div className="p-4">
          <Select
            label="Filter by Status"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setPage(0)
            }}
            options={[
              { value: '', label: 'All statuses' },
              { value: 'PENDING', label: 'Pending' },
              { value: 'APPROVED', label: 'Approved' },
              { value: 'REJECTED', label: 'Rejected' },
            ]}
          />
        </div>
      </Card>

      {/* Requests List */}
      <Card>
        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            My Location Requests ({requestsData?.total ?? 0})
          </h3>
          {isLoading ? (
            <Loader className="min-h-48" />
          ) : (
            <>
              <div className="space-y-3">
                {(requestsData?.items ?? []).map((request) => (
                  <div
                    key={request.id}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {getStatusIcon(request.status)}
                          <h4 className="text-base font-semibold text-gray-900">
                            {request.locationName}
                          </h4>
                          {getStatusBadge(request.status)}
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div>
                            {request.city && request.country
                              ? `${request.city}, ${request.country}`
                              : request.country}
                          </div>
                          {request.iataCode && (
                            <div>IATA: {request.iataCode}</div>
                          )}
                          <div className="text-xs text-gray-500">
                            Requested: {formatDate(request.createdAt)}
                          </div>
                          {request.reviewedAt && (
                            <div className="text-xs text-gray-500">
                              Reviewed: {formatDate(request.reviewedAt)}
                            </div>
                          )}
                        </div>
                        {request.adminNotes && (
                          <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-700">
                            <strong>Admin Notes:</strong> {request.adminNotes}
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedRequest(request)
                          setIsDetailModalOpen(true)
                          onView?.(request)
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {requestsData && requestsData.total > limit && (
                <div className="mt-4 flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    Showing {page * limit + 1} to {Math.min((page + 1) * limit, requestsData.total)} of{' '}
                    {requestsData.total} requests
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
                      disabled={!requestsData.hasMore}
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

      {/* Detail Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false)
          setSelectedRequest(null)
        }}
        title="Location Request Details"
      >
        {selectedRequest && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Location Name</label>
                <div className="mt-1 text-sm text-gray-900">{selectedRequest.locationName}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Status</label>
                <div className="mt-1">{getStatusBadge(selectedRequest.status)}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Country</label>
                <div className="mt-1 text-sm text-gray-900">{selectedRequest.country}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">City</label>
                <div className="mt-1 text-sm text-gray-900">{selectedRequest.city || '—'}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">IATA Code</label>
                <div className="mt-1 text-sm text-gray-900">{selectedRequest.iataCode || '—'}</div>
              </div>
            </div>
            {selectedRequest.address && (
              <div>
                <label className="text-sm font-medium text-gray-500">Address</label>
                <div className="mt-1 text-sm text-gray-900">{selectedRequest.address}</div>
              </div>
            )}
            {selectedRequest.reason && (
              <div>
                <label className="text-sm font-medium text-gray-500">Reason</label>
                <div className="mt-1 text-sm text-gray-900">{selectedRequest.reason}</div>
              </div>
            )}
            {selectedRequest.adminNotes && (
              <div>
                <label className="text-sm font-medium text-gray-500">Admin Notes</label>
                <div className="mt-1 text-sm text-gray-900">{selectedRequest.adminNotes}</div>
              </div>
            )}
            <div className="pt-4 border-t">
              <div className="text-sm text-gray-500">
                Requested: {formatDate(selectedRequest.createdAt)}
              </div>
              {selectedRequest.reviewedAt && (
                <div className="text-sm text-gray-500">
                  Reviewed: {formatDate(selectedRequest.reviewedAt)}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

