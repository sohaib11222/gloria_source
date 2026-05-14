import React, { useState } from 'react'
import { 
  LayoutDashboard, 
  FileText, 
  MapPin, 
  Store, 
  DollarSign,
  CalendarDays,
  CalendarRange,
  Ban,
  Receipt,
  HeartPulse, 
  CheckCircle, 
  Settings, 
  BookOpen,
  Menu,
  X,
  LogOut,
  MessageCircle,
  Sparkles,
} from 'lucide-react'
import { User } from '../../types/api'
import logoImage from '../../assets/logo.jpg'

interface SidebarProps {
  activeTab: string
  /** When on Location & Branches, whether the manual branch tools sub-view is active (for highlighting nav). */
  branchImport?: 'endpoint' | 'manual'
  onTabChange: (tab: string) => void
  user: User
  onLogout: () => void
  /** Keeps the drawer visible on small screens while a spotlight tour runs */
  keepOpenForTour?: boolean
  onRequestPanelTour?: () => void
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  branchImport = 'endpoint',
  onTabChange,
  user,
  onLogout,
  keepOpenForTour,
  onRequestPanelTour,
}) => {
  const [mobileOpen, setMobileOpen] = useState(false)
  const showDrawer = mobileOpen || !!keepOpenForTour

  const navItems = [
    { key: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { key: 'agreements', label: 'Agreements', icon: FileText },
    { key: 'locations', label: 'Locations', icon: MapPin },
    { key: 'branches', label: 'Manual Branch import', icon: Store },
    { key: 'location-branches', label: 'Location & Branches', icon: Store },
    { key: 'pricing', label: 'Pricing', icon: DollarSign },
    { key: 'daily-pricing', label: 'Daily Prices', icon: CalendarDays },
    { key: 'transactions', label: 'Transactions', icon: Receipt },
    { key: 'reservations', label: 'Reservations', icon: CalendarRange },
    { key: 'cancellations', label: 'Cancellations', icon: Ban },
    { key: 'location-requests', label: 'Location Requests', icon: MapPin },
    { key: 'health', label: 'Health', icon: HeartPulse },
    { key: 'verification', label: 'Verification', icon: CheckCircle },
    { key: 'support', label: 'Support', icon: MessageCircle },
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
          <div className="flex items-center gap-2">
            <img 
              src={logoImage} 
              alt="Gloria Connect" 
              className="h-8 w-auto object-contain"
            />
            <h1 className="text-lg font-bold text-gray-900">Gloria Connect - Source</h1>
          </div>
          <div className="flex items-center gap-1">
            {onRequestPanelTour && (
              <button
                type="button"
                onClick={() => {
                  onRequestPanelTour()
                  setMobileOpen(true)
                }}
                className="p-2 text-gray-700 hover:bg-gray-100 rounded transition-colors"
                aria-label="Start panel tour"
                title="Panel tour"
              >
                <Sparkles className="h-5 w-5 text-blue-600" />
              </button>
            )}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 text-gray-700 hover:bg-gray-100 rounded transition-colors"
              aria-label="Toggle menu"
            >
              {showDrawer ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile overlay */}
      {showDrawer && !keepOpenForTour && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-64 bg-slate-800 border-r border-slate-700
          transform transition-transform duration-200
          ${showDrawer ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          flex flex-col h-screen lg:h-auto
        `}
      >
        {/* Header */}
        <div className="flex items-center px-6 py-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <img 
              src={logoImage} 
              alt="Gloria Connect" 
              className="h-10 w-auto object-contain"
            />
            <div>
              <h1 className="text-base font-semibold text-white">Gloria Connect</h1>
              <p className="text-xs text-slate-400">Source Portal</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive =
              item.key === 'branches'
                ? activeTab === 'location-branches' && branchImport === 'manual'
                : item.key === 'location-branches'
                  ? activeTab === 'location-branches' && branchImport !== 'manual'
                  : activeTab === item.key

            if (item.key === 'docs') {
              // Get base path for production
              const basePath = import.meta.env.PROD ? '/source' : ''
              const docsPath = `${basePath}/docs-fullscreen`
              return (
                <a
                  key={item.key}
                  data-tour="nav-docs"
                  href={docsPath}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-between px-3 py-2 text-sm font-medium rounded text-slate-300 hover:bg-slate-700 hover:text-white group"
                >
                  <div className="flex items-center">
                    <Icon className="mr-3 h-4 w-4 text-slate-400 group-hover:text-white transition-colors" />
                    <span>{item.label}</span>
                  </div>
                  <svg className="h-3 w-3 text-slate-500 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              )
            }

            return (
              <button
                key={item.key}
                type="button"
                data-tour={`nav-${item.key}`}
                onClick={() => handleTabChange(item.key)}
                className={`
                  flex items-center w-full px-3 py-2 text-sm font-medium rounded transition-colors
                  ${isActive
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                  }
                `}
              >
                <Icon className={`mr-3 h-4 w-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-slate-700 bg-slate-800">
          <div className="flex items-center gap-3 px-3 py-3 mb-3 bg-slate-700 rounded border border-slate-600">
            <div className="h-9 w-9 rounded-full bg-slate-600 flex items-center justify-center text-sm font-medium text-white">
              {userInitial}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate">{companyName}</div>
              <div className="text-xs text-slate-400 truncate">{userEmail}</div>
            </div>
          </div>
          <button
            onClick={() => {
              onLogout()
              setMobileOpen(false)
            }}
            className="flex items-center w-full px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700 hover:text-white rounded transition-colors"
          >
            <LogOut className="mr-3 h-4 w-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  )
}

