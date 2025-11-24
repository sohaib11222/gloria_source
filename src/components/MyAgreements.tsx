import React, { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'
import { Badge } from './ui/Badge'
import { Button } from './ui/Button'
import { Loader } from './ui/Loader'
import api from '../lib/api'
import { AgreementDetailModal } from './AgreementDetailModal'
import { getStatusColor } from '../lib/utils'
import toast from 'react-hot-toast'

interface Agreement {
  id: string
  agentId: string
  sourceId: string
  agreementRef: string
  status: 'DRAFT' | 'OFFERED' | 'ACCEPTED' | 'ACTIVE' | 'SUSPENDED' | 'EXPIRED' | 'REJECTED'
  validFrom: string
  validTo: string
  createdAt: string
  updatedAt: string
  agent?: {
    id: string
    companyName: string
    email: string
    status: string
  }
  source?: {
    id: string
    companyName: string
    email: string
    status: string
  }
}

interface MyAgreementsProps {
  user: any
}

export const MyAgreements: React.FC<MyAgreementsProps> = ({ user }) => {
  const [selectedAgreementId, setSelectedAgreementId] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('ALL')

  const { data: agreementsData, isLoading, refetch } = useQuery({
    queryKey: ['my-agreements', statusFilter],
    queryFn: async () => {
      const response = await api.get('/agreements', {
        params: {
          scope: 'source',
          ...(statusFilter !== 'ALL' ? { status: statusFilter } : {}),
        },
      })
      return response.data
    },
    enabled: !!user?.company?.id,
    refetchInterval: 30000, // Refetch every 30 seconds
  })

  const agreements: Agreement[] = (agreementsData?.items || []) as Agreement[]

  const handleViewAgreement = (agreementId: string) => {
    setSelectedAgreementId(agreementId)
    setIsModalOpen(true)
  }

  const getStatusCounts = () => {
    const counts: Record<string, number> = {
      ALL: agreements.length,
      DRAFT: 0,
      OFFERED: 0,
      ACCEPTED: 0,
      ACTIVE: 0,
      SUSPENDED: 0,
      EXPIRED: 0,
      REJECTED: 0,
    }
    agreements.forEach((ag) => {
      const status = ag.status || 'DRAFT'
      if (counts[status] !== undefined) {
        counts[status]++
      }
    })
    return counts
  }

  const statusCounts = getStatusCounts()

  const filteredAgreements = statusFilter === 'ALL' 
    ? agreements 
    : agreements.filter((ag) => ag.status === statusFilter)

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-12">
          <div className="flex justify-center">
            <Loader />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>My Agreements</CardTitle>
            <Button size="sm" variant="secondary" onClick={() => refetch()}>
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Status Filter Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8 overflow-x-auto">
              {['ALL', 'DRAFT', 'OFFERED', 'ACCEPTED', 'ACTIVE', 'SUSPENDED', 'EXPIRED', 'REJECTED'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`${
                    statusFilter === status
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
                >
                  {status}
                  {statusCounts[status] > 0 && (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      statusFilter === status 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {statusCounts[status]}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Agreements List */}
          {filteredAgreements.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">
                {statusFilter === 'ALL' 
                  ? 'No agreements found. Create your first agreement to get started.' 
                  : `No agreements with status "${statusFilter}"`}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAgreements.map((agreement) => (
                <div
                  key={agreement.id}
                  className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer"
                  onClick={() => handleViewAgreement(agreement.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="text-lg font-semibold text-gray-900">
                          {agreement.agreementRef}
                        </h4>
                        <Badge variant={getStatusColor(agreement.status) as any} size="sm">
                          {agreement.status}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mt-3">
                        <div>
                          <span className="text-gray-500">Agent:</span>
                          <span className="ml-2 font-medium text-gray-900">
                            {agreement.agent?.companyName || agreement.agentId || 'Unknown'}
                          </span>
                          {agreement.agent?.email && (
                            <span className="ml-2 text-gray-500 text-xs">
                              ({agreement.agent.email})
                            </span>
                          )}
                        </div>
                        <div>
                          <span className="text-gray-500">Agreement ID:</span>
                          <span className="ml-2 font-mono text-gray-700 text-xs">
                            {agreement.id.slice(0, 16)}...
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Valid From:</span>
                          <span className="ml-2 text-gray-900">
                            {agreement.validFrom 
                              ? new Date(agreement.validFrom).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                })
                              : 'N/A'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Valid To:</span>
                          <span className="ml-2 text-gray-900">
                            {agreement.validTo 
                              ? new Date(agreement.validTo).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                })
                              : 'N/A'}
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 text-xs text-gray-500">
                        <span>Created: {new Date(agreement.createdAt).toLocaleString()}</span>
                        {agreement.updatedAt !== agreement.createdAt && (
                          <span className="ml-4">
                            Updated: {new Date(agreement.updatedAt).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleViewAgreement(agreement.id)
                      }}
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Agreement Detail Modal */}
      <AgreementDetailModal
        agreementId={selectedAgreementId}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedAgreementId(null)
        }}
      />
    </div>
  )
}

