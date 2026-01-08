import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { agreementsApi, Agent, CreateAgreementRequest } from '../api/agreements'
import { endpointsApi, EndpointConfig, Location, SourceGrpcTestResponse } from '../api/endpoints'
import { Button } from '../components/ui/Button'
import { SourceInformation } from '../components/SourceInformation'
import { EndpointConfiguration } from '../components/EndpointConfiguration'
import { GrpcConnectionTest } from '../components/GrpcConnectionTest'
import { AvailableLocations } from '../components/AvailableLocations'
import { PendingVerification } from '../components/PendingVerification'
import { GrpcTestRequired } from '../components/GrpcTestRequired'
import { CreateAgreementForm } from '../components/CreateAgreementForm'
import { AvailableAgents } from '../components/AvailableAgents'
import { BranchList } from '../components/BranchList'
import { BranchEditModal } from '../components/BranchEditModal'
import { LocationRequestForm } from '../components/LocationRequestForm'
import { LocationRequestList } from '../components/LocationRequestList'
import { AddLocationForm } from '../components/AddLocationForm'
import { AgreementDetailModal } from '../components/AgreementDetailModal'
import { MyAgreements } from '../components/MyAgreements'
import { SettingsPage } from './SettingsPage'
import { ErrorModal } from '../components/ErrorModal'
import { Sidebar } from '../components/layout/Sidebar'
import toast from 'react-hot-toast'
import api from '../lib/api'
import { Branch } from '../api/branches'
import { verificationApi, VerificationResult } from '../api/verification'

