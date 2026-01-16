import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useQueryClient } from '@tanstack/react-query'
import { X, Bell, Check } from 'lucide-react'
import api from '../lib/api'

// Simple cn utility
const cn = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(' ')
}

interface Notification {
  id: string
  type: 'agreement' | 'health' | 'company' | 'system'
  title: string
  message: string
  timestamp: string
  read: boolean
  actionUrl?: string
}

interface NotificationsDrawerProps {
  isOpen: boolean
  onClose: () => void
  endpoint: string
  markReadEndpoint: (id: string) => string
}

export const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({ 
  isOpen, 
  onClose,
  endpoint,
  markReadEndpoint
}) => {
  const queryClient = useQueryClient()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadNotifications()
    }
  }, [isOpen])

  const loadNotifications = async () => {
    setIsLoading(true)
    try {
      const response = await api.get(endpoint, {
        params: { limit: 50 }
      })
      
      const items = response.data?.items || response.data?.data?.items || response.data || []
      
      const formattedNotifications = items.map((notif: any) => ({
        id: notif.id || `notif-${Date.now()}-${Math.random()}`,
        type: notif.type || 'system',
        title: notif.title || 'Notification',
        message: notif.message || '',
        timestamp: notif.timestamp || notif.createdAt || new Date().toISOString(),
        read: notif.read !== undefined ? notif.read : !!notif.readAt,
        actionUrl: notif.actionUrl || notif.action_url,
      }))
      
      setNotifications(formattedNotifications)
    } catch (error: any) {
      console.error('Error loading notifications:', error)
      setNotifications([])
    } finally {
      setIsLoading(false)
    }
  }

  const markAsRead = async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    
    try {
      await api.post(markReadEndpoint(id))
      queryClient.invalidateQueries({ queryKey: ['notifications-count'] })
    } catch (error) {
      console.error('Error marking notification as read:', error)
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: false } : n))
    }
  }

  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id)
    try {
      await Promise.all(unreadIds.map(id => api.post(markReadEndpoint(id)).catch(() => {})))
      queryClient.invalidateQueries({ queryKey: ['notifications-count'] })
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }

  const unreadCount = notifications.filter(n => !n.read).length

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'agreement':
        return '📋'
      case 'health':
        return '⚠️'
      case 'company':
        return '🏢'
      case 'system':
        return '⚙️'
      default:
        return '🔔'
    }
  }

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined })
  }

  if (!isOpen) return null

  const drawerContent = (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onClose} />
      
      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-xl z-50 flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </h2>
            <button
              onClick={onClose}
              className="text-white hover:bg-emerald-700/50 rounded-lg p-1 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="mt-2 text-xs text-emerald-100 hover:text-white flex items-center gap-1 transition-colors"
            >
              <Check className="h-3 w-3" />
              Mark all as read
            </button>
          )}
        </div>

        {/* Notifications list */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
              <Bell className="h-12 w-12 text-gray-300 mb-4" />
              <p className="text-gray-500 font-medium">No notifications</p>
              <p className="text-sm text-gray-400 mt-1">You're all caught up!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => {
                    if (!notification.read) {
                      markAsRead(notification.id)
                    }
                    if (notification.actionUrl) {
                      const path = notification.actionUrl.startsWith('/') 
                        ? notification.actionUrl 
                        : `/${notification.actionUrl}`
                      // For source panel, use hash-based navigation
                      window.location.hash = path
                      onClose()
                    }
                  }}
                  className={cn(
                    'w-full px-6 py-4 text-left hover:bg-gray-50 transition-colors',
                    !notification.read && 'bg-emerald-50'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl flex-shrink-0">{getNotificationIcon(notification.type)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {notification.title}
                        </p>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-emerald-600 rounded-full flex-shrink-0 ml-2" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                      <p className="text-xs text-gray-500">{formatDate(notification.timestamp)}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )

  return createPortal(drawerContent, document.body)
}

