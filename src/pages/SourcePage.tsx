import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { agreementsApi, Agent, CreateAgreementRequest } from '../api/agreements'
import { endpointsApi, EndpointConfig, Location, SourceGrpcTestResponse } from '../api/endpoints'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
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
import { Badge } from '../components/ui/Badge'
import toast from 'react-hot-toast'
import api from '../lib/api'
import { Branch } from '../api/branches'
import { verificationApi, VerificationResult } from '../api/verification'
import { useQuery } from '@tanstack/react-query'
import { Bell } from 'lucide-react'
import { NotificationsDrawer } from '../components/NotificationsDrawer'

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
  
  // Notification state
  const [showNotifications, setShowNotifications] = useState(false)
  
  // Fetch unread notification count
  const { data: notificationsData } = useQuery({
    queryKey: ['notifications-count'],
    queryFn: async () => {
      try {
        const response = await api.get('/endpoints/notifications', {
          params: { limit: 50, unreadOnly: true }
        })
        const items = response.data?.items || response.data?.data?.items || []
        return items.filter((n: any) => !n.read && !n.readAt)
      } catch (error) {
        return []
      }
    },
    refetchInterval: 30000, // Refetch every 30 seconds
    retry: 1,
    enabled: !!user?.company?.id,
  })
  
  const unreadCount = notificationsData?.length || 0
  
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

  const demoPassTest = () => {
    // Generate a mock successful test result without actually testing
    const mockEndpoint = grpcEndpoint || 'localhost:50052'
    const mockResult: SourceGrpcTestResponse = {
      ok: true,
      addr: mockEndpoint,
      totalMs: 45,
      endpoints: {
        health: {
          ok: true,
          result: {
            status: 'SERVING'
          },
          ms: 23
        },
        locations: {
          ok: true,
          result: {
            locations: [
              { unlocode: 'USNYC', name: 'New York' },
              { unlocode: 'GBLON', name: 'London' },
              { unlocode: 'FRPAR', name: 'Paris' }
            ]
          },
          ms: 22
        } as any,
        availability: null,
        bookings: null
      },
      tested: ['health', 'locations']
    }

    setGrpcTestResult(mockResult)
    
    // Save demo test result to localStorage
    if (user?.company?.id) {
      localStorage.setItem(`grpcTestResult_${user.company.id}`, JSON.stringify(mockResult))
      localStorage.setItem(`grpcEndpoint_${user.company.id}`, mockEndpoint)
    }
    
    toast.success('Demo test passed! (This is a simulated successful result)')
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
              <h2 className="text-lg font-semibold text-gray-900">Gloria Connect - Source</h2>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3 pr-4 border-r border-gray-200">
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-900">{user?.company?.companyName}</div>
                  <div className="text-xs text-gray-500">{user?.email}</div>
                </div>
              </div>
              
              <button
                onClick={() => setShowNotifications(true)}
                className="relative p-3 text-gray-700 hover:bg-blue-50 rounded-xl transition-all duration-200 hover:shadow-md"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 h-5 w-5 bg-gradient-to-br from-red-500 to-red-600 text-white text-xs font-bold rounded-full border-2 border-white flex items-center justify-center shadow-lg animate-pulse">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>
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
                  {/* Header */}
                  <div className="mb-8">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="p-3 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl shadow-sm">
                        <svg className="w-8 h-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                          Overview
                        </h1>
                        <p className="mt-2 text-gray-600 font-medium">Monitor your source health and agreements</p>
                      </div>
                    </div>
                    
                    {/* Company Info Card */}
                    {user?.company && (
                      <Card className="mb-6 transform transition-all duration-300 hover:shadow-xl border-2 border-blue-100">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-md">
                                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                  </svg>
                                </div>
                                <div>
                                  <h3 className="text-lg font-bold text-gray-900">Company Information</h3>
                                  <p className="text-sm text-gray-500">Your source identification details</p>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 block">
                                    Company ID
                                  </label>
                                  <div className="flex items-center gap-2">
                                    <code className="flex-1 px-3 py-2 bg-white border-2 border-blue-200 rounded-lg text-blue-700 font-mono text-sm font-bold shadow-sm">
                                      {user.company.id}
                                    </code>
                                    <button
                                      onClick={() => {
                                        navigator.clipboard.writeText(user.company.id)
                                        toast.success('Company ID copied!')
                                      }}
                                      className="p-2 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors"
                                      title="Copy Company ID"
                                    >
                                      <svg className="w-4 h-4 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                      </svg>
                                    </button>
                                  </div>
                                </div>
                                
                                <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-100">
                                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 block">
                                    Company Type
                                  </label>
                                  <Badge variant="info" className="text-sm font-bold px-3 py-1.5">
                                    {user.company.type}
                                  </Badge>
                                </div>
                              </div>
                              
                              <div className="p-4 bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50 border-l-4 border-amber-400 rounded-lg">
                                <div className="flex items-start gap-3">
                                  <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                  </svg>
                                  <div>
                                    <p className="text-sm font-semibold text-amber-900 mb-1">API Integration Tip</p>
                                    <p className="text-xs text-amber-800 leading-relaxed">
                                      Use your Company ID in API requests where <code className="px-1.5 py-0.5 bg-white rounded font-mono text-xs font-bold">sourceId</code> or <code className="px-1.5 py-0.5 bg-white rounded font-mono text-xs font-bold">YOUR_COMPANY_ID</code> is required.
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {/* Active Agreements Card */}
                    <Card className="transform transition-all duration-300 hover:shadow-xl hover:scale-[1.02] border-2 border-blue-100">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Active Agreements</p>
                            <p className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-1">
                              {(agents || []).flatMap(a => a.agentAgreements || []).filter(a => a.status === 'ACCEPTED' || a.status === 'ACTIVE').length}
                            </p>
                            <p className="text-xs text-gray-500">
                              {(agents || []).flatMap(a => a.agentAgreements || []).filter(a => a.status === 'OFFERED').length} pending
                            </p>
                          </div>
                          <div className="p-4 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl shadow-lg">
                            <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Health Status Card */}
                    <Card className={`transform transition-all duration-300 hover:shadow-xl hover:scale-[1.02] border-2 ${
                      health?.healthy ? 'border-green-100' : health?.excludedUntil && new Date(health.excludedUntil).getTime() > Date.now() ? 'border-red-100' : 'border-yellow-100'
                    }`}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Health Status</p>
                            <div className="flex items-center gap-2 mb-1">
                              <p className={`text-3xl font-bold ${
                                health?.healthy ? 'text-green-600' : health?.excludedUntil && new Date(health.excludedUntil).getTime() > Date.now() ? 'text-red-600' : 'text-yellow-600'
                              }`}>
                                {health?.healthy ? 'Healthy' : health ? 'Issues' : '—'}
                              </p>
                              {health?.healthy && (
                                <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>
                            {health?.excludedUntil && new Date(health.excludedUntil).getTime() > Date.now() && (
                              <Badge variant="danger" className="mt-1">Excluded</Badge>
                            )}
                            {health?.sampleCount !== undefined && health.sampleCount > 0 && (
                              <p className="text-xs text-gray-500 mt-1">{health.sampleCount} samples</p>
                            )}
                          </div>
                          <div className={`p-4 rounded-2xl shadow-lg ${
                            health?.healthy ? 'bg-gradient-to-br from-green-100 to-emerald-100' : 
                            health?.excludedUntil && new Date(health.excludedUntil).getTime() > Date.now() ? 'bg-gradient-to-br from-red-100 to-rose-100' : 
                            'bg-gradient-to-br from-yellow-100 to-amber-100'
                          }`}>
                            <svg className={`h-8 w-8 ${
                              health?.healthy ? 'text-green-600' : 
                              health?.excludedUntil && new Date(health.excludedUntil).getTime() > Date.now() ? 'text-red-600' : 
                              'text-yellow-600'
                            }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* gRPC Status Card */}
                    <Card className={`transform transition-all duration-300 hover:shadow-xl hover:scale-[1.02] border-2 ${
                      grpcTestResult?.ok ? 'border-green-100' : endpointConfig?.grpcEndpoint ? 'border-yellow-100' : 'border-gray-100'
                    }`}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">gRPC Connection</p>
                            <div className="flex items-center gap-2 mb-1">
                              <p className={`text-2xl font-bold ${
                                grpcTestResult?.ok ? 'text-green-600' : endpointConfig?.grpcEndpoint ? 'text-yellow-600' : 'text-gray-400'
                              }`}>
                                {grpcTestResult?.ok ? 'Connected' : endpointConfig?.grpcEndpoint ? 'Not tested' : 'Not set'}
                              </p>
                              {grpcTestResult?.ok && (
                                <Badge variant="success" className="text-xs">Active</Badge>
                              )}
                            </div>
                            {grpcTestResult?.ok && (
                              <p className="text-sm text-green-600 font-semibold mt-1">
                                {grpcTestResult.totalMs}ms latency
                              </p>
                            )}
                            {endpointConfig?.grpcEndpoint && !grpcTestResult?.ok && (
                              <p className="text-xs text-yellow-600 mt-1">Test required</p>
                            )}
                          </div>
                          <div className={`p-4 rounded-2xl shadow-lg ${
                            grpcTestResult?.ok ? 'bg-gradient-to-br from-green-100 to-emerald-100' : 
                            endpointConfig?.grpcEndpoint ? 'bg-gradient-to-br from-yellow-100 to-amber-100' : 
                            'bg-gradient-to-br from-gray-100 to-gray-200'
                          }`}>
                            <svg className={`h-8 w-8 ${
                              grpcTestResult?.ok ? 'text-green-600' : 
                              endpointConfig?.grpcEndpoint ? 'text-yellow-600' : 
                              'text-gray-400'
                            }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
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
                        demoPassTest={demoPassTest}
                      />
                    </div>
                  )}

                  {/* Offer Agreement Shortcut */}
                  {user?.company.status === 'ACTIVE' && endpointConfig?.grpcEndpoint && grpcTestResult?.ok && (
                    <Card className="mt-6 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-2 border-blue-200 transform transition-all duration-300 hover:shadow-xl">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </div>
                            <div>
                              <h3 className="text-xl font-bold text-gray-900 mb-1">Ready to Offer an Agreement?</h3>
                              <p className="text-sm text-gray-600">
                                Create and offer agreements to agents to start accepting bookings from them.
                              </p>
                            </div>
                          </div>
                          <Button 
                            onClick={() => setActiveTab('agreements')} 
                            variant="primary"
                            className="shadow-lg hover:shadow-xl transform transition-all duration-200 hover:scale-105"
                          >
                            Offer New Agreement
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Status alert */}
                  {user?.company.status === 'PENDING_VERIFICATION' && <PendingVerification />}
                  {user?.company.status === 'ACTIVE' && !endpointConfig?.grpcEndpoint && (
                    <Card className="mt-6 border-2 border-yellow-200 bg-gradient-to-r from-yellow-50 to-amber-50">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="p-2 bg-yellow-100 rounded-lg">
                            <svg className="w-6 h-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <h4 className="font-bold text-yellow-900 mb-1">Setup Required</h4>
                            <p className="text-sm text-yellow-800">
                              Configure your endpoints to start managing agreements and accepting bookings.
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
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
                  {/* Header */}
                  <div className="mb-8">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="p-3 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl shadow-sm">
                        <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                  <div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                          Locations
                        </h1>
                        <p className="mt-2 text-gray-600 font-medium">Manage your pickup and drop-off locations</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 space-y-6">
                    {/* Location Sync Status */}
                    <Card className="transform transition-all duration-300 hover:shadow-xl border-2 border-gray-100">
                      <CardHeader className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-white rounded-lg shadow-sm">
                              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                            </div>
                            <div>
                              <CardTitle className="text-xl font-bold text-gray-900">Location Sync Status</CardTitle>
                              <p className="text-sm text-gray-600 mt-1">Sync your coverage and import branches</p>
                            </div>
                          </div>
                        <div className="flex items-center gap-3">
                          <Button 
                            onClick={syncLocations} 
                            loading={isSyncingLocations}
                            variant="primary"
                            size="sm"
                              className="shadow-md hover:shadow-lg"
                          >
                              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                            Sync Locations
                          </Button>
                          <Button 
                            onClick={importBranches} 
                            loading={isImportingBranches}
                            variant="secondary"
                            size="sm"
                              className="shadow-md hover:shadow-lg"
                          >
                              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                              </svg>
                            Import Branches
                          </Button>
                        </div>
                      </div>
                      </CardHeader>
                      <CardContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                          <div className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="p-2 bg-blue-100 rounded-lg">
                                <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                              <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Last Sync</div>
                            </div>
                            <div className="text-lg font-bold text-gray-900">
                            {lastSyncTime ? new Date(lastSyncTime).toLocaleString() : 'Never'}
                          </div>
                        </div>
                          <div className="p-5 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-100">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="p-2 bg-purple-100 rounded-lg">
                                <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                              </div>
                              <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Total Locations</div>
                            </div>
                            <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                            {locations.length > 0 ? locations.length : '—'}
                          </div>
                        </div>
                          <div className="p-5 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="p-2 bg-green-100 rounded-lg">
                                <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                        </div>
                              <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Sync Method</div>
                      </div>
                            <div className="text-lg font-bold text-gray-900">Manual</div>
                          </div>
                        </div>
                        <div className="p-4 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-l-4 border-blue-400 rounded-lg">
                          <div className="flex items-start gap-3">
                            <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                            <div>
                              <p className="text-sm font-semibold text-blue-900 mb-1">Sync Information</p>
                              <p className="text-xs text-blue-800 leading-relaxed">
                                Click "Sync Locations" to sync your coverage from supplier adapter. Click "Import Branches" to import branches from your HTTP endpoint.
                        </p>
                      </div>
                    </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Add Location Form */}
                    <Card className="transform transition-all duration-300 hover:shadow-xl border-2 border-gray-100">
                      <CardHeader className="bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 border-b border-gray-200">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-white rounded-lg shadow-sm">
                            <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                          </div>
                          <div>
                            <CardTitle className="text-xl font-bold text-gray-900">Add Location to Coverage</CardTitle>
                            <p className="text-sm text-gray-600 mt-1">Search and add new locations to your coverage</p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-6">
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
                      </CardContent>
                    </Card>

                    {/* Filter and Load Section */}
                    <Card className="transform transition-all duration-300 hover:shadow-xl border-2 border-gray-100">
                      <CardHeader className="bg-gradient-to-r from-amber-50 via-orange-50 to-yellow-50 border-b border-gray-200">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-white rounded-lg shadow-sm">
                            <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                            </svg>
                          </div>
                          <div>
                            <CardTitle className="text-xl font-bold text-gray-900">Filter Locations</CardTitle>
                            <p className="text-sm text-gray-600 mt-1">View locations by agreement or all locations</p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                          <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Agreement</label>
                      <select
                              className="w-full border-2 border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm hover:shadow-md"
                        value={selectedAgreementFilterId}
                        onChange={(e) => setSelectedAgreementFilterId(e.target.value)}
                      >
                        <option value="">All locations</option>
                        {(agents || []).flatMap(a => a.agentAgreements || []).map(ag => (
                          <option key={ag.id} value={ag.id}>{ag.agreementRef}</option>
                        ))}
                      </select>
                    </div>
                          <div className="flex items-end">
                            <Button 
                              onClick={() => loadLocations(true)} 
                              size="sm" 
                              variant="primary"
                              className="shadow-md hover:shadow-lg"
                            >
                              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                              Load Locations
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    {/* Available Locations */}
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
                  <div className="mb-8">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="p-3 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl shadow-sm">
                        <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                  <div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                          Branches
                        </h1>
                        <p className="mt-2 text-gray-600 font-medium">Manage your branch locations and mappings</p>
                      </div>
                    </div>
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
                  <div className="mb-8">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="p-3 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl shadow-sm">
                        <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                  <div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                          Location Requests
                        </h1>
                        <p className="mt-2 text-gray-600 font-medium">Request new locations not in the UN/LOCODE database</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 space-y-6">
                    <LocationRequestForm onSuccess={() => {}} />
                    <LocationRequestList />
                  </div>
                </>
              )}

              {activeTab === 'health' && (
                <>
                  <div className="mb-8">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="p-3 bg-gradient-to-br from-red-100 to-pink-100 rounded-xl shadow-sm">
                        <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                          Health Status
                        </h1>
                        <p className="mt-2 text-gray-600 font-medium">Monitor your endpoint performance and exclusion status</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6">
                    {healthLoading ? (
                      <div className="flex flex-col items-center justify-center py-16">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mb-4"></div>
                        <p className="text-gray-600 font-medium">Loading health data...</p>
                      </div>
                    ) : health ? (
                      <div className="space-y-6">
                        {/* Status Alert */}
                        {health.excludedUntil && new Date(health.excludedUntil).getTime() > Date.now() && (
                          <Card className="border-2 border-red-300 bg-gradient-to-r from-red-50 via-rose-50 to-pink-50 shadow-lg transform transition-all duration-300 hover:shadow-xl">
                            <CardContent className="p-6">
                              <div className="flex items-start gap-4">
                                <div className="p-3 bg-red-100 rounded-xl shadow-md">
                                  <svg className="h-7 w-7 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                  </svg>
                                </div>
                                <div className="flex-1">
                                  <h3 className="text-xl font-bold text-red-900 mb-2 flex items-center gap-2">
                                    Temporarily Excluded
                                    <Badge variant="danger" size="md">Critical</Badge>
                                  </h3>
                                  <p className="text-sm text-red-800 leading-relaxed">
                                    Your endpoint was too slow and has been excluded from availability requests until{' '}
                                    <span className="font-bold text-red-900">{new Date(health.excludedUntil).toLocaleString()}</span>.
                                    Please optimize your endpoint performance to resume service.
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )}

                        {/* Main Status Card */}
                        <Card className="transform transition-all duration-300 hover:shadow-xl border-2 border-gray-100 shadow-lg">
                          <CardHeader className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-white rounded-lg shadow-sm">
                                  <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </div>
                                <div>
                                  <CardTitle className="text-xl font-bold text-gray-900">Current Status</CardTitle>
                                  <p className="text-sm text-gray-600 mt-1">Real-time health metrics and performance indicators</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <Badge 
                                  variant={health.healthy ? 'success' : 'danger'} 
                                  size="md" 
                                  className="font-bold text-sm px-4 py-1.5"
                                >
                                  {health.healthy ? (
                                    <span className="flex items-center gap-1.5">
                                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                      </svg>
                                      Healthy
                                    </span>
                                  ) : (
                                    <span className="flex items-center gap-1.5">
                                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                      </svg>
                                      Issues Detected
                                    </span>
                                  )}
                              </Badge>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                              {/* Sample Count */}
                              <div className="p-6 bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-50 rounded-xl border-2 border-blue-100 shadow-sm hover:shadow-md transition-all duration-200">
                                <div className="flex items-center justify-between mb-3">
                                  <div className="text-xs font-bold text-gray-600 uppercase tracking-wider">Sample Count</div>
                                  <div className="p-1.5 bg-blue-100 rounded-lg">
                                    <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                  </div>
                                </div>
                                <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                                  {health.sampleCount ?? 0}
                                </div>
                                {health.sampleCount === 0 ? (
                                  <div className="text-xs text-gray-500 font-medium">No requests tracked yet</div>
                                ) : (
                                  <div className="text-xs text-gray-600 font-medium">Total requests monitored</div>
                                )}
                              </div>

                              {/* Slow Rate */}
                              <div className="p-6 bg-gradient-to-br from-purple-50 via-pink-50 to-purple-50 rounded-xl border-2 border-purple-100 shadow-sm hover:shadow-md transition-all duration-200">
                                <div className="flex items-center justify-between mb-3">
                                  <div className="text-xs font-bold text-gray-600 uppercase tracking-wider">Slow Rate</div>
                                  <div className="p-1.5 bg-purple-100 rounded-lg">
                                    <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                  </div>
                                </div>
                                <div className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                                  {health.slowRate != null ? `${(health.slowRate * 100).toFixed(1)}%` : '0%'}
                                </div>
                                <div className="mt-2">
                                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                    <div 
                                      className={`h-full rounded-full transition-all duration-500 ${
                                        (health.slowRate ?? 0) > 0.3 ? 'bg-red-500' :
                                        (health.slowRate ?? 0) > 0.1 ? 'bg-yellow-500' : 'bg-green-500'
                                      }`}
                                      style={{ width: `${Math.min((health.slowRate ?? 0) * 100, 100)}%` }}
                                    ></div>
                                  </div>
                                </div>
                                {health.slowRate != null && health.slowRate > 0 && (
                                  <div className="text-xs text-gray-600 font-medium mt-2">
                                    {(health.slowRate * 100).toFixed(1)}% of requests exceed threshold
                                  </div>
                                )}
                              </div>

                              {/* Backoff Level */}
                              <div className="p-6 bg-gradient-to-br from-green-50 via-emerald-50 to-green-50 rounded-xl border-2 border-green-100 shadow-sm hover:shadow-md transition-all duration-200">
                                <div className="flex items-center justify-between mb-3">
                                  <div className="text-xs font-bold text-gray-600 uppercase tracking-wider">Backoff Level</div>
                                  <div className="p-1.5 bg-green-100 rounded-lg">
                                    <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                  </div>
                                </div>
                                <div className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">
                                  {health.backoffLevel ?? 0}
                                </div>
                                {health.backoffLevel > 0 ? (
                                  <div className="flex items-center gap-2 mt-2">
                                    <Badge variant="warning" size="sm" className="text-xs">Rate Limiting Active</Badge>
                                  </div>
                                ) : (
                                  <div className="text-xs text-gray-600 font-medium mt-2">No rate limiting applied</div>
                                )}
                              </div>

                              {/* Exclusion Status */}
                              <div className="p-6 bg-gradient-to-br from-amber-50 via-yellow-50 to-amber-50 rounded-xl border-2 border-amber-100 shadow-sm hover:shadow-md transition-all duration-200">
                                <div className="flex items-center justify-between mb-3">
                                  <div className="text-xs font-bold text-gray-600 uppercase tracking-wider">Exclusion Status</div>
                                  <div className="p-1.5 bg-amber-100 rounded-lg">
                                    <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                </div>
                                </div>
                                {health.excludedUntil && new Date(health.excludedUntil).getTime() > Date.now() ? (
                                  <>
                                    <div className="text-lg font-bold text-red-600 mb-2">Excluded</div>
                                    <div className="text-xs text-gray-700 font-medium mb-2">
                                      Until: {new Date(health.excludedUntil).toLocaleDateString()}
                                    </div>
                                    <Badge variant="danger" size="sm" className="text-xs">Temporarily Disabled</Badge>
                                  </>
                                ) : (
                                  <>
                                    <div className="text-lg font-bold text-green-600 mb-2">Active</div>
                                    <div className="text-xs text-gray-600 font-medium">Endpoint is operational</div>
                                  </>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Health Timeline */}
                        <Card className="transform transition-all duration-300 hover:shadow-xl border-2 border-gray-100 shadow-lg">
                          <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-white rounded-lg shadow-sm">
                                <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                              <div>
                                <CardTitle className="text-xl font-bold text-gray-900">Health Timeline</CardTitle>
                                <p className="text-sm text-gray-600 mt-1">Recent health events and status changes</p>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-6">
                          <div className="relative">
                            {/* Timeline line */}
                              <div className="absolute left-6 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-200 via-purple-200 to-pink-200 rounded-full"></div>
                            
                            {/* Timeline items */}
                            <div className="space-y-6">
                              {health.excludedUntil && new Date(health.excludedUntil).getTime() > Date.now() ? (
                                  <div className="relative pl-14">
                                    <div className="absolute left-3 top-2 w-6 h-6 rounded-full bg-red-500 border-4 border-white shadow-lg flex items-center justify-center">
                                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                      </svg>
                                      </div>
                                    <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 shadow-sm">
                                      <div className="flex items-center gap-2 mb-1">
                                        <div className="text-sm font-bold text-red-700">Endpoint Excluded</div>
                                        <Badge variant="danger" size="sm">Critical</Badge>
                                      </div>
                                      <div className="text-xs text-gray-600 mb-2 font-medium">
                                        {new Date(health.excludedUntil).toLocaleString()}
                                      </div>
                                      <div className="text-sm text-gray-700 leading-relaxed">
                                        Endpoint was too slow and temporarily excluded from availability requests. Performance optimization required.
                                    </div>
                                  </div>
                                </div>
                              ) : null}
                              
                              {health.slowRate > 0.1 && health.sampleCount > 0 && (
                                  <div className="relative pl-14">
                                    <div className="absolute left-3 top-2 w-6 h-6 rounded-full bg-yellow-500 border-4 border-white shadow-lg flex items-center justify-center">
                                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                      </svg>
                                      </div>
                                    <div className="bg-yellow-50 border-l-4 border-yellow-500 rounded-lg p-4 shadow-sm">
                                      <div className="flex items-center gap-2 mb-1">
                                        <div className="text-sm font-bold text-yellow-700">Performance Warning</div>
                                        <Badge variant="warning" size="sm">Warning</Badge>
                                      </div>
                                      <div className="text-xs text-gray-600 mb-2 font-medium">
                                        {health.updatedAt ? `${Math.round((Date.now() - new Date(health.updatedAt).getTime()) / 3600000)} hours ago` : 'Recently'}
                                      </div>
                                      <div className="text-sm text-gray-700 leading-relaxed">
                                        Slow rate is <span className="font-semibold">{(health.slowRate * 100).toFixed(1)}%</span> with <span className="font-semibold">{health.sampleCount ?? 0}</span> samples. Consider optimizing endpoint performance.
                                    </div>
                                  </div>
                                </div>
                              )}
                              
                              {health.healthy && health.sampleCount > 0 && (
                                  <div className="relative pl-14">
                                    <div className="absolute left-3 top-2 w-6 h-6 rounded-full bg-green-500 border-4 border-white shadow-lg flex items-center justify-center">
                                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                      </svg>
                                      </div>
                                    <div className="bg-green-50 border-l-4 border-green-500 rounded-lg p-4 shadow-sm">
                                      <div className="flex items-center gap-2 mb-1">
                                        <div className="text-sm font-bold text-green-700">Health Check Passed</div>
                                        <Badge variant="success" size="sm">Healthy</Badge>
                                      </div>
                                      <div className="text-xs text-gray-600 mb-2 font-medium">
                                        {health.updatedAt ? new Date(health.updatedAt).toLocaleString() : 'Just now'}
                                      </div>
                                      <div className="text-sm text-gray-700 leading-relaxed">
                                        Endpoint is healthy and responding normally. Slow rate: <span className="font-semibold">{(health.slowRate * 100).toFixed(1)}%</span>.
                                    </div>
                                  </div>
                                </div>
                              )}
                              
                              {health.sampleCount === 0 && (
                                  <div className="relative pl-14">
                                    <div className="absolute left-3 top-2 w-6 h-6 rounded-full bg-gray-400 border-4 border-white shadow-lg flex items-center justify-center">
                                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                      </svg>
                                      </div>
                                    <div className="bg-gray-50 border-l-4 border-gray-400 rounded-lg p-4 shadow-sm">
                                      <div className="flex items-center gap-2 mb-1">
                                        <div className="text-sm font-bold text-gray-700">No Data Yet</div>
                                        <Badge variant="default" size="sm">Pending</Badge>
                                      </div>
                                      <div className="text-xs text-gray-600 mb-2 font-medium">
                                        {health.updatedAt ? `Last check: ${new Date(health.updatedAt).toLocaleString()}` : 'Waiting for health metrics'}
                                      </div>
                                      <div className="text-sm text-gray-700 leading-relaxed">
                                        Health monitoring will begin tracking your endpoint performance once requests are made through the system.
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          </CardContent>
                        </Card>

                        {/* Footer Actions */}
                        <div className="flex items-center justify-between pt-4">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                          {health.updatedAt && (
                              <>
                                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="font-medium">Last updated: {new Date(health.updatedAt).toLocaleString()}</span>
                              </>
                          )}
                          </div>
                          <Button 
                            onClick={loadHealth} 
                            variant="secondary" 
                            size="sm"
                            className="shadow-md hover:shadow-lg transition-all duration-200"
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Refresh Health Data
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Card className="border-2 border-gray-200 shadow-lg">
                        <CardContent className="p-12 text-center">
                          <div className="max-w-md mx-auto">
                            <div className="p-4 bg-gray-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                              <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                      </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">No Health Data Available</h3>
                            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                              Health monitoring tracks your endpoint performance and response times. Data will appear here once requests start flowing through the system.
                            </p>
                            <Button 
                              onClick={loadHealth} 
                              variant="primary" 
                              size="sm"
                              className="shadow-md hover:shadow-lg"
                            >
                              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                              Load Health Data
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
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
                  <div className="mb-8">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="p-3 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl shadow-sm">
                        <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                          Verification
                        </h1>
                        <p className="mt-2 text-gray-600 font-medium">Test your source connectivity and endpoints</p>
                      </div>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  {verificationResult && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                      <Card className="transform transition-all duration-300 hover:shadow-xl border-2 border-gray-100">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Total Steps</p>
                              <p className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-1">
                                {verificationResult.steps?.length || 0}
                              </p>
                              <p className="text-xs text-gray-500">Verification checks</p>
                            </div>
                            <div className="p-4 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl shadow-lg">
                              <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                              </svg>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="transform transition-all duration-300 hover:shadow-xl border-2 border-green-100">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Passed</p>
                              <p className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-1">
                                {verificationResult.steps?.filter((s: any) => s.passed).length || 0}
                              </p>
                              <p className="text-xs text-gray-500">
                                {verificationResult.steps?.length ? 
                                  `${Math.round((verificationResult.steps.filter((s: any) => s.passed).length / verificationResult.steps.length) * 100)}% success rate` 
                                  : 'No data'}
                              </p>
                            </div>
                            <div className="p-4 bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl shadow-lg">
                              <svg className="h-8 w-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="transform transition-all duration-300 hover:shadow-xl border-2 border-red-100">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Failed</p>
                              <p className="text-4xl font-bold bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent mb-1">
                                {verificationResult.steps?.filter((s: any) => !s.passed).length || 0}
                              </p>
                              <p className="text-xs text-gray-500">Requires attention</p>
                            </div>
                            <div className="p-4 bg-gradient-to-br from-red-100 to-rose-100 rounded-2xl shadow-lg">
                              <svg className="h-8 w-8 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                              </svg>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {/* Main Verification Card */}
                  <div className="mt-6">
                    <Card className="transform transition-all duration-300 hover:shadow-xl border-2 border-gray-100">
                      <CardHeader className={`border-b border-gray-200 ${
                        verificationStatus === 'PASSED' ? 'bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50' :
                        verificationStatus === 'FAILED' ? 'bg-gradient-to-r from-red-50 via-rose-50 to-pink-50' :
                        verificationStatus === 'RUNNING' ? 'bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50' :
                        'bg-gradient-to-r from-gray-50 via-slate-50 to-zinc-50'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 bg-white rounded-lg shadow-sm ${
                              verificationStatus === 'PASSED' ? 'text-green-600' :
                              verificationStatus === 'FAILED' ? 'text-red-600' :
                              verificationStatus === 'RUNNING' ? 'text-blue-600' :
                              'text-gray-600'
                            }`}>
                              {verificationStatus === 'PASSED' ? (
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                              ) : verificationStatus === 'FAILED' ? (
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                              ) : verificationStatus === 'RUNNING' ? (
                                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                              ) : (
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              )}
                            </div>
                            <div>
                              <CardTitle className="text-xl font-bold text-gray-900">Verification Status</CardTitle>
                              <p className="text-sm text-gray-600 mt-1">Test endpoint connectivity and functionality</p>
                            </div>
                          </div>
                          <Badge 
                            variant={
                              verificationStatus === 'PASSED' ? 'success' :
                              verificationStatus === 'FAILED' ? 'danger' :
                              verificationStatus === 'RUNNING' ? 'info' : 'default'
                            } 
                            size="lg" 
                            className="font-bold"
                          >
                            {verificationStatus}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-6">
                        <div className="mb-6">
                          <p className="text-sm text-gray-600 mb-4">
                            Verification tests your endpoint connectivity, health checks, locations, and booking functionality to ensure everything is configured correctly.
                        </p>
                          
                          {/* Step-by-step Results */}
                          {verificationResult && verificationResult.steps && verificationResult.steps.length > 0 && (
                            <div className="space-y-3 mb-6">
                              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Test Results</h3>
                              {verificationResult.steps.map((step: any, stepIndex: number) => (
                                <div 
                                  key={stepIndex} 
                                  className={`flex items-start gap-4 p-4 rounded-lg border-2 transition-all ${
                                    step.passed 
                                      ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200' 
                                      : 'bg-gradient-to-r from-red-50 to-rose-50 border-red-200'
                                  }`}
                                >
                                  <div className={`flex-shrink-0 mt-0.5 ${
                                    step.passed ? 'text-green-600' : 'text-red-600'
                                  }`}>
                                    {step.passed ? (
                                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                      </svg>
                                    ) : (
                                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                      </svg>
                                    )}
                      </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className={`font-semibold ${
                                        step.passed ? 'text-green-900' : 'text-red-900'
                                      }`}>
                                        {step.name || `Step ${stepIndex + 1}`}
                                      </span>
                                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                        step.passed 
                                          ? 'bg-green-100 text-green-800 border border-green-200' 
                                          : 'bg-red-100 text-red-800 border border-red-200'
                                      }`}>
                                        {step.passed ? 'PASSED' : 'FAILED'}
                                      </span>
                                    </div>
                                    {(step.detail || step.message) && (
                                      <p className={`text-sm mt-1 ${
                                        step.passed ? 'text-green-700' : 'text-red-700'
                                      }`}>
                                        {step.detail || step.message}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Progress Bar */}
                          {verificationResult && verificationResult.steps && (
                            <div className="mb-6">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-700">Overall Progress</span>
                                <span className="text-sm font-semibold text-gray-900">
                                  {verificationResult.steps.filter((s: any) => s.passed).length} / {verificationResult.steps.length} passed
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                <div 
                                  className={`h-full transition-all duration-500 rounded-full ${
                                    verificationResult.passed 
                                      ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                                      : 'bg-gradient-to-r from-red-500 to-rose-500'
                                  }`}
                                  style={{ 
                                    width: `${(verificationResult.steps.filter((s: any) => s.passed).length / verificationResult.steps.length) * 100}%` 
                                  }}
                                ></div>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-3">
                      <Button
                        onClick={async () => {
                          setVerificationLoading(true)
                              setVerificationStatus('RUNNING')
                          try {
                            const result = await verificationApi.runVerification()
                            setVerificationResult(result)
                            setVerificationStatus(result.passed ? 'PASSED' : 'FAILED')
                            
                            // Update history with new result
                            setVerificationHistory(prev => [result, ...prev.slice(0, 4)])
                            
                            if (result.passed) {
                                  toast.success('Verification completed successfully! All tests passed.')
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
                        variant="primary"
                            className="flex items-center gap-2 shadow-md hover:shadow-lg transform transition-all duration-200 hover:scale-105"
                      >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            {verificationStatus === 'IDLE' ? 'Run Verification' : 'Run Verification Again'}
                      </Button>
                          {verificationResult && (
                            <div className="text-xs text-gray-500">
                              Last run: {verificationResult.created_at ? new Date(verificationResult.created_at).toLocaleString() : 'Never'}
                            </div>
                          )}
                      </div>
                    </CardContent>
                  </Card>
                  </div>

                  {/* Verification History */}
                  {verificationHistory.length > 0 && (
                  <Card className="mt-6 transform transition-all duration-300 hover:shadow-xl border-2 border-gray-100">
                    <CardHeader className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-b border-gray-200">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-white rounded-lg shadow-sm">
                            <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div>
                      <CardTitle className="text-xl font-bold text-gray-900">Verification History</CardTitle>
                            <p className="text-sm text-gray-600 mt-1">Previous verification runs and results</p>
                          </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="space-y-4">
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
                            
                            return (
                              <div 
                                key={index} 
                                className={`p-5 rounded-xl border-2 transition-all hover:shadow-md ${
                                  index === 0 
                                    ? result.passed 
                                      ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200' 
                                      : 'bg-gradient-to-r from-red-50 to-rose-50 border-red-200'
                                    : 'bg-white border-gray-200 opacity-75'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex items-start gap-4 flex-1">
                                    <div className={`flex-shrink-0 mt-1 ${
                                      result.passed ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                      {result.passed ? (
                                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                      ) : (
                                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                        </svg>
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-3 mb-2">
                                        <span className="text-sm font-bold text-gray-900">
                                          {index === 0 ? 'Latest Run' : index === 1 ? 'Previous Run' : `Run ${index + 1}`}
                                    </span>
                                        <Badge 
                                          variant={result.passed ? 'success' : 'danger'} 
                                          size="sm"
                                          className="font-semibold"
                                        >
                                          {result.passed ? 'PASSED' : 'FAILED'}
                                        </Badge>
                                        <span className="text-xs text-gray-500">{timeAgo}</span>
                                  </div>
                                      
                                      <div className="grid grid-cols-2 gap-4 mb-3">
                                        <div className="flex items-center gap-2">
                                          <span className="text-xs font-medium text-gray-600">Total:</span>
                                          <span className="text-sm font-bold text-gray-900">{result.steps?.length || 0}</span>
                                  </div>
                                        <div className="flex items-center gap-2">
                                          <span className="text-xs font-medium text-gray-600">Passed:</span>
                                          <span className="text-sm font-bold text-green-600">{passedSteps.length}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <span className="text-xs font-medium text-gray-600">Failed:</span>
                                          <span className="text-sm font-bold text-red-600">{failedSteps.length}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <span className="text-xs font-medium text-gray-600">Success Rate:</span>
                                          <span className="text-sm font-bold text-gray-900">
                                            {result.steps?.length ? Math.round((passedSteps.length / result.steps.length) * 100) : 0}%
                                          </span>
                                        </div>
                                      </div>
                                      
                                      {failedSteps.length > 0 && (
                                        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                                          <p className="text-xs font-semibold text-red-900 mb-1">Failed Steps:</p>
                                          <div className="space-y-1">
                                            {failedSteps.slice(0, 3).map((step: any, stepIndex: number) => (
                                              <div key={stepIndex} className="text-xs text-red-700 flex items-center gap-2">
                                                <span className="font-semibold">•</span>
                                                <span>{step.name || 'Unknown step'}</span>
                                                {step.detail && <span className="text-red-600">— {step.detail}</span>}
                                        </div>
                                      ))}
                                            {failedSteps.length > 3 && (
                                              <div className="text-xs text-red-600 font-medium">
                                                +{failedSteps.length - 3} more failed step(s)
                                        </div>
                                      )}
                                          </div>
                                    </div>
                                  )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Empty State */}
                  {verificationHistory.length === 0 && verificationStatus === 'IDLE' && (
                    <Card className="mt-6 border-2 border-gray-200 bg-gradient-to-br from-gray-50 to-slate-50">
                      <CardContent className="p-12 text-center">
                        <div className="flex justify-center mb-4">
                          <div className="p-4 bg-gray-100 rounded-full">
                            <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Verification History</h3>
                        <p className="text-sm text-gray-600 mb-6">Run your first verification test to check endpoint connectivity and functionality.</p>
                        <Button
                          onClick={async () => {
                            setVerificationLoading(true)
                            setVerificationStatus('RUNNING')
                            try {
                              const result = await verificationApi.runVerification()
                              setVerificationResult(result)
                              setVerificationStatus(result.passed ? 'PASSED' : 'FAILED')
                              setVerificationHistory([result])
                              
                              if (result.passed) {
                                toast.success('Verification completed successfully! All tests passed.')
                              } else {
                                const failedSteps = result.steps?.filter((s: any) => !s.passed) || []
                                toast.error(`Verification failed: ${failedSteps.length} step(s) failed`)
                              }
                            } catch (e: any) {
                              setVerificationStatus('FAILED')
                              toast.error(e.response?.data?.message || 'Verification failed')
                            } finally {
                              setVerificationLoading(false)
                            }
                          }}
                          loading={verificationLoading}
                          variant="primary"
                          className="shadow-md hover:shadow-lg"
                        >
                          Run First Verification
                        </Button>
                    </CardContent>
                  </Card>
                  )}
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
        type={errorModal.message?.toLowerCase().includes('warning') ? 'warning' : 
              errorModal.message?.toLowerCase().includes('info') ? 'info' : 'error'}
      />
      
      {/* Notifications Drawer */}
      <NotificationsDrawer 
        isOpen={showNotifications} 
        onClose={() => setShowNotifications(false)}
        endpoint="/endpoints/notifications"
        markReadEndpoint={(id) => `/endpoints/notifications/${id}/read`}
      />
    </div>
  )
}
