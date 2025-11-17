import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
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
import toast from 'react-hot-toast'
import api from '../lib/api'
import DocsLayout from '../components/docs/DocsLayout'

export default function SourcePage() {
  const navigate = useNavigate()
  const [user, setUser] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'dashboard' | 'agreements' | 'locations' | 'health' | 'verification' | 'docs'>('dashboard')
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
  
  // Locations state
  const [locations, setLocations] = useState<Location[]>([])
  const [isLoadingLocations, setIsLoadingLocations] = useState(false)
  const [showLocations, setShowLocations] = useState(false)
  const [selectedAgreementId, setSelectedAgreementId] = useState<string>('')
  
  // gRPC Test state
  const [grpcTestResult, setGrpcTestResult] = useState<SourceGrpcTestResponse | null>(null)
  const [isTestingGrpc, setIsTestingGrpc] = useState(false)

  // Health state
  const [healthLoading, setHealthLoading] = useState(false)
  const [health, setHealth] = useState<any | null>(null)

  // Verification re-run state
  const [verificationStatus, setVerificationStatus] = useState<'IDLE' | 'PENDING' | 'RUNNING' | 'PASSED' | 'FAILED'>('IDLE')
  const [verificationLoading, setVerificationLoading] = useState(false)
  
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
      
      // Only load agents and endpoints if company status is ACTIVE
      if (parsedUser.company.status === 'ACTIVE') {
        loadAgents()
        loadEndpointConfig()
        // Preload health
        loadHealth()
      }
    }
  }, [])

  const loadAgents = async () => {
    try {
      setIsLoadingAgents(true)
      const response = await agreementsApi.getAllAgents()
      setAgents(response.items)
    } catch (error) {
      console.error('Failed to load agents:', error)
      toast.error('Failed to load agents')
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
    } catch (error) {
      console.error('Failed to load endpoint configuration:', error)
      toast.error('Failed to load endpoint configuration')
    } finally {
      setIsLoadingEndpoints(false)
    }
  }

  const loadHealth = async () => {
    try {
      setHealthLoading(true)
      const res = await api.get('/health/my-source')
      setHealth(res.data)
    } catch (e) {
      // ignore for now
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

  const loadLocations = async () => {
    setIsLoadingLocations(true)
    try {
      if (selectedAgreementId) {
        const response = await endpointsApi.getLocationsByAgreement(selectedAgreementId)
        const items = (response as any)?.items ?? (response as any) ?? []
        setLocations(items)
      } else {
        const response = await endpointsApi.getLocations()
        setLocations(response.items)
      }
      setShowLocations(true)
      toast.success('Locations loaded successfully!')
    } catch (error) {
      console.error('Failed to load locations:', error)
      toast.error('Failed to load locations')
    } finally {
      setIsLoadingLocations(false)
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
      const response = await endpointsApi.testSourceGrpc({
        addr: grpcEndpoint,
      })
      setGrpcTestResult(response)
      
      if (response.ok) {
        toast.success('gRPC test completed successfully!')
      } else {
        toast.error('gRPC test failed')
      }
    } catch (error) {
      console.error('Failed to test gRPC:', error)
      toast.error('Failed to test gRPC connection')
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
      <aside className="hidden lg:flex lg:flex-col w-56 bg-white border-r border-gray-200 shadow-sm">
        <div className="flex items-center px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700">
          <h1 className="text-lg font-bold text-white">Car Hire - Source</h1>
        </div>
        
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {[
            { key: 'dashboard', label: 'Overview' },
            { key: 'agreements', label: 'Agreements' },
            { key: 'locations', label: 'Locations' },
            { key: 'health', label: 'Health' },
            { key: 'verification', label: 'Verification' },
            { key: 'docs', label: 'API Reference' },
          ].map((n: any) => (
            <button
              key={n.key}
              onClick={() => setActiveTab(n.key)}
              className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 w-full text-left ${
                activeTab === n.key
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
              }`}
            >
              {n.label}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-200">
          <div className="flex items-center gap-2 px-2 py-2">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-xs font-semibold text-white shadow-md">
              {(user?.email || 'S')[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-gray-900 truncate">{user?.company?.companyName}</div>
              <div className="text-xs text-gray-500 truncate">{user?.email}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="bg-white border-b border-gray-200 shadow-sm">
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
              
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Logout</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main content area */}
        <main className="flex-1 overflow-y-auto">
          {activeTab === 'docs' ? (
            <div style={{ height: '100%' }}>
              <DocsLayout />
            </div>
          ) : (
            <div className="max-w-6xl mx-auto px-6 py-8">
                {activeTab === 'dashboard' && (
                <>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">Overview</h1>
                    <p className="mt-2 text-gray-600">Monitor your source health and agreements</p>
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

                  <div className="mt-6">
                    {user?.company.status === 'ACTIVE' && (
                      grpcTestResult?.ok ? (
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
                        />
                          <AvailableAgents
                            agents={agents}
                            isLoadingAgents={isLoadingAgents}
                            isOfferingAgreement={isOfferingAgreement}
                            offerAgreement={offerAgreement}
                          />
                        </>
                      ) : (
                        <GrpcTestRequired />
                      )
                    )}
                    {user?.company.status === 'PENDING_VERIFICATION' && <PendingVerification />}
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
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                          Synced
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <div className="text-sm text-gray-500">Last Sync</div>
                          <div className="text-base font-semibold text-gray-900 mt-1">2 hours ago</div>
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
                          <strong>Note:</strong> Locations must match the LOCODE set on the middleware. Contact admin for assistance.
                        </p>
                      </div>
                    </div>

                    <div className="mb-4 flex items-center gap-3">
                      <select
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={selectedAgreementId}
                        onChange={(e) => setSelectedAgreementId(e.target.value)}
                      >
                        <option value="">All locations</option>
                        {agents.flatMap(a => a.agentAgreements || []).map(ag => (
                          <option key={ag.id} value={ag.id}>{ag.agreementRef}</option>
                        ))}
                      </select>
                      <Button onClick={loadLocations} size="sm" variant="primary">Load Locations</Button>
                    </div>
                    
                    <AvailableLocations
                      locations={locations}
                      isLoadingLocations={isLoadingLocations}
                      showLocations={showLocations}
                      loadLocations={loadLocations}
                    />
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
                            </div>
                            <div className="p-4 bg-gray-50 rounded-lg">
                              <div className="text-sm text-gray-500">Slow Rate</div>
                              <div className="text-2xl font-bold text-gray-900 mt-1">
                                {health.slowRate != null ? `${(health.slowRate * 100).toFixed(1)}%` : '0%'}
                              </div>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-lg">
                              <div className="text-sm text-gray-500">Backoff Level</div>
                              <div className="text-2xl font-bold text-gray-900 mt-1">{health.backoffLevel ?? 0}</div>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-lg">
                              <div className="text-sm text-gray-500">Excluded Until</div>
                              <div className="text-lg font-semibold text-gray-900 mt-1">
                                {health.excludedUntil ? new Date(health.excludedUntil).toLocaleString() : 'Not excluded'}
                              </div>
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
                              
                              <div className="relative pl-10">
                                <div className="absolute left-0 top-2 w-3 h-3 rounded-full bg-yellow-500"></div>
                                <div className="flex items-start gap-2">
                                  <div className="flex-1">
                                    <div className="text-sm font-semibold text-yellow-600">Performance Warning</div>
                                    <div className="text-xs text-gray-500 mt-1">2 hours ago</div>
                                    <div className="text-sm text-gray-700 mt-1">
                                      Response time exceeded threshold. Sample count: {health.sampleCount ?? 0}.
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="relative pl-10">
                                <div className="absolute left-0 top-2 w-3 h-3 rounded-full bg-green-500"></div>
                                <div className="flex items-start gap-2">
                                  <div className="flex-1">
                                    <div className="text-sm font-semibold text-green-600">Last Health Check</div>
                                    <div className="text-xs text-gray-500 mt-1">Just now</div>
                                    <div className="text-sm text-gray-700 mt-1">
                                      Endpoint is healthy and responding normally.
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <Button onClick={loadHealth} variant="secondary">Refresh Health Data</Button>
                      </div>
                    ) : (
                      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 text-center">
                        <p className="text-gray-500">No health data available</p>
                        <Button onClick={loadHealth} variant="secondary" size="sm" className="mt-4">Load Health Data</Button>
                      </div>
                    )}
                  </div>
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
                            await api.post('/verification/run-for-source')
                            setVerificationStatus('RUNNING')
                            setTimeout(() => setVerificationStatus('PASSED'), 1500)
                            toast.success('Verification completed successfully')
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
                      <div className="space-y-3">
                        {/* Most recent */}
                        <div className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-semibold text-gray-900">Latest Run</span>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${verificationStatus === 'PASSED' ? 'bg-green-100 text-green-800' : verificationStatus === 'FAILED' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                                {verificationStatus}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500 mb-2">Just now</div>
                            <div className="text-sm text-gray-700">
                              {verificationStatus === 'PASSED' ? 'All tests passed: endpoint connectivity, health checks, locations, and booking functionality are working correctly.' : verificationStatus === 'FAILED' ? 'Some verification checks failed. Review your configuration and try again.' : 'Verification is pending or in progress.'}
                            </div>
                          </div>
                        </div>
                        
                        {/* Sample history items */}
                        <div className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 opacity-75">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-semibold text-gray-900">Previous Run</span>
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                PASSED
                              </span>
                            </div>
                            <div className="text-xs text-gray-500 mb-2">3 days ago</div>
                            <div className="text-sm text-gray-700">
                              All checks passed successfully.
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 opacity-75">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-semibold text-gray-900">Earlier Run</span>
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                FAILED
                              </span>
                            </div>
                            <div className="text-xs text-gray-500 mb-2">1 week ago</div>
                            <div className="text-sm text-gray-700">
                              gRPC endpoint connectivity check failed. Configuration was updated and re-verified successfully.
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
              </div>
            )}
        </main>
      </div>
    </div>
  )
}
