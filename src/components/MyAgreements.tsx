import React, { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'
import { Badge } from './ui/Badge'
import { Button } from './ui/Button'
import { Loader } from './ui/Loader'
import { FileText, RefreshCw, Eye, Calendar, Building2 } from 'lucide-react'
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
      <Card className="transform transition-all duration-300 hover:shadow-xl border-2 border-gray-100">
        <CardHeader className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-gray-900">My Agreements</CardTitle>
                <p className="text-sm text-gray-600 mt-1">Manage your agreements with agents</p>
              </div>
            </div>
            <Button 
              size="sm" 
              variant="secondary" 
              onClick={() => refetch()}
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {/* Status Filter Tabs */}
          <div className="border-b-2 border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-2 overflow-x-auto pb-1">
              {['ALL', 'DRAFT', 'OFFERED', 'ACCEPTED', 'ACTIVE', 'SUSPENDED', 'EXPIRED', 'REJECTED'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`
                    whitespace-nowrap py-3 px-4 border-b-2 font-semibold text-sm flex items-center gap-2 rounded-t-lg transition-all duration-200
                    ${statusFilter === status
                      ? 'border-blue-600 text-blue-700 bg-blue-50 shadow-sm'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50 hover:border-gray-300'
                    }
                  `}
                >
                  {status}
                  {statusCounts[status] > 0 && (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      statusFilter === status 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-200 text-gray-700'
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
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Agreements Found</h3>
              <p className="text-sm text-gray-500 max-w-md mx-auto">
                {statusFilter === 'ALL' 
                  ? 'Create your first agreement to start working with agents and accepting bookings.' 
                  : `No agreements with status "${statusFilter}". Try selecting a different filter.`}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAgreements.map((agreement) => (
                <Card
                  key={agreement.id}
                  className="transform transition-all duration-300 hover:shadow-xl hover:scale-[1.01] cursor-pointer border-2 border-gray-100 hover:border-blue-200"
                  onClick={() => handleViewAgreement(agreement.id)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="p-2 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg">
                            <FileText className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-xl font-bold text-gray-900 mb-1">
                              {agreement.agreementRef}
                            </h4>
                            <Badge variant={getStatusColor(agreement.status) as any} size="md" className="font-semibold">
                              {agreement.status}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                          <div className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                            <div className="flex items-center gap-2 mb-1">
                              <Building2 className="w-4 h-4 text-blue-600" />
                              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Agent</span>
                            </div>
                            <p className="text-sm font-semibold text-gray-900">
                              {agreement.agent?.companyName || agreement.agentId || 'Unknown'}
                            </p>
                            {agreement.agent?.email && (
                              <p className="text-xs text-gray-500 mt-1">{agreement.agent.email}</p>
                            )}
                          </div>
                          
                          <div className="p-3 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-100">
                            <div className="flex items-center gap-2 mb-1">
                              <FileText className="w-4 h-4 text-purple-600" />
                              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Agreement ID</span>
                            </div>
                            <code className="text-xs font-mono text-gray-700 font-bold">
                              {agreement.id.slice(0, 16)}...
                            </code>
                          </div>
                          
                          <div className="p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-100">
                            <div className="flex items-center gap-2 mb-1">
                              <Calendar className="w-4 h-4 text-green-600" />
                              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Valid From</span>
                            </div>
                            <p className="text-sm font-semibold text-gray-900">
                              {agreement.validFrom 
                                ? new Date(agreement.validFrom).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                  })
                                : 'N/A'}
                            </p>
                          </div>
                          
                          <div className="p-3 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-lg border border-amber-100">
                            <div className="flex items-center gap-2 mb-1">
                              <Calendar className="w-4 h-4 text-amber-600" />
                              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Valid To</span>
                            </div>
                            <p className="text-sm font-semibold text-gray-900">
                              {agreement.validTo 
                                ? new Date(agreement.validTo).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                  })
                                : 'N/A'}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-200 flex items-center gap-4 text-xs text-gray-500">
                          <span>Created: {new Date(agreement.createdAt).toLocaleString()}</span>
                          {agreement.updatedAt !== agreement.createdAt && (
                            <span>Updated: {new Date(agreement.updatedAt).toLocaleString()}</span>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleViewAgreement(agreement.id)
                        }}
                        className="flex items-center gap-2 shadow-md hover:shadow-lg"
                      >
                        <Eye className="w-4 h-4" />
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
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

