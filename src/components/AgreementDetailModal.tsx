import React, { useState, useEffect } from 'react'
import { Modal } from './ui/Modal'
import { Badge } from './ui/Badge'
import { Loader } from './ui/Loader'
import { agreementsApi, Agreement } from '../api/agreements'
import { getStatusColor } from '../lib/utils'
import toast from 'react-hot-toast'

interface AgreementDetailModalProps {
  agreementId: string | null
  isOpen: boolean
  onClose: () => void
}

interface AgreementDetail {
  id: string
  agentId?: string
  agent_id?: string
  sourceId?: string
  source_id?: string
  agreementRef?: string
  agreement_ref?: string
  status: string
  validFrom?: string
  valid_from?: string
  validTo?: string
  valid_to?: string
  createdAt?: string
  updatedAt?: string
  agent?: any
  source?: any
}

export const AgreementDetailModal: React.FC<AgreementDetailModalProps> = ({
  agreementId,
  isOpen,
  onClose,
}) => {
  const [agreement, setAgreement] = useState<AgreementDetail | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isOpen && agreementId) {
      loadAgreement()
    } else {
      setAgreement(null)
    }
  }, [isOpen, agreementId])

  const loadAgreement = async () => {
    if (!agreementId) return

    setIsLoading(true)
    try {
      const data = await agreementsApi.getAgreement(agreementId)
      setAgreement(data as any)
    } catch (error: any) {
      console.error('Failed to load agreement:', error)
      toast.error(error.response?.data?.message || 'Failed to load agreement details')
      onClose()
    } finally {
      setIsLoading(false)
    }
  }
  
  // Helper to get field value (handles both camelCase and snake_case)
  const getField = (obj: any, camelKey: string, snakeKey: string) => {
    return obj?.[camelKey] ?? obj?.[snakeKey] ?? ''
  }

  if (!isOpen) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Agreement Details" size="lg">
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader />
        </div>
      ) : agreement ? (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-gray-200">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {getField(agreement, 'agreementRef', 'agreement_ref')}
              </h3>
              <p className="text-sm text-gray-500 mt-1">Agreement ID: {agreement.id}</p>
            </div>
            <Badge variant={agreement.status === 'ACTIVE' ? 'success' : agreement.status === 'OFFERED' ? 'warning' : 'default'}>
              {agreement.status}
            </Badge>
          </div>

          {/* Agent Information */}
          {agreement.agent && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Agent Information</h4>
              <div className="space-y-1 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Company:</span>{' '}
                  <span className="text-gray-900">{agreement.agent.companyName}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Email:</span>{' '}
                  <span className="text-gray-900">{agreement.agent.email}</span>
                </div>
                {agreement.agent.companyCode && (
                  <div>
                    <span className="font-medium text-gray-700">Company Code:</span>{' '}
                    <span className="text-gray-900">{agreement.agent.companyCode}</span>
                  </div>
                )}
                <div>
                  <span className="font-medium text-gray-700">Status:</span>{' '}
                  <Badge variant={agreement.agent.status === 'ACTIVE' ? 'success' : 'default'} size="sm">
                    {agreement.agent.status}
                  </Badge>
                </div>
              </div>
            </div>
          )}

          {/* Source Information */}
          {agreement.source && (
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Source Information</h4>
              <div className="space-y-1 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Company:</span>{' '}
                  <span className="text-gray-900">{agreement.source.companyName}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Email:</span>{' '}
                  <span className="text-gray-900">{agreement.source.email}</span>
                </div>
                {agreement.source.companyCode && (
                  <div>
                    <span className="font-medium text-gray-700">Company Code:</span>{' '}
                    <span className="text-gray-900">{agreement.source.companyCode}</span>
                  </div>
                )}
                <div>
                  <span className="font-medium text-gray-700">Status:</span>{' '}
                  <Badge variant={agreement.source.status === 'ACTIVE' ? 'success' : 'default'} size="sm">
                    {agreement.source.status}
                  </Badge>
                </div>
              </div>
            </div>
          )}

          {/* Agreement Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm font-medium text-gray-500 mb-1">Valid From</div>
              <div className="text-base font-semibold text-gray-900">
                {new Date(getField(agreement, 'validFrom', 'valid_from')).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm font-medium text-gray-500 mb-1">Valid To</div>
              <div className="text-base font-semibold text-gray-900">
                {new Date(getField(agreement, 'validTo', 'valid_to')).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </div>
            </div>
          </div>

          {/* Dates */}
          {(agreement.createdAt || agreement.updatedAt) && (
            <div className="pt-4 border-t border-gray-200">
              <div className="grid grid-cols-2 gap-4 text-sm">
                {agreement.createdAt && (
                  <div>
                    <span className="font-medium text-gray-500">Created:</span>{' '}
                    <span className="text-gray-900">
                      {new Date(agreement.createdAt).toLocaleString()}
                    </span>
                  </div>
                )}
                {agreement.updatedAt && (
                  <div>
                    <span className="font-medium text-gray-500">Last Updated:</span>{' '}
                    <span className="text-gray-900">
                      {new Date(agreement.updatedAt).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <p>No agreement data available</p>
        </div>
      )}
    </Modal>
  )
}