export default function SourcePage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [user, setUser] = useState<any>(null)
  
  // Get active tab from URL or default to dashboard
  const tabFromUrl = searchParams.get('tab') as 'dashboard' | 'agreements' | 'locations' | 'branches' | 'location-requests' | 'health' | 'verification' | 'docs' | 'settings' | null
  const [activeTab, setActiveTab] = useState<'dashboard' | 'agreements' | 'locations' | 'branches' | 'location-requests' | 'health' | 'verification' | 'docs' | 'settings'>(
    tabFromUrl || 'dashboard'
  )
  
  // Agreement detail modal state
  const [selectedAgreementId, setSelectedAgreementId] = useState<string | null>(null)
  const [isAgreementModalOpen, setIsAgreementModalOpen] = useState(false)
  
  // Error modal state
  const [errorModal, setErrorModal] = useState<{
    isOpen: boolean
    title?: string
    message: string
    error?: string
  }>({
    isOpen: false,
    message: '',
  })
  
  // Locations state (defined early for use in loadSyncedLocations)
  const [locations, setLocations] = useState<Location[]>([])
  const [isLoadingLocations, setIsLoadingLocations] = useState(false)
  const [showLocations, setShowLocations] = useState(false)
  
  // Selected agreement for filtering locations (defined early for use in loadLocations)
  const [selectedAgreementFilterId, setSelectedAgreementFilterId] = useState<string>('')
  
  // Function to load synced locations from backend (defined early so it can be used in handlers)
  const loadSyncedLocations = useCallback(async () => {
    if (!user?.company?.id) return
    
    setIsLoadingLocations(true)
    try {
      const response = await endpointsApi.getSyncedLocations(user.company.id)
      if (response.items && response.items.length > 0) {
        setLocations(response.items)
        setShowLocations(true)
      } else {
        // If no synced locations, clear the list but don't show error
        setLocations([])
        setShowLocations(false)
      }
    } catch (error: any) {
      console.error('Failed to load synced locations:', error)
      // Don't show error toast on auto-load, only on manual sync
      // Just log to console for debugging
    } finally {
      setIsLoadingLocations(false)
    }
  }, [user?.company?.id])

  // Function to load locations (defined early so it can be used in useEffect)
  const loadLocations = useCallback(async (showToast = true) => {
    setIsLoadingLocations(true)
    try {
      if (selectedAgreementFilterId) {
        // Load locations for specific agreement
        const response = await endpointsApi.getLocationsByAgreement(selectedAgreementFilterId)
        const items = (response as any)?.items ?? (response as any) ?? []
        setLocations(items)
      } else {
        // Load synced locations (source coverage) when no agreement filter
        if (user?.company?.id) {
          const response = await endpointsApi.getSyncedLocations(user.company.id)
          setLocations(response.items || [])
        } else {
          const response = await endpointsApi.getLocations()
          setLocations(response.items)
        }
      }
      setShowLocations(true)
      if (showToast) {
        toast.success('Locations loaded successfully!')
      }
    } catch (error: any) {
      console.error('Failed to load locations:', error)
      
      if (showToast) {
        const errorData = error.response?.data || {}
        const errorCode = errorData.error
        const errorMessage = errorData.message || error.message
        
        // Show user-friendly error messages
        if (errorCode === 'DATABASE_AUTH_ERROR' || errorCode === 'DATABASE_CONFIG_ERROR') {
          toast.error('Server configuration error. Please contact the administrator.')
        } else if (error.response?.status >= 500) {
          toast.error('Server error. Please try again later or contact support.')
        } else {
          toast.error(errorMessage || 'Failed to load locations. Please try again.')
        }
      }
    } finally {
      setIsLoadingLocations(false)
    }
  }, [selectedAgreementFilterId, user?.company?.id])
  
  // Sync URL when tab changes
  const handleTabChange = (tab: 'dashboard' | 'agreements' | 'locations' | 'branches' | 'location-requests' | 'health' | 'verification' | 'docs' | 'settings') => {
    setActiveTab(tab)
    setSearchParams({ tab })
    // When switching to locations tab, refresh the locations data
    if (tab === 'locations' && user?.company?.id) {
      // Small delay to ensure state is updated
      setTimeout(() => {
        loadSyncedLocations()
      }, 100)
    }
  }
  
  const handleViewAgreement = (agreementId: string) => {
    setSelectedAgreementId(agreementId)
    setIsAgreementModalOpen(true)
  }
  
  // Sync tab when URL changes (back/forward button)
  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab && ['dashboard', 'agreements', 'locations', 'branches', 'location-requests', 'health', 'verification', 'docs', 'settings'].includes(tab)) {
      setActiveTab(tab as any)
    } else if (!tab) {
      // If no tab in URL, set to dashboard and update URL
      setSearchParams({ tab: 'dashboard' }, { replace: true })
    }
  }, [searchParams, setSearchParams])

  // Track if we've already auto-loaded locations for this tab session
  const hasAutoLoadedRef = useRef(false)
  
  // Auto-load locations when locations tab is opened (first visit or tab switch)
  // This ensures locations are automatically loaded when visiting the locations tab
  useEffect(() => {
    // Reset the ref when switching away from locations tab
    if (activeTab !== 'locations') {
      hasAutoLoadedRef.current = false
      return
    }
    
    // Only auto-load once when the locations tab becomes active
    if (activeTab === 'locations' && user?.company?.id && !isLoadingLocations && !hasAutoLoadedRef.current) {
      hasAutoLoadedRef.current = true
      // Auto-load locations on first visit to locations tab
      // This will show the locations immediately without requiring a button click
      if (!showLocations && locations.length === 0) {
        loadLocations(false) // Don't show toast on auto-load
      }
      // Also load synced locations for the sync functionality (but only once)
      loadSyncedLocations()
    }
  }, [activeTab, user?.company?.id])
  const [agents, setAgents] = useState<Agent[]>([])
  const [isLoadingAgents, setIsLoadingAgents] = useState(false)
  const [isCreatingAgreement, setIsCreatingAgreement] = useState(false)
  const [isOfferingAgreement, setIsOfferingAgreement] = useState<string | null>(null)
  
  // Endpoint configuration state
  const [endpointConfig, setEndpointConfig] = useState<EndpointConfig | null>(null)
  const [isLoadingEndpoints, setIsLoadingEndpoints] = useState(false)
  const [isEditingEndpoints, setIsEditingEndpoints] = useState(false)
  const [isUpdatingEndpoints, setIsUpdatingEndpoints] = useState(false)
  const [httpEndpoint, setHttpEndpoint] = useState('')
  const [grpcEndpoint, setGrpcEndpoint] = useState('')
  
  // Note: selectedAgreementFilterId is defined earlier (line 59) for use in loadLocations
  const [isSyncingLocations, setIsSyncingLocations] = useState(false)
  const [isImportingBranches, setIsImportingBranches] = useState(false)
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null)
  
  // Branches state
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null)
  const [isEditBranchModalOpen, setIsEditBranchModalOpen] = useState(false)
  
  // gRPC Test state
  const [grpcTestResult, setGrpcTestResult] = useState<SourceGrpcTestResponse | null>(null)
  const [isTestingGrpc, setIsTestingGrpc] = useState(false)

  // Health state
  const [healthLoading, setHealthLoading] = useState(false)
  const [health, setHealth] = useState<any | null>(null)

  // Verification re-run state
  const [verificationStatus, setVerificationStatus] = useState<'IDLE' | 'PENDING' | 'RUNNING' | 'PASSED' | 'FAILED'>('IDLE')
  const [verificationLoading, setVerificationLoading] = useState(false)
  const [verificationResult, setVerificationResult] = useState<any>(null)
  const [verificationHistory, setVerificationHistory] = useState<any[]>([])
  
  // Form state for creating agreement
  const [selectedAgentId, setSelectedAgentId] = useState('')
  const [agreementRef, setAgreementRef] = useState('')
  const [validFrom, setValidFrom] = useState('')
  const [validTo, setValidTo] = useState('')

  useEffect(() => {
    // Load user data from localStorage
    const userData = localStorage.getItem('user')
    if (userData) {
      const parsedUser = JSON.parse(userData)
      setUser(parsedUser)
      
      // Load persisted gRPC test result
      const savedGrpcTest = localStorage.getItem(`grpcTestResult_${parsedUser.company.id}`)
      if (savedGrpcTest) {
        try {
          const parsed = JSON.parse(savedGrpcTest)
          // Check if the test result is still valid (same endpoint)
          const savedEndpoint = localStorage.getItem(`grpcEndpoint_${parsedUser.company.id}`)
          if (savedEndpoint && parsed.addr === savedEndpoint) {
            setGrpcTestResult(parsed)
          }
        } catch (e) {
          console.error('Failed to parse saved gRPC test result:', e)
        }
      }
      
      // Load persisted last sync time
      const savedSyncTime = localStorage.getItem(`lastSyncTime_${parsedUser.company.id}`)
      if (savedSyncTime) {
        setLastSyncTime(savedSyncTime)
      }
      
      // Only load agents and endpoints if company status is ACTIVE
      if (parsedUser.company.status === 'ACTIVE') {
        loadAgents()
        loadEndpointConfig()
        // Preload health
        loadHealth()
        // Load verification status
        loadVerificationStatus()
      }
    }
  }, [])

  const loadVerificationStatus = async () => {
    try {
      const result = await verificationApi.getStatus()
      if (result) {
        setVerificationResult(result)
        setVerificationStatus(result.passed ? 'PASSED' : 'FAILED')
        // For now, we only have the latest result
        // In the future, we can add an endpoint to get history
        setVerificationHistory([result])
      }
    } catch (error) {
      console.error('Failed to load verification status:', error)
    }
  }

  const loadAgents = async () => {
    try {
      setIsLoadingAgents(true)
      const response = await agreementsApi.getAllAgents()
      setAgents(response.items)
    } catch (error: any) {
      console.error('Failed to load agents:', error)
      
      const errorData = error.response?.data || {}
      const errorCode = errorData.error
      const errorMessage = errorData.message || error.message
      
      // Show user-friendly error messages
      if (errorCode === 'DATABASE_AUTH_ERROR' || errorCode === 'DATABASE_CONFIG_ERROR') {
        toast.error('Server configuration error. Please contact the administrator.')
      } else if (error.response?.status === 404) {
        toast.error('Agreements endpoint not found. Please check your backend configuration.')
      } else if (error.response?.status >= 500) {
        toast.error('Server error. Please try again later or contact support.')
      } else {
        toast.error(errorMessage || 'Failed to load agents. Please try again.')
      }
    } finally {
      setIsLoadingAgents(false)
    }
  }

  const loadEndpointConfig = async () => {
    try {
      setIsLoadingEndpoints(true)
      const response = await endpointsApi.getConfig()
      setEndpointConfig(response)
      setHttpEndpoint(response.httpEndpoint)
      setGrpcEndpoint(response.grpcEndpoint)
      
      // Save endpoint to localStorage for validation
      if (user?.company?.id) {
        localStorage.setItem(`grpcEndpoint_${user.company.id}`, response.grpcEndpoint || '')
      }
      
      // Check if we have a saved test result for this endpoint
      if (user?.company?.id && response.grpcEndpoint) {
        const savedGrpcTest = localStorage.getItem(`grpcTestResult_${user.company.id}`)
        if (savedGrpcTest) {
          try {
            const parsed = JSON.parse(savedGrpcTest)
            // Only use saved result if endpoint matches
            if (parsed.addr === response.grpcEndpoint) {
              setGrpcTestResult(parsed)
            } else {
              // Endpoint changed, clear old test result
              setGrpcTestResult(null)
              localStorage.removeItem(`grpcTestResult_${user.company.id}`)
            }
          } catch (e) {
            console.error('Failed to parse saved gRPC test result:', e)
          }
        }
      } else if (user?.company?.id && !response.grpcEndpoint) {
        // No endpoint configured, clear test result
        setGrpcTestResult(null)
        localStorage.removeItem(`grpcTestResult_${user.company.id}`)
      }
      
      // Load persisted gRPC test result from database
      if (response.lastGrpcTestResult && response.lastGrpcTestAt) {
        setGrpcTestResult(response.lastGrpcTestResult)
      }
      
      // Load persisted last sync time from database and load synced locations
      if (response.lastLocationSyncAt) {
        setLastSyncTime(response.lastLocationSyncAt)
        // If we have a sync timestamp, load the synced locations
        if (user?.company?.id) {
          try {
            const locationsResponse = await endpointsApi.getSyncedLocations(user.company.id)
            if (locationsResponse.items && locationsResponse.items.length > 0) {
              setLocations(locationsResponse.items)
              setShowLocations(true)
            }
          } catch (error) {
            // Silently fail - locations might not be synced yet
            console.log('No synced locations found yet')
          }
        }
      }
    } catch (error: any) {
      console.error('Failed to load endpoint configuration:', error)
      
      const errorData = error.response?.data || {}
      const errorCode = errorData.error
      const errorMessage = errorData.message || error.message
      
      // Show user-friendly error messages
      if (errorCode === 'DATABASE_AUTH_ERROR' || errorCode === 'DATABASE_CONFIG_ERROR') {
        toast.error('Server configuration error. Please contact the administrator.')
      } else if (error.response?.status >= 500) {
        toast.error('Server error. Please try again later or contact support.')
      } else {
        toast.error(errorMessage || 'Failed to load endpoint configuration. Please try again.')
      }
    } finally {
      setIsLoadingEndpoints(false)
    }
  }

  const loadHealth = async () => {
    try {
      setHealthLoading(true)
      const res = await api.get('/health/my-source')
      setHealth(res.data)
    } catch (e: any) {
      console.error('Failed to load health data:', e)
      // Set default health data if request fails
      setHealth({
        sourceId: user?.company?.id || '',
        healthy: true,
        slowRate: 0,
        sampleCount: 0,
        backoffLevel: 0,
        excludedUntil: null,
        updatedAt: null,
      })
    } finally {
      setHealthLoading(false)
    }
  }

  const updateEndpointConfig = async () => {
    if (!httpEndpoint || !grpcEndpoint) {
      toast.error('Please fill in all endpoint fields')
      return
    }

    setIsUpdatingEndpoints(true)
    try {
      const response = await endpointsApi.updateConfig({
        httpEndpoint,
        grpcEndpoint,
      })
      toast.success(response.message || 'Endpoint configuration updated successfully!')
      setIsEditingEndpoints(false)
      // Reload endpoint configuration
      await loadEndpointConfig()
    } catch (error: any) {
      console.error('Failed to update endpoint configuration:', error)
      if (error.response?.data?.message) {
        toast.error(error.response.data.message)
      } else {
        toast.error('Failed to update endpoint configuration')
      }
    } finally {
      setIsUpdatingEndpoints(false)
    }
  }

  const cancelEditEndpoints = () => {
    if (endpointConfig) {
      setHttpEndpoint(endpointConfig.httpEndpoint)
      setGrpcEndpoint(endpointConfig.grpcEndpoint)
    }
    setIsEditingEndpoints(false)
  }

  const syncLocations = async () => {
    if (!user?.company?.id) {
      toast.error('Company ID not found')
      return
    }

    setIsSyncingLocations(true)
    try {
      // Run the sync - this returns {added, removed, total}
      const syncResponse = await endpointsApi.syncLocations(user.company.id)
      
      // Reload endpoint config to get updated lastLocationSyncAt
      await loadEndpointConfig()
      
      // Fetch the synced locations from the backend
      const locationsResponse = await endpointsApi.getSyncedLocations(user.company.id)
      
      // Update locations state
      if (locationsResponse.items && locationsResponse.items.length > 0) {
        setLocations(locationsResponse.items)
        setShowLocations(true)
      } else {
        setLocations([])
        setShowLocations(false)
      }
      
      // Show success message based on sync response
      // Sync is successful even if added=0, removed=0, total=0 (means no changes)
      if (syncResponse && typeof syncResponse === 'object') {
        const added = syncResponse.added || 0
        const removed = syncResponse.removed || 0
        const total = syncResponse.total || 0
        
        if (added > 0 || removed > 0) {
          toast.success(`Locations synced successfully! Added: ${added}, Removed: ${removed}, Total: ${total}`)
        } else if (total > 0) {
          toast.success(`Locations synced successfully! ${total} location(s) available.`)
        } else {
          // Sync completed but no locations found - this is still a successful sync
          toast.success('Location sync completed successfully. No locations to sync.')
        }
      } else {
        // Fallback if response format is unexpected
        if (locationsResponse.items && locationsResponse.items.length > 0) {
          toast.success(`Locations synced successfully! ${locationsResponse.items.length} location(s) available.`)
        } else {
          toast.success('Location sync completed successfully.')
        }
      }
      
      // Update lastSyncTime from endpointConfig (which was just refreshed)
      if (endpointConfig?.lastLocationSyncAt) {
        setLastSyncTime(endpointConfig.lastLocationSyncAt)
      } else {
        const syncTime = new Date().toISOString()
        setLastSyncTime(syncTime)
      }
    } catch (error: any) {
      console.error('Failed to sync locations:', error)
      toast.error(error.response?.data?.message || 'Failed to sync locations')
    } finally {
      setIsSyncingLocations(false)
    }
  }

  const importBranches = async () => {
    setIsImportingBranches(true)
    try {
      const result = await endpointsApi.importBranches()
      toast.success(`Branches imported successfully! ${result.imported} new, ${result.updated} updated`)
    } catch (error: any) {
      console.error('Failed to import branches:', error)
      const errorMessage = error.response?.data?.message || 'Failed to import branches'
      const errorCode = error.response?.data?.error || ''
      
      // Show error modal for important errors
      if (error.response?.status === 400 && (errorCode === 'NOT_APPROVED' || errorMessage.includes('approved'))) {
        setErrorModal({
          isOpen: true,
          title: 'Account Approval Required',
          message: errorMessage,
          error: errorCode,
        })
      } else {
        toast.error(errorMessage)
      }
    } finally {
      setIsImportingBranches(false)
    }
  }

  const testSourceGrpc = async () => {
    if (!grpcEndpoint) {
      toast.error('Please set gRPC endpoint first')
      return
    }

    setIsTestingGrpc(true)
    setGrpcTestResult(null)
    
    try {
      console.log('Testing gRPC connection to:', grpcEndpoint)
      const response = await endpointsApi.testSourceGrpc({
        addr: grpcEndpoint,
        grpcEndpoints: {
          health: 'health', // Always test health
          locations: 'locations', // Also test locations endpoint
        }
      })
      console.log('gRPC test response:', response)
      setGrpcTestResult(response)
      
      // Save test result to localStorage
      if (user?.company?.id) {
        localStorage.setItem(`grpcTestResult_${user.company.id}`, JSON.stringify(response))
        localStorage.setItem(`grpcEndpoint_${user.company.id}`, grpcEndpoint)
      }
      
      if (response.ok) {
        toast.success('gRPC test completed successfully!')
      } else {
        const failedEndpoints = Object.entries(response.endpoints || {})
          .filter(([_, result]) => result && !result.ok)
          .map(([name]) => name)
        toast.error(`gRPC test failed: ${failedEndpoints.join(', ')}`)
      }
    } catch (error: any) {
      console.error('Failed to test gRPC:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Failed to test gRPC connection'
      toast.error(errorMessage)
      // Set a failed result so UI shows the error
      setGrpcTestResult({
        ok: false,
        addr: grpcEndpoint,
        totalMs: 0,
        endpoints: {
          health: {
            ok: false,
            error: errorMessage,
            ms: 0
          },
          locations: null,
          availability: null,
          bookings: null
        },
        tested: []
      })
    } finally {
      setIsTestingGrpc(false)
    }
  }

  const createAgreement = async () => {
    if (!selectedAgentId || !agreementRef || !validFrom || !validTo) {
      toast.error('Please fill in all fields')
      return
    }

    // Duplicate check
    try {
      const dup = await agreementsApi.checkDuplicate({
        agreementRef,
        agentId: selectedAgentId,
        sourceId: user.company.id,
      })
      if (dup?.duplicate) {
        const proceed = window.confirm('Duplicate agreement detected. Proceed anyway?')
        if (!proceed) return
      }
    } catch {}

    setIsCreatingAgreement(true)
    try {
      const agreementData: CreateAgreementRequest = {
        agent_id: selectedAgentId,
        source_id: user.company.id,
        agreement_ref: agreementRef,
        valid_from: validFrom,
        valid_to: validTo,
      }

      await agreementsApi.createAgreement(agreementData)
      toast.success('Agreement created successfully!')
      
      // Reset form
      setSelectedAgentId('')
      setAgreementRef('')
      setValidFrom('')
      setValidTo('')
      
      // Reload agents to get updated data
      await loadAgents()
    } catch (error: any) {
      console.error('Failed to create agreement:', error)
      if (error.response?.data?.message) {
        toast.error(error.response.data.message)
      } else {
        toast.error('Failed to create agreement')
      }
    } finally {
      setIsCreatingAgreement(false)
    }
  }

  const offerAgreement = async (agreementId: string) => {
    setIsOfferingAgreement(agreementId)
    try {
      await agreementsApi.offerAgreement(agreementId)
      toast.success('Agreement offered successfully!')
      // Reload agents to get updated data
      await loadAgents()
    } catch (error) {
      console.error('Failed to offer agreement:', error)
      toast.error('Failed to offer agreement')
    } finally {
      setIsOfferingAgreement(null)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    toast.success('Logged out successfully')
    navigate('/login')
  }

  const generateAgreementRef = () => {
    const year = new Date().getFullYear()
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    setAgreementRef(`AG-${year}-${random}`)
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Sidebar */}
      <Sidebar 
        activeTab={activeTab} 
        onTabChange={handleTabChange} 
        user={user} 
        onLogout={handleLogout}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Topbar - Hidden on mobile, shown on desktop */}
        <header className="hidden lg:block bg-white border-b border-gray-200 shadow-sm">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h2 className="text-lg font-semibold text-gray-900">Car Hire - Source</h2>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3 pr-4 border-r border-gray-200">
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-900">{user?.company?.companyName}</div>
                  <div className="text-xs text-gray-500">{user?.email}</div>
                </div>
              </div>
            </div>
          </div>
        </header>
        
        {/* Mobile topbar spacing */}
        <div className="lg:hidden h-16"></div>

        {/* Main content area */}
        <main className="flex-1 overflow-y-auto">
          {activeTab === 'docs' ? (
            <div className="max-w-6xl mx-auto px-6 py-8">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">API Documentation</h3>
                <p className="text-sm text-blue-700 mb-4">Click the "Docs" link in the sidebar to open the full API documentation in a new tab.</p>
                <a
                  href={`${import.meta.env.PROD ? '/source' : ''}/docs-fullscreen`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Open API Documentation
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </div>
          ) : (
            <div className="max-w-6xl mx-auto px-6 py-8">
                {activeTab === 'dashboard' && (
                <>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">Overview</h1>
                    <p className="mt-2 text-gray-600">Monitor your source health and agreements</p>
                    
                    {/* Company Info */}
                    {user?.company && (
                      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center gap-4 text-sm">
                          <div>
                            <span className="font-semibold text-gray-700">Company ID:</span>
                            <code className="ml-2 px-2 py-1 bg-white border border-blue-300 rounded text-blue-700 font-mono text-xs">
                              {user.company.id}
                            </code>
                          </div>
                          <div>
                            <span className="font-semibold text-gray-700">Type:</span>
                            <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded font-medium">
                              {user.company.type}
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-600 mt-2">
                          💡 Use your Company ID in API requests where <code className="px-1 bg-white rounded">sourceId</code> or <code className="px-1 bg-white rounded">YOUR_COMPANY_ID</code> is required.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Quick stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 p-3 bg-blue-100 rounded-xl">
                          <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Agreements Active</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {agents.flatMap(a => a.agentAgreements || []).filter(a => a.status === 'ACCEPTED').length}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 p-3 bg-green-100 rounded-xl">
                          <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Last Health Check</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {health?.healthy ? 'Healthy' : health ? 'Issues' : '—'}
                          </p>
                          {health?.excludedUntil && new Date(health.excludedUntil).getTime() > Date.now() && (
                            <p className="text-sm text-red-600 font-semibold mt-1">Excluded</p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 p-3 bg-purple-100 rounded-xl">
                          <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">gRPC Status</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {grpcTestResult?.ok ? 'Connected' : endpointConfig?.grpcEndpoint ? 'Not tested' : 'Not set'}
                          </p>
                          {grpcTestResult?.ok && (
                            <p className="text-sm text-green-600 font-semibold mt-1">{grpcTestResult.totalMs}ms</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Endpoint Configuration */}
                  {user?.company.status === 'ACTIVE' && (
                    <div className="mt-6">
                      <EndpointConfiguration
                        endpointConfig={endpointConfig}
                        isLoadingEndpoints={isLoadingEndpoints}
                        isEditingEndpoints={isEditingEndpoints}
                        isUpdatingEndpoints={isUpdatingEndpoints}
                        httpEndpoint={httpEndpoint}
                        grpcEndpoint={grpcEndpoint}
                        setHttpEndpoint={setHttpEndpoint}
                        setGrpcEndpoint={setGrpcEndpoint}
                        setIsEditingEndpoints={setIsEditingEndpoints}
                        updateEndpointConfig={updateEndpointConfig}
                        cancelEditEndpoints={cancelEditEndpoints}
                      />
                    </div>
                  )}

                  {/* gRPC Connection Test */}
                  {user?.company.status === 'ACTIVE' && endpointConfig?.grpcEndpoint && (
                    <div className="mt-6">
                      <GrpcConnectionTest
                        grpcEndpoint={grpcEndpoint}
                        grpcTestResult={grpcTestResult}
                        isTestingGrpc={isTestingGrpc}
                        testSourceGrpc={testSourceGrpc}
                      />
                    </div>
                  )}

                  {/* Offer Agreement Shortcut */}
                  {user?.company.status === 'ACTIVE' && endpointConfig?.grpcEndpoint && grpcTestResult?.ok && (
                    <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl shadow-md p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready to Offer an Agreement?</h3>
                          <p className="text-sm text-gray-600">
                            Create and offer agreements to agents to start accepting bookings from them.
                          </p>
                        </div>
                        <Button onClick={() => setActiveTab('agreements')} variant="primary">
                          Offer New Agreement
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Status alert */}
                  {user?.company.status === 'PENDING_VERIFICATION' && <PendingVerification />}
                  {user?.company.status === 'ACTIVE' && !endpointConfig?.grpcEndpoint && (
                    <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        <strong>Setup Required:</strong> Configure your endpoints to start managing agreements.
                      </p>
                    </div>
                  )}
                </>
              )}

              {activeTab === 'agreements' && (
                <>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">Agreements</h1>
                    <p className="mt-2 text-gray-600">Manage your agreements with agents</p>
                  </div>

                  <div className="mt-6 space-y-6">
                    {/* My Agreements Section */}
                    {user?.company.status === 'ACTIVE' && (
                      <MyAgreements user={user} />
                    )}

                    {/* Create New Agreement Section */}
                    {user?.company.status === 'ACTIVE' ? (
                      <>
                        <CreateAgreementForm
                          agents={agents}
                          selectedAgentId={selectedAgentId}
                          agreementRef={agreementRef}
                          validFrom={validFrom}
                          validTo={validTo}
                          isCreatingAgreement={isCreatingAgreement}
                          setSelectedAgentId={setSelectedAgentId}
                          setAgreementRef={setAgreementRef}
                          setValidFrom={setValidFrom}
                          setValidTo={setValidTo}
                          generateAgreementRef={generateAgreementRef}
                          createAgreement={createAgreement}
                          user={user}
                          endpointConfig={endpointConfig}
                          grpcTestResult={grpcTestResult}
                        />
                        {grpcTestResult?.ok ? (
                          <AvailableAgents
                            agents={agents}
                            isLoadingAgents={isLoadingAgents}
                            isOfferingAgreement={isOfferingAgreement}
                            offerAgreement={offerAgreement}
                            user={user}
                            endpointConfig={endpointConfig}
                            grpcTestResult={grpcTestResult}
                            onViewAgreement={handleViewAgreement}
                          />
                        ) : (
                          <GrpcTestRequired />
                        )}
                      </>
                    ) : (
                      <PendingVerification />
                    )}
                  </div>
                </>
              )}

              {activeTab === 'locations' && (
                <>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">Locations</h1>
                    <p className="mt-2 text-gray-600">View and manage pickup/dropoff locations by agreement</p>
                  </div>

                  <div className="mt-6">
                    {/* Location Sync Status */}
                    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 mb-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Location Sync Status</h3>
                        <div className="flex items-center gap-3">
                          <Button 
                            onClick={syncLocations} 
                            loading={isSyncingLocations}
                            variant="primary"
                            size="sm"
                          >
                            Sync Locations
                          </Button>
                          <Button 
                            onClick={importBranches} 
                            loading={isImportingBranches}
                            variant="secondary"
                            size="sm"
                          >
                            Import Branches
                          </Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <div className="text-sm text-gray-500">Last Sync</div>
                          <div className="text-base font-semibold text-gray-900 mt-1">
                            {lastSyncTime ? new Date(lastSyncTime).toLocaleString() : 'Never'}
                          </div>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <div className="text-sm text-gray-500">Total Locations</div>
                          <div className="text-base font-semibold text-gray-900 mt-1">
                            {locations.length > 0 ? locations.length : '—'}
                          </div>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <div className="text-sm text-gray-500">Sync Method</div>
                          <div className="text-base font-semibold text-gray-900 mt-1">Manual</div>
                        </div>
                      </div>
                      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800">
                          <strong>Note:</strong> Click "Sync Locations" to sync your coverage from supplier adapter. Click "Import Branches" to import branches from your HTTP endpoint.
                        </p>
                      </div>
                    </div>

                    {/* Add Location Form */}
                    <div className="mb-6">
                      <AddLocationForm
                        onSuccess={() => {
                          // Reload synced locations after adding
                          if (user?.company?.id) {
                            loadSyncedLocations()
                          }
                        }}
                        onLocationAdded={() => {
                          // Reload synced locations after adding
                          if (user?.company?.id) {
                            loadSyncedLocations()
                          }
                        }}
                      />
                    </div>

                    <div className="mb-4 flex items-center gap-3">
                      <select
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={selectedAgreementFilterId}
                        onChange={(e) => setSelectedAgreementFilterId(e.target.value)}
                      >
                        <option value="">All locations</option>
                        {agents.flatMap(a => a.agentAgreements || []).map(ag => (
                          <option key={ag.id} value={ag.id}>{ag.agreementRef}</option>
                        ))}
                      </select>
                      <Button onClick={() => loadLocations(true)} size="sm" variant="primary">Load Locations</Button>
                    </div>
                    
                    <AvailableLocations
                      locations={locations}
                      isLoadingLocations={isLoadingLocations}
                      showLocations={showLocations}
                      loadLocations={loadLocations}
                      showRemoveButton={!selectedAgreementFilterId}
                    />
                  </div>
                </>
              )}

              {activeTab === 'branches' && (
                <>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">Branches</h1>
                    <p className="mt-2 text-gray-600">Manage your branch locations and mappings</p>
                  </div>

                  <div className="mt-6">
                    <BranchList
                      onEdit={(branch) => {
                        setSelectedBranch(branch)
                        setIsEditBranchModalOpen(true)
                      }}
                    />
                  </div>
                </>
              )}

              {activeTab === 'location-requests' && (
                <>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">Location Requests</h1>
                    <p className="mt-2 text-gray-600">Request new locations not in the UN/LOCODE database</p>
                  </div>

                  <div className="mt-6 space-y-6">
                    <LocationRequestForm onSuccess={() => {}} />
                    <LocationRequestList />
                  </div>
                </>
              )}

              {activeTab === 'health' && (
                <>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">Health Status</h1>
                    <p className="mt-2 text-gray-600">Monitor your endpoint performance and exclusion status</p>
                  </div>

                  <div className="mt-6">
                    {healthLoading ? (
                      <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    ) : health ? (
                      <div className="space-y-6">
                        {/* Status Alert */}
                        {health.excludedUntil && new Date(health.excludedUntil).getTime() > Date.now() && (
                          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex items-start">
                              <svg className="h-5 w-5 text-red-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                              </svg>
                              <div className="ml-3">
                                <h3 className="text-sm font-medium text-red-800">Temporarily Excluded</h3>
                                <p className="mt-1 text-sm text-red-700">Your endpoint was too slow and has been excluded until {new Date(health.excludedUntil).toLocaleString()}</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Main Status */}
                        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">Current Status</h3>
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                              health.healthy ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {health.healthy ? 'Healthy' : 'Issues Detected'}
                            </span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 bg-gray-50 rounded-lg">
                              <div className="text-sm text-gray-500">Sample Count</div>
                              <div className="text-2xl font-bold text-gray-900 mt-1">{health.sampleCount ?? 0}</div>
                              {health.sampleCount === 0 && (
                                <div className="text-xs text-gray-400 mt-1">No requests tracked yet</div>
                              )}
                            </div>
                            <div className="p-4 bg-gray-50 rounded-lg">
                              <div className="text-sm text-gray-500">Slow Rate</div>
                              <div className="text-2xl font-bold text-gray-900 mt-1">
                                {health.slowRate != null ? `${(health.slowRate * 100).toFixed(1)}%` : '0%'}
                              </div>
                              {health.slowRate != null && health.slowRate > 0 && (
                                <div className="text-xs text-gray-400 mt-1">{(health.slowRate * 100).toFixed(1)}% of requests are slow</div>
                              )}
                            </div>
                            <div className="p-4 bg-gray-50 rounded-lg">
                              <div className="text-sm text-gray-500">Backoff Level</div>
                              <div className="text-2xl font-bold text-gray-900 mt-1">{health.backoffLevel ?? 0}</div>
                              {health.backoffLevel > 0 && (
                                <div className="text-xs text-gray-400 mt-1">Rate limiting active</div>
                              )}
                            </div>
                            <div className="p-4 bg-gray-50 rounded-lg">
                              <div className="text-sm text-gray-500">Excluded Until</div>
                              <div className="text-lg font-semibold text-gray-900 mt-1">
                                {health.excludedUntil ? new Date(health.excludedUntil).toLocaleString() : 'Not excluded'}
                              </div>
                              {health.excludedUntil && (
                                <div className="text-xs text-red-600 mt-1">Endpoint temporarily disabled</div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Health Timeline */}
                        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">Health Timeline</h3>
                          <div className="relative">
                            {/* Timeline line */}
                            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                            
                            {/* Timeline items */}
                            <div className="space-y-6">
                              {/* Sample events - in production this would come from API */}
                              {health.excludedUntil && new Date(health.excludedUntil).getTime() > Date.now() ? (
                                <div className="relative pl-10">
                                  <div className="absolute left-0 top-2 w-3 h-3 rounded-full bg-red-500"></div>
                                  <div className="flex items-start gap-2">
                                    <div className="flex-1">
                                      <div className="text-sm font-semibold text-red-600">Endpoint Excluded</div>
                                      <div className="text-xs text-gray-500 mt-1">
                                        {new Date(health.excludedUntil).toLocaleString()}
                                      </div>
                                      <div className="text-sm text-gray-700 mt-1">
                                        Endpoint was too slow and temporarily excluded from availability requests.
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ) : null}
                              
                              {health.slowRate > 0.1 && health.sampleCount > 0 && (
                                <div className="relative pl-10">
                                  <div className="absolute left-0 top-2 w-3 h-3 rounded-full bg-yellow-500"></div>
                                  <div className="flex items-start gap-2">
                                    <div className="flex-1">
                                      <div className="text-sm font-semibold text-yellow-600">Performance Warning</div>
                                      <div className="text-xs text-gray-500 mt-1">
                                        {health.updatedAt ? `${Math.round((Date.now() - new Date(health.updatedAt).getTime()) / 3600000)} hours ago` : 'Recently'}
                                      </div>
                                      <div className="text-sm text-gray-700 mt-1">
                                        Slow rate is {(health.slowRate * 100).toFixed(1)}%. Sample count: {health.sampleCount ?? 0}.
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                              
                              {health.healthy && health.sampleCount > 0 && (
                                <div className="relative pl-10">
                                  <div className="absolute left-0 top-2 w-3 h-3 rounded-full bg-green-500"></div>
                                  <div className="flex items-start gap-2">
                                    <div className="flex-1">
                                      <div className="text-sm font-semibold text-green-600">Health Check</div>
                                      <div className="text-xs text-gray-500 mt-1">
                                        {health.updatedAt ? new Date(health.updatedAt).toLocaleString() : 'Just now'}
                                      </div>
                                      <div className="text-sm text-gray-700 mt-1">
                                        Endpoint is healthy and responding normally. Slow rate: {(health.slowRate * 100).toFixed(1)}%.
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                              
                              {health.sampleCount === 0 && (
                                <div className="relative pl-10">
                                  <div className="absolute left-0 top-2 w-3 h-3 rounded-full bg-gray-400"></div>
                                  <div className="flex items-start gap-2">
                                    <div className="flex-1">
                                      <div className="text-sm font-semibold text-gray-600">No Data Yet</div>
                                      <div className="text-xs text-gray-500 mt-1">
                                        {health.updatedAt ? `Last check: ${new Date(health.updatedAt).toLocaleString()}` : 'Waiting for health metrics'}
                                      </div>
                                      <div className="text-sm text-gray-700 mt-1">
                                        Health monitoring will begin tracking your endpoint performance once requests are made.
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-6">
                          {health.updatedAt && (
                            <div className="text-xs text-gray-500">
                              Last updated: {new Date(health.updatedAt).toLocaleString()}
                            </div>
                          )}
                          <Button onClick={loadHealth} variant="secondary" size="sm">Refresh Health Data</Button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 text-center">
                        <p className="text-gray-500">No health data available</p>
                        <p className="text-xs text-gray-400 mt-2">Health monitoring tracks your endpoint performance and response times</p>
                        <Button onClick={loadHealth} variant="secondary" size="sm" className="mt-4">Load Health Data</Button>
                      </div>
                    )}
                  </div>
                </>
              )}

              {activeTab === 'settings' && (
                <>
                  <SettingsPage />
                </>
              )}

              {activeTab === 'verification' && (
                <>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">Verification</h1>
                    <p className="mt-2 text-gray-600">Test your source connectivity and endpoints</p>
                  </div>

                  <div className="mt-6">
                    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">Verification Status</h3>
                          <p className="text-sm text-gray-600 mt-1">Last run status and results</p>
                        </div>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          verificationStatus === 'PASSED' ? 'bg-green-100 text-green-800' :
                          verificationStatus === 'FAILED' ? 'bg-red-100 text-red-800' :
                          verificationStatus === 'RUNNING' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {verificationStatus}
                        </span>
                      </div>
                      <div className="mb-4">
                        <p className="text-sm text-gray-600 mb-3">
                          Verification tests your endpoint connectivity, health checks, locations, and booking functionality.
                        </p>
                      </div>
                      <Button
                        onClick={async () => {
                          setVerificationLoading(true)
                          setVerificationStatus('PENDING')
                          try {
                            const result = await verificationApi.runVerification()
                            setVerificationResult(result)
                            setVerificationStatus(result.passed ? 'PASSED' : 'FAILED')
                            
                            // Update history with new result
                            setVerificationHistory(prev => [result, ...prev.slice(0, 4)])
                            
                            if (result.passed) {
                              toast.success('Verification completed successfully')
                            } else {
                              const failedSteps = result.steps?.filter((s: any) => !s.passed) || []
                              const failedStepNames = result.steps
                                ?.filter((s: any) => !s.passed)
                                .map((s: any) => s.name)
                                .join(', ') || 'unknown'
                              toast.error(`Verification failed: ${failedSteps.length} step(s) failed (${failedStepNames})`)
                            }
                          } catch (e: any) {
                            setVerificationStatus('FAILED')
                            toast.error(e.response?.data?.message || 'Verification failed')
                          } finally {
                            setVerificationLoading(false)
                          }
                        }}
                        loading={verificationLoading}
                        disabled={verificationStatus === 'RUNNING'}
                      >
                        Run verification again
                      </Button>
                    </div>

                    {/* Verification History */}
                    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 mt-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Verification History</h3>
                      {verificationHistory.length > 0 ? (
                        <div className="space-y-3">
                          {verificationHistory.map((result, index) => {
                            const date = new Date(result.created_at)
                            const now = new Date()
                            const diffMs = now.getTime() - date.getTime()
                            const diffMins = Math.floor(diffMs / 60000)
                            const diffHours = Math.floor(diffMs / 3600000)
                            const diffDays = Math.floor(diffMs / 86400000)
                            
                            let timeAgo = 'Just now'
                            if (diffMins < 1) {
                              timeAgo = 'Just now'
                            } else if (diffMins < 60) {
                              timeAgo = `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
                            } else if (diffHours < 24) {
                              timeAgo = `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
                            } else if (diffDays < 7) {
                              timeAgo = `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
                            } else {
                              timeAgo = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined })
                            }
                            
                            const passedSteps = result.steps?.filter((s: any) => s.passed) || []
                            const failedSteps = result.steps?.filter((s: any) => !s.passed) || []
                            
                            let summary = ''
                            if (result.passed) {
                              summary = `All tests passed: ${result.steps?.length || 0} step(s) completed successfully.`
                            } else {
                              const failedStepNames = failedSteps.map((s: any) => s.name || 'unknown').join(', ')
                              summary = `Verification failed: ${failedSteps.length} step(s) failed (${failedStepNames}). ${failedSteps[0]?.detail || 'Review your configuration and try again.'}`
                            }
                            
                            return (
                              <div key={index} className={`flex items-start gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 ${index > 0 ? 'opacity-75' : ''}`}>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-sm font-semibold text-gray-900">
                                      {index === 0 ? 'Latest Run' : index === 1 ? 'Previous Run' : 'Earlier Run'}
                                    </span>
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                      result.passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                    }`}>
                                      {result.passed ? 'PASSED' : 'FAILED'}
                                    </span>
                                  </div>
                                  <div className="text-xs text-gray-500 mb-2">{timeAgo}</div>
                                  <div className="text-sm text-gray-700">
                                    {summary}
                                  </div>
                                  {result.steps && result.steps.length > 0 && (
                                    <div className="mt-2 space-y-1">
                                      {result.steps.slice(0, 3).map((step: any, stepIndex: number) => (
                                        <div key={stepIndex} className="text-xs text-gray-600 flex items-center gap-2">
                                          <span className={step.passed ? 'text-green-600' : 'text-red-600'}>
                                            {step.passed ? '✓' : '✗'}
                                          </span>
                                          <span className="font-medium">{step.name || 'Unknown step'}:</span>
                                          <span>{step.detail || step.message || 'No details'}</span>
                                        </div>
                                      ))}
                                      {result.steps.length > 3 && (
                                        <div className="text-xs text-gray-500">
                                          +{result.steps.length - 3} more step(s)
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <p className="text-sm">No verification history available</p>
                          <p className="text-xs mt-2">Run a verification test to see results here</p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
              </div>
            )}
        </main>
      </div>

      {/* Branch Edit Modal */}
      <BranchEditModal
        branch={selectedBranch}
        isOpen={isEditBranchModalOpen}
        onClose={() => {
          setIsEditBranchModalOpen(false)
          setSelectedBranch(null)
        }}
      />

      {/* Agreement Detail Modal */}
      <AgreementDetailModal
        agreementId={selectedAgreementId}
        isOpen={isAgreementModalOpen}
        onClose={() => {
          setIsAgreementModalOpen(false)
          setSelectedAgreementId(null)
        }}
      />

      {/* Error Modal */}
      <ErrorModal
        isOpen={errorModal.isOpen}
        onClose={() => setErrorModal({ ...errorModal, isOpen: false })}
        title={errorModal.title}
        message={errorModal.message}
        error={errorModal.error}
      />
    </div>
  )
}
