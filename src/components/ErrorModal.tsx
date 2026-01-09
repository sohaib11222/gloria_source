import React from 'react'
import { Modal } from './ui/Modal'
import { Button } from './ui/Button'
import { AlertCircle, XCircle, Info } from 'lucide-react'

interface ErrorModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  message: string
  error?: string
  onAction?: () => void
  actionLabel?: string
  type?: 'error' | 'warning' | 'info'
}

export const ErrorModal: React.FC<ErrorModalProps> = ({
  isOpen,
  onClose,
  title,
  message,
  error,
  onAction,
  actionLabel = 'OK',
  type = 'error',
}) => {
  const getTitle = () => {
    if (title) return title
    switch (type) {
      case 'warning':
        return 'Warning'
      case 'info':
        return 'Information'
      default:
        return 'Error'
    }
  }

  const getIcon = () => {
    switch (type) {
      case 'warning':
        return <AlertCircle className="h-6 w-6 text-yellow-600" />
      case 'info':
        return <Info className="h-6 w-6 text-blue-600" />
      default:
        return <XCircle className="h-6 w-6 text-red-600" />
    }
  }

  const getBgColor = () => {
    switch (type) {
      case 'warning':
        return 'bg-yellow-50 border-yellow-200'
      case 'info':
        return 'bg-blue-50 border-blue-200'
      default:
        return 'bg-red-50 border-red-200'
    }
  }

  const getTextColor = () => {
    switch (type) {
      case 'warning':
        return 'text-yellow-800'
      case 'info':
        return 'text-blue-800'
      default:
        return 'text-red-800'
    }
  }

  const getCodeColor = () => {
    switch (type) {
      case 'warning':
        return 'text-yellow-600 bg-yellow-100'
      case 'info':
        return 'text-blue-600 bg-blue-100'
      default:
        return 'text-red-600 bg-red-100'
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={getTitle()} size="md">
      <div className="space-y-4">
        <div className={`p-4 ${getBgColor()} border rounded-lg flex items-start gap-3`}>
          <div className="flex-shrink-0 mt-0.5">
            {getIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium ${getTextColor()}`}>{message}</p>
            {error && (
              <div className="mt-3 p-2 rounded-md bg-white/50">
                <p className={`text-xs font-mono ${getCodeColor()} p-2 rounded break-all`}>
                  {error}
                </p>
              </div>
            )}
          </div>
        </div>
        
        {message.includes('approved') || message.includes('APPROVED') || message.includes('approval') ? (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-2">
              <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900 mb-1">Account Approval Required</p>
                <p className="text-xs text-blue-800">
                  Your account needs to be approved by an administrator before you can perform this action. 
                  Please contact support or wait for admin approval.
                </p>
              </div>
            </div>
          </div>
        ) : null}
        
        <div className="flex justify-end gap-3 pt-2 border-t border-gray-200">
          {onAction && (
            <Button onClick={onAction} variant="primary" size="md">
              {actionLabel}
            </Button>
          )}
          <Button onClick={onClose} variant="secondary" size="md">
            Close
          </Button>
        </div>
      </div>
    </Modal>
  )
}


