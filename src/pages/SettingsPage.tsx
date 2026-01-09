import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Loader } from '../components/ui/Loader'
import { Badge } from '../components/ui/Badge'
import { Settings, Building2, Shield, Globe, Save, Info, CheckCircle2, Copy, ExternalLink, Lock, Key } from 'lucide-react'
import api from '../lib/api'
import toast from 'react-hot-toast'

interface Settings {
  companyId: string
  companyName: string
  companyCode: string | null
  whitelistedDomains: string[]
}

export const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [whitelistInput, setWhitelistInput] = useState('')

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    setIsLoading(true)
    try {
      const response = await api.get('/settings')
      setSettings(response.data)
      setWhitelistInput(
        response.data.whitelistedDomains?.join(', ') || ''
      )
    } catch (error: any) {
      console.error('Failed to load settings:', error)
      toast.error('Failed to load settings')
    } finally {
      setIsLoading(false)
    }
  }

  const saveWhitelist = async () => {
    setIsSaving(true)
    try {
      const domains = whitelistInput
        .split(',')
        .map((d) => d.trim())
        .filter((d) => d.length > 0)

      await api.post('/settings/whitelist', { domains })
      toast.success('Whitelist updated successfully')
      await loadSettings()
    } catch (error: any) {
      console.error('Failed to save whitelist:', error)
      toast.error(error.response?.data?.message || 'Failed to save whitelist')
    } finally {
      setIsSaving(false)
    }
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied to clipboard`)
  }

  const hasUnsavedChanges = whitelistInput !== (settings?.whitelistedDomains?.join(', ') || '')

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="relative">
            <Loader size="lg" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Settings className="w-8 h-8 text-blue-500 animate-pulse" />
            </div>
          </div>
          <div>
            <p className="text-lg font-semibold text-gray-900">Loading settings...</p>
            <p className="text-sm text-gray-500 mt-1">Please wait while we fetch your configuration</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in pb-8">
      {/* Enhanced Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-2xl p-8 border border-indigo-100">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-200/30 to-purple-200/30 rounded-full blur-3xl -mr-32 -mt-32"></div>
        <div className="relative flex items-center gap-4">
          <div className="p-4 bg-white rounded-2xl shadow-lg border border-indigo-100">
            <Settings className="w-8 h-8 text-indigo-600" />
          </div>
          <div className="flex-1">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
              Settings
            </h1>
            <p className="text-gray-600 text-lg">Manage your company configuration and security preferences</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Company Information - Main Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Company Information Card */}
          <Card className="transform transition-all duration-300 hover:shadow-2xl border-2 border-gray-100 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16"></div>
              <div className="relative flex items-center gap-4">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl border border-white/30">
                  <Building2 className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-2xl font-bold text-white">Company Information</CardTitle>
                  <p className="text-sm text-white/90 mt-1">Your company details and identification</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-8 pb-6">
              {settings && (
                <div className="space-y-6">
                  {/* Company Name */}
                  <div className="group">
                    <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-indigo-600" />
                      Company Name
                    </label>
                    <div className="relative">
                      <Input 
                        value={settings.companyName} 
                        disabled 
                        className="bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-200 text-gray-900 font-medium pr-12"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      </div>
                    </div>
                  </div>

                  {/* Company Code */}
                  <div className="group">
                    <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                      <Key className="w-4 h-4 text-indigo-600" />
                      Company Code
                    </label>
                    <div className="relative">
                      <Input 
                        value={settings.companyCode || 'Not assigned'} 
                        disabled 
                        className="bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-200 font-mono pr-20"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        {settings.companyCode ? (
                          <>
                            <Badge variant="success" className="shadow-sm">
                              Active
                            </Badge>
                            <button
                              onClick={() => copyToClipboard(settings.companyCode!, 'Company Code')}
                              className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
                              title="Copy to clipboard"
                            >
                              <Copy className="w-4 h-4 text-gray-600" />
                            </button>
                          </>
                        ) : (
                          <Badge variant="default" className="shadow-sm">
                            Not Set
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Company ID */}
                  <div className="group">
                    <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                      <Lock className="w-4 h-4 text-indigo-600" />
                      Company ID
                    </label>
                    <div className="relative">
                      <Input 
                        value={settings.companyId} 
                        disabled 
                        className="bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-200 font-mono text-sm pr-12"
                      />
                      <button
                        onClick={() => copyToClipboard(settings.companyId, 'Company ID')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
                        title="Copy to clipboard"
                      >
                        <Copy className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                    <div className="flex items-start gap-2 mt-2 p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                      <Info className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-indigo-800">
                        <span className="font-semibold">Unique identifier:</span> This ID is used to identify your company in the system and cannot be changed.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* IP/Domain Whitelist Card */}
          <Card className="transform transition-all duration-300 hover:shadow-2xl border-2 border-gray-100 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16"></div>
              <div className="relative flex items-center gap-4">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl border border-white/30">
                  <Shield className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-2xl font-bold text-white">Security Whitelist</CardTitle>
                  <p className="text-sm text-white/90 mt-1">
                    Configure allowed IP addresses or domains for endpoint access
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-8 pb-6">
              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="block text-sm font-bold text-gray-700 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-blue-600" />
                    Whitelisted Domains & IP Addresses
                  </label>
                  <div className="relative">
                    <textarea
                      value={whitelistInput}
                      onChange={(e) => setWhitelistInput(e.target.value)}
                      placeholder="Enter domains or IPs separated by commas&#10;Example: localhost, 127.0.0.1, *.example.com, 192.168.1.1"
                      className={`w-full px-4 py-4 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-200 transition-all duration-200 font-mono text-sm resize-none ${
                        hasUnsavedChanges 
                          ? 'border-yellow-400 bg-yellow-50/50 focus:border-yellow-500' 
                          : 'border-gray-300 bg-white focus:border-blue-500'
                      }`}
                      rows={6}
                    />
                    {hasUnsavedChanges && (
                      <div className="absolute top-2 right-2">
                        <Badge variant="warning" className="animate-pulse shadow-md">
                          Unsaved
                        </Badge>
                      </div>
                    )}
                  </div>
                  
                  {/* Enhanced Info Box */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Info className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <p className="text-sm font-bold text-blue-900">Format Guidelines</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-blue-800">
                          <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                            <span><strong>IP addresses:</strong> <code className="bg-blue-100 px-1.5 py-0.5 rounded font-mono">127.0.0.1</code></span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                            <span><strong>Wildcards:</strong> <code className="bg-blue-100 px-1.5 py-0.5 rounded font-mono">*.example.com</code></span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                            <span><strong>Specific domains:</strong> <code className="bg-blue-100 px-1.5 py-0.5 rounded font-mono">api.example.com</code></span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                            <span><strong>Separate with commas</strong></span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-3">
                    <Button 
                      onClick={saveWhitelist} 
                      loading={isSaving} 
                      variant="primary"
                      size="lg"
                      className="flex items-center gap-2 shadow-lg hover:shadow-xl"
                    >
                      <Save className="w-5 h-5" />
                      {isSaving ? 'Saving Changes...' : 'Save Whitelist'}
                    </Button>
                    {hasUnsavedChanges && (
                      <Badge variant="warning" className="animate-pulse">
                        <span className="w-2 h-2 bg-yellow-500 rounded-full inline-block mr-2"></span>
                        Changes pending
                      </Badge>
                    )}
                  </div>
                  {settings?.whitelistedDomains && settings.whitelistedDomains.length > 0 && (
                    <div className="text-sm text-gray-600">
                      <span className="font-semibold text-gray-900">{settings.whitelistedDomains.length}</span> entry{settings.whitelistedDomains.length !== 1 ? 'ies' : 'y'} configured
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Quick Info */}
        <div className="space-y-6">
          {/* Quick Stats Card */}
          <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-100">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-bold text-gray-900">Quick Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {settings && (
                <>
                  <div className="p-4 bg-white rounded-lg border border-indigo-200">
                    <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Status</div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-bold text-gray-900">Active</span>
                    </div>
                  </div>
                  <div className="p-4 bg-white rounded-lg border border-indigo-200">
                    <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Whitelist Entries</div>
                    <div className="text-2xl font-bold text-indigo-600">
                      {settings.whitelistedDomains?.length || 0}
                    </div>
                  </div>
                  <div className="p-4 bg-white rounded-lg border border-indigo-200">
                    <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Company Code</div>
                    <div className="text-sm font-mono font-bold text-gray-900">
                      {settings.companyCode || 'Not assigned'}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Help Card */}
          <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-100">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Info className="w-5 h-5 text-blue-600" />
                Need Help?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-gray-700">
              <p className="leading-relaxed">
                Configure your security settings to control access to your API endpoints. Only whitelisted IPs and domains will be allowed to make requests.
              </p>
              <div className="pt-3 border-t border-blue-200">
                <button className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold text-sm transition-colors">
                  <ExternalLink className="w-4 h-4" />
                  View Documentation
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

