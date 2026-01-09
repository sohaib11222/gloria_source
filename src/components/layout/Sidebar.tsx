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
          w-64 bg-white border-r border-gray-200 shadow-lg
          transform transition-transform duration-300 ease-in-out
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          flex flex-col h-screen lg:h-auto
        `}
      >
        {/* Header */}
        <div className="flex items-center px-6 py-5 border-b border-blue-500/20 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Car Hire</h1>
              <p className="text-xs text-blue-100 font-medium">Source Portal</p>
            </div>
          </div>
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
                  className="flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:text-blue-700 hover:shadow-sm group"
                >
                  <div className="flex items-center">
                    <Icon className="mr-3 h-5 w-5 text-gray-500 group-hover:text-blue-600 transition-colors" />
                    <span>{item.label}</span>
                  </div>
                  <svg className="h-3 w-3 text-gray-400 group-hover:text-blue-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                  flex items-center w-full px-3 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 relative group
                  ${isActive
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 scale-[1.02]'
                    : 'text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:text-blue-700 hover:shadow-sm'
                  }
                `}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full"></div>
                )}
                <Icon className={`mr-3 h-5 w-5 transition-all ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-blue-600'}`} />
                <span className="relative z-10">{item.label}</span>
                {isActive && (
                  <div className="ml-auto">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                )}
              </button>
            )
          })}
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-gray-200 bg-gradient-to-br from-gray-50 to-white">
          <div className="flex items-center gap-3 px-3 py-3 mb-3 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 flex items-center justify-center text-sm font-bold text-white shadow-lg ring-2 ring-white">
              {userInitial}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-gray-900 truncate">{companyName}</div>
              <div className="text-xs text-gray-500 truncate">{userEmail}</div>
            </div>
          </div>
          <button
            onClick={() => {
              onLogout()
              setMobileOpen(false)
            }}
            className="flex items-center w-full px-3 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gradient-to-r hover:from-red-50 hover:to-rose-50 hover:text-red-600 rounded-xl transition-all duration-200 hover:shadow-sm"
          >
            <LogOut className="mr-3 h-4 w-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  )
}

