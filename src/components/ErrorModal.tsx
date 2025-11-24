import React from 'react'
import { Modal } from './ui/Modal'
import { Button } from './ui/Button'

interface ErrorModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  message: string
  error?: string
  onAction?: () => void
  actionLabel?: string
}

export const ErrorModal: React.FC<ErrorModalProps> = ({
  isOpen,
  onClose,
  title = 'Error',
  message,
  error,
  onAction,
  actionLabel = 'OK',
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="md">
      <div className="space-y-4">
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{message}</p>
          {error && (
            <p className="text-xs text-red-600 mt-2 font-mono">{error}</p>
          )}
        </div>
        
        {message.includes('approved') || message.includes('APPROVED') ? (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-800">
              <strong>Note:</strong> Your account needs to be approved by an administrator before you can import branches. 
              Please contact support or wait for admin approval.
            </p>
          </div>
        ) : null}
        
        <div className="flex justify-end gap-3 pt-4">
          {onAction && (
            <Button onClick={onAction} variant="primary">
              {actionLabel}
            </Button>
          )}
          <Button onClick={onClose} variant="secondary">
            Close
          </Button>
        </div>
      </div>
    </Modal>
  )
}


