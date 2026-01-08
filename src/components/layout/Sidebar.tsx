import React, { useState } from 'react'
import { 
  LayoutDashboard, 
  FileText, 
  MapPin, 
  Store, 
  HeartPulse, 
  CheckCircle, 
  Settings, 
  BookOpen,
  Menu,
  X,
  LogOut
} from 'lucide-react'

interface SidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
  user: any
  onLogout: () => void
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange, user, onLogout }) => {
  const [mobileOpen, setMobileOpen] = useState(false)

  const navItems = [
    { key: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { key: 'agreements', label: 'Agreements', icon: FileText },
    { key: 'locations', label: 'Locations', icon: MapPin },
    { key: 'branches', label: 'Branches', icon: Store },
    { key: 'location-requests', label: 'Location Requests', icon: MapPin },
    { key: 'health', label: 'Health', icon: HeartPulse },
    { key: 'verification', label: 'Verification', icon: CheckCircle },
    { key: 'settings', label: 'Settings', icon: Settings },
    { key: 'docs', label: 'Docs', icon: BookOpen },
  ]

  const handleTabChange = (key: string) => {
    onTabChange(key)
    setMobileOpen(false)
  }

  const userInitial = (user?.email || 'S')[0].toUpperCase()
  const companyName = user?.company?.companyName || 'Source'
  const userEmail = user?.email || ''

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-bold text-gray-900">Car Hire - Source</h1>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-64 bg-white border-r border-gray-200 shadow-sm
          transform transition-transform duration-300 ease-in-out
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          flex flex-col h-screen lg:h-auto
        `}
      >
        {/* Header */}
        <div className="flex items-center px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700">
          <h1 className="text-xl font-bold text-white">Car Hire - Source</h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.key

            if (item.key === 'docs') {
              // Get base path for production
              const basePath = import.meta.env.PROD ? '/source' : ''
              const docsPath = `${basePath}/docs-fullscreen`
              return (
                <a
                  key={item.key}
                  href={docsPath}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 text-gray-700 hover:bg-blue-50 hover:text-blue-700"
                >
                  <div className="flex items-center">
                    <Icon className="mr-3 h-5 w-5" />
                    <span>{item.label}</span>
                  </div>
                  <svg className="h-3 w-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              )
            }

            return (
              <button
                key={item.key}
                onClick={() => handleTabChange(item.key)}
                className={`
                  flex items-center w-full px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200
                  ${isActive
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                  }
                `}
              >
                <Icon className={`mr-3 h-5 w-5 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>

        {/* User section */}
        <div className="p-3 border-t border-gray-200">
          <div className="flex items-center gap-2 px-2 py-2 mb-2">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-xs font-semibold text-white shadow-md">
              {userInitial}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-gray-900 truncate">{companyName}</div>
              <div className="text-xs text-gray-500 truncate">{userEmail}</div>
            </div>
          </div>
          <button
            onClick={() => {
              onLogout()
              setMobileOpen(false)
            }}
            className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
          >
            <LogOut className="mr-3 h-4 w-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  )
}

