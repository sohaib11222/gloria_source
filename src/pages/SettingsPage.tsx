import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Loader } from '../components/ui/Loader'
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

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="mt-2 text-gray-600">Manage your company settings and preferences</p>
      </div>

      {/* Company Information */}
      <Card>
        <CardHeader>
          <CardTitle>Company Information</CardTitle>
        </CardHeader>
        <CardContent>
          {settings && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company Name
                </label>
                <Input value={settings.companyName} disabled />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company Code
                </label>
                <Input value={settings.companyCode || '—'} disabled />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company ID
                </label>
                <Input value={settings.companyId} disabled />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* IP/Domain Whitelist */}
      <Card>
        <CardHeader>
          <CardTitle>IP/Domain Whitelist</CardTitle>
          <p className="text-sm text-gray-600 mt-1">
            Configure allowed IP addresses or domains that can access your endpoints
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Whitelisted Domains/IPs
              </label>
              <textarea
                value={whitelistInput}
                onChange={(e) => setWhitelistInput(e.target.value)}
                placeholder="localhost, 127.0.0.1, *.example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter comma-separated list of IP addresses or domain patterns (e.g., *.example.com)
              </p>
            </div>
            <Button onClick={saveWhitelist} loading={isSaving} variant="primary">
              Save Whitelist
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Additional Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-600">
            <p>More settings will be available in future updates.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

