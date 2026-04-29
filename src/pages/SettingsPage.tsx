import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Loader } from '../components/ui/Loader'
import { Badge } from '../components/ui/Badge'
import {
  Settings,
  Building2,
  Shield,
  Globe,
  Save,
  Info,
  CheckCircle2,
  Copy,
  ExternalLink,
  Lock,
  Key,
  UserRound,
  Mail,
  RefreshCw,
  Eye,
  EyeOff,
} from 'lucide-react'
import api from '../lib/api'
import toast from 'react-hot-toast'

export const PROFILE_UPDATED_EVENT = 'gloria:source-profile-updated'

interface SettingsDto {
  companyId: string
  companyName: string
  companyCode: string | null
  companyWebsiteUrl?: string
  whitelistedDomains: string[]
}

interface MeUser {
  id: string
  email: string
  role: string
  companyId: string
  company: {
    id: string
    companyName: string
    type: string
    status: string
    adapterType?: string | null
    grpcEndpoint?: string | null
  }
  createdAt: string
  updatedAt: string
}

function readUserFromLocalStorage(): MeUser | null {
  try {
    const raw = localStorage.getItem('user')
    if (!raw) return null
    return JSON.parse(raw) as MeUser
  } catch {
    return null
  }
}

function syncStoredUserCompany(partial: { companyName?: string; companyWebsiteUrl?: string | null }) {
  try {
    const raw = localStorage.getItem('user')
    if (!raw) return
    const u = JSON.parse(raw) as MeUser
    if (u.company && partial.companyName !== undefined) {
      u.company.companyName = partial.companyName
    }
    localStorage.setItem('user', JSON.stringify(u))
    window.dispatchEvent(new CustomEvent(PROFILE_UPDATED_EVENT))
  } catch {
    /* ignore */
  }
}

