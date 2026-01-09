import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Clock, CheckCircle, XCircle, Eye, MapPin, Globe, Building2, Calendar, FileText, ChevronLeft, ChevronRight } from 'lucide-react'
import { Card, CardHeader, CardContent, CardTitle } from './ui/Card'
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

  const totalRequests = requestsData?.total ?? 0
  const hasRequests = totalRequests > 0

  return (
    <div className="space-y-6">
      {/* Filter Card */}
      <Card className="transform transition-all duration-300 hover:shadow-xl border-2 border-gray-100">
        <CardHeader className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
            </div>
            <CardTitle className="text-xl font-bold text-gray-900">Filter Requests</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
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
        </CardContent>
      </Card>

      {/* Requests List */}
      <Card className="transform transition-all duration-300 hover:shadow-xl border-2 border-gray-100">
        <CardHeader className="bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <MapPin className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-gray-900">
                  My Location Requests
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  {totalRequests === 0 
                    ? 'No requests yet' 
                    : `${totalRequests} request${totalRequests !== 1 ? 's' : ''} total`}
                </p>
              </div>
            </div>
            {hasRequests && (
              <Badge variant="info" size="md" className="text-base px-3 py-1">
                {totalRequests}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {isLoading ? (
            <Loader className="min-h-48" />
          ) : !hasRequests ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                <MapPin className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No location requests found</h3>
              <p className="text-sm text-gray-500 max-w-sm mx-auto">
                {statusFilter 
                  ? `No requests match the selected filter. Try selecting a different status.`
                  : `You haven't submitted any location requests yet. Use the form above to request a new location.`}
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {(requestsData?.items ?? []).map((request) => (
                  <div
                    key={request.id}
                    className="group p-5 border-2 border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-lg bg-white transition-all duration-200"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-3 mb-3">
                          <div className={`p-2 rounded-lg flex-shrink-0 ${
                            request.status === 'APPROVED' ? 'bg-green-100' :
                            request.status === 'REJECTED' ? 'bg-red-100' :
                            'bg-yellow-100'
                          }`}>
                            {getStatusIcon(request.status)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <h4 className="text-lg font-bold text-gray-900 truncate">
                                {request.locationName}
                              </h4>
                              {getStatusBadge(request.status)}
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center gap-4 text-sm text-gray-600 flex-wrap">
                                {request.city && request.country && (
                                  <div className="flex items-center gap-1.5">
                                    <Building2 className="w-4 h-4 text-gray-400" />
                                    <span className="font-medium">{request.city}, {request.country}</span>
                                  </div>
                                )}
                                {!request.city && request.country && (
                                  <div className="flex items-center gap-1.5">
                                    <Globe className="w-4 h-4 text-gray-400" />
                                    <span className="font-medium">{request.country}</span>
                                  </div>
                                )}
                                {request.iataCode && (
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">
                                      {request.iataCode}
                                    </span>
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
                                <div className="flex items-center gap-1.5">
                                  <Calendar className="w-3.5 h-3.5" />
                                  <span>Requested {formatDate(request.createdAt)}</span>
                                </div>
                                {request.reviewedAt && (
                                  <div className="flex items-center gap-1.5">
                                    <CheckCircle className="w-3.5 h-3.5" />
                                    <span>Reviewed {formatDate(request.reviewedAt)}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            {request.adminNotes && (
                              <div className="mt-3 p-3 bg-blue-50 border-l-4 border-blue-400 rounded-r-lg">
                                <div className="flex items-start gap-2">
                                  <FileText className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                                  <div>
                                    <div className="text-xs font-semibold text-blue-900 mb-1">Admin Notes</div>
                                    <div className="text-sm text-blue-800">{request.adminNotes}</div>
                                  </div>
                                </div>
                              </div>
                            )}
                            {request.reason && (
                              <div className="mt-3 text-sm text-gray-600">
                                <span className="font-medium">Reason:</span> {request.reason}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedRequest(request)
                          setIsDetailModalOpen(true)
                          onView?.(request)
                        }}
                        className="flex-shrink-0 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        <span className="hidden sm:inline">View</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {requestsData && requestsData.total > limit && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-sm text-gray-600">
                      Showing <span className="font-semibold text-gray-900">{page * limit + 1}</span> to{' '}
                      <span className="font-semibold text-gray-900">{Math.min((page + 1) * limit, requestsData.total)}</span> of{' '}
                      <span className="font-semibold text-gray-900">{requestsData.total}</span> requests
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setPage((p) => Math.max(0, p - 1))}
                        disabled={page === 0}
                        className="flex items-center gap-1"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Previous
                      </Button>
                      <div className="px-3 py-1 text-sm text-gray-600 bg-gray-50 rounded-lg">
                        Page {page + 1} of {Math.ceil(requestsData.total / limit)}
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setPage((p) => p + 1)}
                        disabled={!requestsData.hasMore}
                        className="flex items-center gap-1"
                      >
                        Next
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false)
          setSelectedRequest(null)
        }}
        title={
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              selectedRequest?.status === 'APPROVED' ? 'bg-green-100' :
              selectedRequest?.status === 'REJECTED' ? 'bg-red-100' :
              'bg-yellow-100'
            }`}>
              {selectedRequest && getStatusIcon(selectedRequest.status)}
            </div>
            <span>Location Request Details</span>
          </div>
        }
      >
        {selectedRequest && (
          <div className="space-y-6">
            {/* Status Header */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200">
              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Status</div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(selectedRequest.status)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Request ID</div>
                <div className="text-sm font-mono text-gray-700">{selectedRequest.id.slice(0, 8)}...</div>
              </div>
            </div>

            {/* Location Information */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Location Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Location Name</label>
                  <div className="mt-1 text-base font-semibold text-gray-900">{selectedRequest.locationName}</div>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Country</label>
                  <div className="mt-1 text-base font-semibold text-gray-900 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-gray-400" />
                    {selectedRequest.country}
                  </div>
                </div>
                {selectedRequest.city && (
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">City</label>
                    <div className="mt-1 text-base font-semibold text-gray-900 flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-gray-400" />
                      {selectedRequest.city}
                    </div>
                  </div>
                )}
                {selectedRequest.iataCode && (
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">IATA Code</label>
                    <div className="mt-1">
                      <span className="inline-flex items-center px-3 py-1 rounded-lg bg-white border border-gray-200 font-mono text-base font-semibold text-gray-900">
                        {selectedRequest.iataCode}
                      </span>
                    </div>
                  </div>
                )}
              </div>
              {selectedRequest.address && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">Address</label>
                  <div className="text-sm text-gray-900">{selectedRequest.address}</div>
                </div>
              )}
            </div>

            {/* Request Details */}
            {selectedRequest.reason && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Request Reason
                </h3>
                <div className="p-4 bg-amber-50 rounded-lg border-l-4 border-amber-400">
                  <div className="text-sm text-gray-800 leading-relaxed">{selectedRequest.reason}</div>
                </div>
              </div>
            )}

            {/* Admin Notes */}
            {selectedRequest.adminNotes && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Admin Notes
                </h3>
                <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                  <div className="text-sm text-gray-800 leading-relaxed">{selectedRequest.adminNotes}</div>
                </div>
              </div>
            )}

            {/* Timestamps */}
            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Timeline
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-600">Requested</span>
                  </div>
                  <span className="text-sm text-gray-900 font-medium">{formatDate(selectedRequest.createdAt)}</span>
                </div>
                {selectedRequest.reviewedAt && (
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-600">Reviewed</span>
                    </div>
                    <span className="text-sm text-gray-900 font-medium">{formatDate(selectedRequest.reviewedAt)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

