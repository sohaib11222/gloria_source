import React from 'react'
import { AlertCircle, XCircle, Info, AlertTriangle } from 'lucide-react'
import { cn } from '../../lib/utils'

interface ErrorDisplayProps {
  error: string | Error | any
  title?: string
  variant?: 'error' | 'warning' | 'info'
  className?: string
  onDismiss?: () => void
  showIcon?: boolean
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  title,
  variant = 'error',
  className,
  onDismiss,
  showIcon = true,
}) => {
  // Extract error message
  const getErrorMessage = (): string => {
    if (typeof error === 'string') return error
    if (error?.message) return error.message
    if (error?.response?.data?.message) return error.response.data.message
    if (error?.response?.data?.error) return error.response.data.error
    if (error?.data?.message) return error.data.message
    return 'An unexpected error occurred'
  }

  const message = getErrorMessage()

  const variantStyles = {
    error: {
      container: 'bg-red-50 border-red-200',
      text: 'text-red-800',
      title: 'text-red-900',
      icon: <XCircle className="h-5 w-5 text-red-600" />,
    },
    warning: {
      container: 'bg-yellow-50 border-yellow-200',
      text: 'text-yellow-800',
      title: 'text-yellow-900',
      icon: <AlertTriangle className="h-5 w-5 text-yellow-600" />,
    },
    info: {
      container: 'bg-blue-50 border-blue-200',
      text: 'text-blue-800',
      title: 'text-blue-900',
      icon: <Info className="h-5 w-5 text-blue-600" />,
    },
  }

  const styles = variantStyles[variant]

  return (
    <div
      className={cn(
        'rounded-lg border p-4',
        styles.container,
        className
      )}
      role="alert"
    >
      <div className="flex items-start">
        {showIcon && (
          <div className="flex-shrink-0 mr-3">{styles.icon}</div>
        )}
        <div className="flex-1 min-w-0">
          {title && (
            <h4 className={cn('font-semibold mb-1', styles.title)}>
              {title}
            </h4>
          )}
          <p className={cn('text-sm', styles.text)}>{message}</p>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className={cn(
              'flex-shrink-0 ml-3 rounded-md p-1 transition-colors',
              variant === 'error' && 'hover:bg-red-100',
              variant === 'warning' && 'hover:bg-yellow-100',
              variant === 'info' && 'hover:bg-blue-100'
            )}
            aria-label="Dismiss"
          >
            <XCircle className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}