export const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<SettingsDto | null>(null)
  const [profile, setProfile] = useState<MeUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isSavingCompany, setIsSavingCompany] = useState(false)
  const [whitelistInput, setWhitelistInput] = useState('')
  const [draftCompanyName, setDraftCompanyName] = useState('')
  const [draftWebsiteUrl, setDraftWebsiteUrl] = useState('')
  const [profileLoadError, setProfileLoadError] = useState<string | null>(null)
  const [settingsLoadError, setSettingsLoadError] = useState<string | null>(null)

  const [pwdNew, setPwdNew] = useState('')
  const [pwdConfirm, setPwdConfirm] = useState('')
  const [pwdOtp, setPwdOtp] = useState('')
  const [pwdShowNew, setPwdShowNew] = useState(false)
  const [pwdSending, setPwdSending] = useState(false)
  const [pwdSaving, setPwdSaving] = useState(false)
  const [pwdCodeSent, setPwdCodeSent] = useState(false)

  const loadAll = useCallback(async () => {
    setIsLoading(true)
    setProfileLoadError(null)
    setSettingsLoadError(null)

    const cached = readUserFromLocalStorage()

    try {
      const meResp = await api.get('/auth/me')
      if (meResp.status >= 200 && meResp.status < 300 && meResp.data) {
        setProfile(meResp.data as MeUser)
        localStorage.setItem('user', JSON.stringify(meResp.data))
      } else {
        setProfile(cached)
        setProfileLoadError(
          (meResp.data as { message?: string })?.message || `Could not refresh profile (HTTP ${meResp.status})`
        )
      }
    } catch {
      setProfile(cached)
      setProfileLoadError('Could not load profile. Check your connection and try again.')
    }

    try {
      const sResp = await api.get('/settings')
      if (sResp.status >= 200 && sResp.status < 300 && sResp.data) {
        const data = sResp.data as SettingsDto
        setSettings(data)
        setWhitelistInput(data.whitelistedDomains?.join(', ') || '')
        setDraftCompanyName(data.companyName)
        setDraftWebsiteUrl(data.companyWebsiteUrl || '')
      } else {
        setSettings(null)
        setSettingsLoadError(
          (sResp.data as { message?: string })?.message || `Could not load company settings (HTTP ${sResp.status})`
        )
        if (cached?.company?.companyName) {
          setDraftCompanyName(cached.company.companyName)
          setDraftWebsiteUrl('')
        }
      }
    } catch {
      setSettings(null)
      setSettingsLoadError('Could not load company settings.')
      if (cached?.company?.companyName) {
        setDraftCompanyName(cached.company.companyName)
        setDraftWebsiteUrl('')
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  const saveWhitelist = async () => {
    if (!settings) {
      toast.error('Load company settings before updating the whitelist')
      return
    }
    setIsSaving(true)
    try {
      const domains = whitelistInput
        .split(',')
        .map((d) => d.trim())
        .filter((d) => d.length > 0)

      const resp = await api.post('/settings/whitelist', { domains })
      if (resp.status >= 200 && resp.status < 300) {
        toast.success('Whitelist updated successfully')
        await loadAll()
      } else {
        toast.error((resp.data as { message?: string })?.message || 'Failed to save whitelist')
      }
    } catch (error: unknown) {
      console.error('Failed to save whitelist:', error)
      toast.error('Failed to save whitelist')
    } finally {
      setIsSaving(false)
    }
  }

  const saveCompanyProfile = async () => {
    const name = draftCompanyName.trim()
    if (!name) {
      toast.error('Company name cannot be empty')
      return
    }
    if (!profile && !settings) {
      toast.error('Load your session first (refresh the page)')
      return
    }
    setIsSavingCompany(true)
    try {
      const payload: { companyName: string; companyWebsiteUrl?: string | null } = { companyName: name }
      if (settings) {
        const w = draftWebsiteUrl.trim()
        payload.companyWebsiteUrl = w.length === 0 ? '' : w
      }
      const resp = await api.patch('/settings', payload)
      if (resp.status >= 200 && resp.status < 300 && resp.data) {
        const data = resp.data as SettingsDto
        setSettings(data)
        setDraftCompanyName(data.companyName)
        setDraftWebsiteUrl(data.companyWebsiteUrl || '')
        setSettingsLoadError(null)
        syncStoredUserCompany({ companyName: data.companyName, companyWebsiteUrl: data.companyWebsiteUrl || null })
        toast.success('Company details saved')
      } else {
        const msg = (resp.data as { message?: string; details?: unknown })?.message
        toast.error(msg || 'Failed to save company details')
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } }
      console.error('Failed to save company:', error)
      toast.error(err.response?.data?.message || 'Failed to save company details')
    } finally {
      setIsSavingCompany(false)
    }
  }

  const sendPasswordCode = async () => {
    const email = profile?.email || readUserFromLocalStorage()?.email
    if (!email) {
      toast.error('No email on file. Sign in again.')
      return
    }
    setPwdSending(true)
    try {
      const resp = await api.post('/auth/forgot-password', { email })
      if (resp.status >= 200 && resp.status < 300) {
        setPwdCodeSent(true)
        const data = resp.data as { message?: string; emailSent?: boolean }
        toast.success(data.message || 'If your account exists, a code was sent to your email.')
        if (data.emailSent === false) {
          toast('Email may not have been delivered — check server logs in development.', { icon: '⚠️' })
        }
      } else {
        toast.error((resp.data as { message?: string })?.message || 'Could not send code')
      }
    } catch {
      toast.error('Could not send verification code')
    } finally {
      setPwdSending(false)
    }
  }

  const submitPasswordChange = async () => {
    const email = profile?.email || readUserFromLocalStorage()?.email
    if (!email) {
      toast.error('No email on file')
      return
    }
    if (pwdNew.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    if (pwdNew !== pwdConfirm) {
      toast.error('Passwords do not match')
      return
    }
    if (pwdOtp.length !== 4 || !/^\d{4}$/.test(pwdOtp)) {
      toast.error('Enter the 4-digit code from your email')
      return
    }
    setPwdSaving(true)
    try {
      const resp = await api.post('/auth/reset-password', {
        email,
        otp: pwdOtp,
        newPassword: pwdNew,
      })
      if (resp.status >= 200 && resp.status < 300) {
        toast.success('Password updated. Use your new password next time you sign in.')
        setPwdNew('')
        setPwdConfirm('')
        setPwdOtp('')
        setPwdCodeSent(false)
      } else {
        toast.error((resp.data as { message?: string })?.message || 'Invalid code or request failed')
      }
    } catch {
      toast.error('Password update failed')
    } finally {
      setPwdSaving(false)
    }
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied to clipboard`)
  }

  const hasUnsavedChanges =
    settings != null &&
    whitelistInput !== (settings.whitelistedDomains?.join(', ') || '')

  const baselineCompanyName = (settings?.companyName ?? profile?.company?.companyName ?? '').trim()
  const baselineWebsite = (settings?.companyWebsiteUrl ?? '').trim()
  const companyDirty =
    draftCompanyName.trim() !== baselineCompanyName ||
    draftWebsiteUrl.trim() !== baselineWebsite

  const displayCompanyName = settings?.companyName ?? profile?.company?.companyName ?? draftCompanyName
  const displayCompanyId = settings?.companyId ?? profile?.company?.id ?? profile?.companyId ?? '—'
  const displayCompanyCode = settings?.companyCode ?? null
  const companyStatus = profile?.company?.status || '—'

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="text-center space-y-4">
          <div className="relative">
            <Loader size="lg" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Settings className="w-8 h-8 text-blue-500 animate-pulse" />
            </div>
          </div>
          <div>
            <p className="text-lg font-semibold text-gray-900">Loading settings</p>
            <p className="text-sm text-gray-500 mt-1">Fetching your profile and company configuration</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in pb-8">
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-2xl p-8 border border-indigo-100">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-200/30 to-purple-200/30 rounded-full blur-3xl -mr-32 -mt-32" />
        <div className="relative flex flex-col sm:flex-row sm:items-center gap-4 sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-white rounded-2xl shadow-lg border border-indigo-100">
              <Settings className="w-8 h-8 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-1">
                Settings
              </h1>
              <p className="text-gray-600">Profile, company details, security whitelist, and password</p>
            </div>
          </div>
          <Button type="button" variant="secondary" size="sm" onClick={() => loadAll()} className="shrink-0 gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>
      </div>

      {(profileLoadError || settingsLoadError) && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 flex flex-wrap items-center justify-between gap-3">
          <div>
            {profileLoadError && <p className="font-medium">Profile: {profileLoadError}</p>}
            {settingsLoadError && <p className="font-medium mt-1">Company settings: {settingsLoadError}</p>}
            <p className="text-xs text-amber-800/90 mt-1">You can retry or continue with data from your last sign-in where shown.</p>
          </div>
          <Button type="button" variant="secondary" size="sm" onClick={() => loadAll()}>
            Retry load
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Account profile */}
          <Card className="transform transition-all duration-300 hover:shadow-xl border-2 border-gray-100 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-slate-600 via-slate-700 to-slate-800 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16" />
              <div className="relative flex items-center gap-4">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl border border-white/30">
                  <UserRound className="w-6 h-6" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold text-white">Account profile</CardTitle>
                  <p className="text-sm text-white/90 mt-1">Signed-in user and role</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-8 pb-6">
              {profile ? (
                <div className="space-y-5">
                  <div>
                    <label className="flex text-sm font-semibold text-gray-700 mb-2 items-center gap-2">
                      <Mail className="w-4 h-4 text-slate-600" />
                      Email
                    </label>
                    <Input value={profile.email} readOnly className="bg-gray-50 border-gray-200 font-mono text-sm" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Role</label>
                      <Input value={profile.role} readOnly className="bg-gray-50 border-gray-200 capitalize" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Member since</label>
                      <Input
                        value={new Date(profile.createdAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                        readOnly
                        className="bg-gray-50 border-gray-200"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-600">Profile could not be loaded. Use Refresh or sign in again.</p>
              )}
            </CardContent>
          </Card>

          {/* Company */}
          <Card className="transform transition-all duration-300 hover:shadow-2xl border-2 border-gray-100 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16" />
              <div className="relative flex items-center gap-4">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl border border-white/30">
                  <Building2 className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-2xl font-bold text-white">Company</CardTitle>
                  <p className="text-sm text-white/90 mt-1">Display name and identifiers</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-8 pb-6 space-y-6">
              <div>
                <label className="flex text-sm font-bold text-gray-700 mb-2 items-center gap-2">
                  <Building2 className="w-4 h-4 text-indigo-600" />
                  Company name
                </label>
                <Input
                  value={draftCompanyName}
                  onChange={(e) => setDraftCompanyName(e.target.value)}
                  placeholder="Your company or brand name"
                  disabled={!profile && !settings}
                  className="border-2 border-gray-200"
                />
                <p className="text-xs text-gray-500 mt-1">Shown in the app header and on imports. Save to apply.</p>
              </div>

              <div>
                <label className="flex text-sm font-bold text-gray-700 mb-2 items-center gap-2">
                  <Globe className="w-4 h-4 text-indigo-600" />
                  Company website (optional)
                </label>
                <Input
                  value={draftWebsiteUrl}
                  onChange={(e) => setDraftWebsiteUrl(e.target.value)}
                  placeholder="https://www.example.com"
                  disabled={!settings && !profile}
                  className="border-2 border-gray-200 font-mono text-sm"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  type="button"
                  onClick={saveCompanyProfile}
                  loading={isSavingCompany}
                  disabled={!companyDirty || (!profile && !settings)}
                  variant="primary"
                  className="gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save company
                </Button>
                {!settings && profile && (
                  <span className="text-xs text-amber-700">
                    Company list failed to load; you can still save name and website if the API is reachable.
                  </span>
                )}
              </div>

              <div className="border-t border-gray-200 pt-6 space-y-5">
                <div>
                  <label className="flex text-sm font-bold text-gray-700 mb-2 items-center gap-2">
                    <Key className="w-4 h-4 text-indigo-600" />
                    Company code
                  </label>
                  <div className="relative">
                    <Input
                      value={displayCompanyCode || 'Not assigned'}
                      readOnly
                      className="bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-200 font-mono pr-20"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                      {displayCompanyCode ? (
                        <>
                          <Badge variant="success" className="shadow-sm">
                            Active
                          </Badge>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(displayCompanyCode, 'Company code')}
                            className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
                            title="Copy"
                          >
                            <Copy className="w-4 h-4 text-gray-600" />
                          </button>
                        </>
                      ) : (
                        <Badge variant="default" className="shadow-sm">
                          Not set
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="flex text-sm font-bold text-gray-700 mb-2 items-center gap-2">
                    <Lock className="w-4 h-4 text-indigo-600" />
                    Company ID
                  </label>
                  <div className="relative">
                    <Input
                      value={displayCompanyId}
                      readOnly
                      className="bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-200 font-mono text-sm pr-12"
                    />
                    {displayCompanyId !== '—' && (
                      <button
                        type="button"
                        onClick={() => copyToClipboard(displayCompanyId, 'Company ID')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
                        title="Copy"
                      >
                        <Copy className="w-4 h-4 text-gray-600" />
                      </button>
                    )}
                  </div>
                  <div className="flex items-start gap-2 mt-2 p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                    <Info className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-indigo-800">
                      <span className="font-semibold">Unique identifier</span> for API and integrations; it cannot be
                      changed.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Password */}
          <Card className="transform transition-all duration-300 hover:shadow-xl border-2 border-gray-100 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-rose-600 via-red-600 to-orange-600 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16" />
              <div className="relative flex items-center gap-4">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl border border-white/30">
                  <Lock className="w-6 h-6" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold text-white">Password</CardTitle>
                  <p className="text-sm text-white/90 mt-1">We email a one-time code to confirm it is you</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-8 pb-6 space-y-5">
              {!profile?.email && !readUserFromLocalStorage()?.email ? (
                <p className="text-sm text-gray-600">Load your profile to change password.</p>
              ) : (
                <>
                  <p className="text-sm text-gray-600">
                    Enter a new password, then request a <strong>4-digit code</strong> at{' '}
                    <span className="font-mono text-gray-800">{profile?.email || readUserFromLocalStorage()?.email}</span>.
                    The code expires in a few minutes (same flow as password reset).
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold text-gray-700 mb-1">New password</label>
                      <div className="relative">
                        <Input
                          type={pwdShowNew ? 'text' : 'password'}
                          value={pwdNew}
                          onChange={(e) => setPwdNew(e.target.value)}
                          autoComplete="new-password"
                          className="pr-10 border-gray-200"
                        />
                        <button
                          type="button"
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-800"
                          onClick={() => setPwdShowNew(!pwdShowNew)}
                          aria-label={pwdShowNew ? 'Hide password' : 'Show password'}
                        >
                          {pwdShowNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-700 mb-1">Confirm new password</label>
                      <Input
                        type={pwdShowNew ? 'text' : 'password'}
                        value={pwdConfirm}
                        onChange={(e) => setPwdConfirm(e.target.value)}
                        autoComplete="new-password"
                        className="border-gray-200"
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Button type="button" variant="secondary" onClick={sendPasswordCode} loading={pwdSending}>
                      Email me a code
                    </Button>
                    {pwdCodeSent && (
                      <Button type="button" variant="ghost" size="sm" onClick={sendPasswordCode} disabled={pwdSending}>
                        Resend code
                      </Button>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-1">Code from email</label>
                    <Input
                      value={pwdOtp}
                      onChange={(e) => setPwdOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      placeholder="0000"
                      inputMode="numeric"
                      maxLength={4}
                      className="max-w-[10rem] font-mono tracking-widest border-gray-200"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="primary"
                    onClick={submitPasswordChange}
                    loading={pwdSaving}
                    disabled={pwdNew.length < 6 || pwdOtp.length !== 4}
                  >
                    Update password
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Whitelist */}
          <Card className="transform transition-all duration-300 hover:shadow-2xl border-2 border-gray-100 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16" />
              <div className="relative flex items-center gap-4">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl border border-white/30">
                  <Shield className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-2xl font-bold text-white">Security whitelist</CardTitle>
                  <p className="text-sm text-white/90 mt-1">Allowed IPs and domains for endpoint access</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-8 pb-6">
              {!settings ? (
                <p className="text-sm text-gray-600 py-4">Whitelist is unavailable until company settings load.</p>
              ) : (
                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="flex text-sm font-bold text-gray-700 items-center gap-2">
                      <Globe className="w-4 h-4 text-blue-600" />
                      Whitelisted domains and IP addresses
                    </label>
                    <div className="relative">
                      <textarea
                        value={whitelistInput}
                        onChange={(e) => {
                          setWhitelistInput(e.target.value)
                        }}
                        placeholder="localhost, 127.0.0.1, *.example.com"
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
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Info className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1 space-y-2">
                          <p className="text-sm font-bold text-blue-900">Format</p>
                          <p className="text-xs text-blue-800">
                            Comma-separated IPs, hostnames, or patterns such as{' '}
                            <code className="bg-blue-100 px-1 rounded">*.example.com</code>.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200 flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <Button
                        onClick={saveWhitelist}
                        loading={isSaving}
                        variant="primary"
                        size="lg"
                        className="flex items-center gap-2 shadow-lg hover:shadow-xl"
                        disabled={!hasUnsavedChanges}
                      >
                        <Save className="w-5 h-5" />
                        {isSaving ? 'Saving…' : 'Save whitelist'}
                      </Button>
                      {hasUnsavedChanges && (
                        <Badge variant="warning" className="animate-pulse">
                          Pending
                        </Badge>
                      )}
                    </div>
                    {settings.whitelistedDomains && settings.whitelistedDomains.length > 0 && (
                      <div className="text-sm text-gray-600">
                        <span className="font-semibold text-gray-900">{settings.whitelistedDomains.length}</span>{' '}
                        entr{settings.whitelistedDomains.length !== 1 ? 'ies' : 'y'}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-100">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-bold text-gray-900">Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-white rounded-lg border border-indigo-200">
                <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Account status</div>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${companyStatus === 'ACTIVE' ? 'bg-green-500 animate-pulse' : 'bg-amber-500'}`}
                  />
                  <span className="text-sm font-bold text-gray-900 capitalize">{companyStatus}</span>
                </div>
              </div>
              <div className="p-4 bg-white rounded-lg border border-indigo-200">
                <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Company</div>
                <div className="text-sm font-semibold text-gray-900">{displayCompanyName || '—'}</div>
              </div>
              <div className="p-4 bg-white rounded-lg border border-indigo-200">
                <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Whitelist entries</div>
                <div className="text-2xl font-bold text-indigo-600">{settings?.whitelistedDomains?.length ?? '—'}</div>
              </div>
              <div className="p-4 bg-white rounded-lg border border-indigo-200">
                <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Company code</div>
                <div className="text-sm font-mono font-bold text-gray-900">{displayCompanyCode || 'Not assigned'}</div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-100">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Info className="w-5 h-5 text-blue-600" />
                Help
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-gray-700">
              <p className="leading-relaxed">
                The whitelist restricts which hosts may call your configured endpoints. Password changes always require a
                short code sent to your account email.
              </p>
              <div className="pt-3 border-t border-blue-200">
                <span className="flex items-center gap-2 text-blue-600 font-semibold text-sm">
                  <ExternalLink className="w-4 h-4" />
                  Documentation links can be added from your docs tab
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
