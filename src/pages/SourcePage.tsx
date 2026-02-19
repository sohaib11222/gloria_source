import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
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
import { PlanPicker } from '../components/PlanPicker'
import { BranchEditModal } from '../components/BranchEditModal'
import { LocationRequestForm } from '../components/LocationRequestForm'
import { LocationRequestList } from '../components/LocationRequestList'
import { AddLocationForm } from '../components/AddLocationForm'
import { AgreementDetailModal } from '../components/AgreementDetailModal'
import { MyAgreements } from '../components/MyAgreements'
import { SettingsPage } from './SettingsPage'
import { ErrorModal } from '../components/ErrorModal'
import { Sidebar } from '../components/layout/Sidebar'
import { Support } from '../components/Support'
import { Badge } from '../components/ui/Badge'
import toast from 'react-hot-toast'
import api from '../lib/api'
import { Branch } from '../api/branches'
import { subscriptionApi, transactionsApi, SourceTransaction, BranchQuotaExceededPayload } from '../api/subscription'
import { verificationApi, VerificationResult } from '../api/verification'
import { useQuery } from '@tanstack/react-query'
import { Bell } from 'lucide-react'
import { NotificationsDrawer } from '../components/NotificationsDrawer'
import { SourceHealth } from '../types/api'
import { Modal } from '../components/ui/Modal'
import { Input } from '../components/ui/Input'
import { useQueryClient } from '@tanstack/react-query'
import { Loader } from '../components/ui/Loader'
import { formatDate } from '../lib/utils'
import { AlertCircle, XCircle, CheckCircle2, ChevronDown, ChevronUp, FileText, Info, Receipt, RefreshCw, ExternalLink } from 'lucide-react'

// Location Import Result Display Component
const LocationImportResultDisplay: React.FC<{ result: any }> = ({ result }) => {
  const hasErrors = result.errors && result.errors.length > 0
  const hasPartialSuccess = (result.imported || 0) > 0 || (result.updated || 0) > 0
  const isCompleteSuccess = !hasErrors && hasPartialSuccess
  const isFormatError = result.error === 'INVALID_FORMAT' || result.error === 'INVALID_RESPONSE_FORMAT'
  const [showExample, setShowExample] = useState(isFormatError) // Show by default for format errors

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <Card className={`border-2 ${
        isCompleteSuccess 
          ? 'border-green-200 bg-green-50' 
          : hasPartialSuccess 
          ? 'border-yellow-200 bg-yellow-50' 
          : 'border-red-200 bg-red-50'
      }`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isCompleteSuccess ? (
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              ) : hasPartialSuccess ? (
                <AlertCircle className="w-5 h-5 text-yellow-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
              <CardTitle className={`text-lg font-bold ${
                isCompleteSuccess 
                  ? 'text-green-900' 
                  : hasPartialSuccess 
                  ? 'text-yellow-900' 
                  : 'text-red-900'
              }`}>
                Import Summary
              </CardTitle>
            </div>
            <div className="flex items-center gap-2">
              {(result.imported || 0) > 0 && (
                <Badge variant="success" className="font-semibold">
                  {result.imported} Imported
                </Badge>
              )}
              {(result.updated || 0) > 0 && (
                <Badge variant="info" className="font-semibold">
                  {result.updated} Updated
                </Badge>
              )}
              {(result.skipped || 0) > 0 && (
                <Badge variant="warning" className="font-semibold">
                  {result.skipped} Skipped
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className={`text-sm font-medium mb-3 ${
            isCompleteSuccess 
              ? 'text-green-800' 
              : hasPartialSuccess 
              ? 'text-yellow-800' 
              : 'text-red-800'
          }`}>
            {result.message || 'Import completed'}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white/70 rounded-lg p-3 border border-gray-200">
              <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                Total
              </div>
              <div className="text-lg font-bold text-gray-900">{result.total || 0}</div>
            </div>
            <div className="bg-white/70 rounded-lg p-3 border border-blue-200">
              <div className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1">
                Imported
              </div>
              <div className="text-lg font-bold text-blue-900">{result.imported || 0}</div>
            </div>
            <div className="bg-white/70 rounded-lg p-3 border border-purple-200">
              <div className="text-xs font-semibold text-purple-700 uppercase tracking-wide mb-1">
                Updated
              </div>
              <div className="text-lg font-bold text-purple-900">{result.updated || 0}</div>
            </div>
            <div className="bg-white/70 rounded-lg p-3 border border-orange-200">
              <div className="text-xs font-semibold text-orange-700 uppercase tracking-wide mb-1">
                Skipped
              </div>
              <div className="text-lg font-bold text-orange-900">{result.skipped || 0}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Format Error Display */}
      {isFormatError && result.details && (
        <Card className="border-2 border-red-200">
          <CardHeader className="bg-red-50 border-b border-red-200">
            <div className="flex items-center gap-3">
              <XCircle className="w-5 h-5 text-red-600" />
              <CardTitle className="text-lg font-bold text-red-900">
                Format Error
              </CardTitle>
            </div>
            <p className="text-sm text-red-700 mt-2">
              The endpoint response format is not recognized. Your endpoint must return location data in one of the supported formats below.
            </p>
            <p className="text-xs text-red-600 mt-1 font-semibold">
              ⚠️ Your endpoint must return an array of locations. The response should contain either:
            </p>
            <ul className="text-xs text-red-700 mt-2 space-y-1 list-disc list-inside ml-2">
              <li><code className="bg-red-100 px-1 rounded">{"{ Locations: [...] }"}</code> - JSON object with "Locations" key</li>
              <li><code className="bg-red-100 px-1 rounded">{"{ items: [...] }"}</code> - JSON object with "items" key</li>
              <li><code className="bg-red-100 px-1 rounded">[location1, location2, ...]</code> - Direct JSON array</li>
              <li><code className="bg-red-100 px-1 rounded">{"<Locations><Location>...</Location></Locations>"}</code> - XML format</li>
              <li><code className="bg-red-100 px-1 rounded">{"{ OTA_VehLocSearchRS: { VehMatchedLocs: [...] } }"}</code> - OTA format (same as branch import)</li>
              <li><code className="bg-red-100 px-1 rounded">PHP var_dump with OTA_VehLocSearchRS</code> - PHP var_dump format</li>
            </ul>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {/* Error Details */}
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm font-semibold text-red-900 mb-2">Error Details:</p>
                <p className="text-sm text-red-800">{result.message}</p>
                {result.details.receivedKeys && result.details.receivedKeys.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-semibold text-red-800 mb-1">Received keys in response:</p>
                    <div className="flex flex-wrap gap-2">
                      {result.details.receivedKeys.map((key: string, idx: number) => (
                        <code key={idx} className="px-2 py-1 bg-red-100 text-red-900 rounded text-xs font-mono">
                          {key}
                        </code>
                      ))}
                    </div>
                  </div>
                )}
                {result.details.dataPreview && (
                  <div className="mt-3">
                    <p className="text-xs font-semibold text-red-800 mb-1">Response preview:</p>
                    <pre className="text-xs bg-red-100 text-red-900 p-3 rounded overflow-x-auto max-h-40">
                      {result.details.dataPreview}
                    </pre>
                  </div>
                )}
              </div>

              {/* Expected Formats */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-semibold text-blue-900 mb-2">✅ Expected Formats:</p>
                {result.details.expectedFormats && (
                  <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside mb-3">
                    {result.details.expectedFormats.map((format: string, idx: number) => (
                      <li key={idx}>{format}</li>
                    ))}
                  </ul>
                )}
                {result.details.help && (
                  <p className="text-xs text-blue-700 italic">{result.details.help}</p>
                )}
              </div>

              {/* Example Format - Always visible for format errors, collapsible otherwise */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                {!isFormatError && (
                  <button
                    onClick={() => setShowExample(!showExample)}
                    className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-gray-600" />
                      <span className="text-sm font-semibold text-gray-800">
                        📋 Example Location Data Format
                      </span>
                    </div>
                    {showExample ? (
                      <ChevronUp className="w-4 h-4 text-gray-600" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-600" />
                    )}
                  </button>
                )}
                {isFormatError && (
                  <div className="p-3 bg-yellow-50 border-b border-yellow-200">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-yellow-600" />
                      <span className="text-sm font-semibold text-yellow-900">
                        📋 Sample Location Data Format (How your data should look)
                      </span>
                    </div>
                  </div>
                )}
                
                {(showExample || isFormatError) && (
                  <div className="p-4 bg-white space-y-4 border-t border-gray-200">
                    <div>
                      <p className="text-xs text-gray-700 font-semibold mb-2">✅ JSON Format (Recommended):</p>
                      <pre className="text-xs bg-gray-900 text-gray-100 p-3 rounded overflow-x-auto max-h-96">
{`{
  "Locations": [
    {
      "unlocode": "GBMAN",
      "country": "GB",
      "place": "Manchester",
      "iataCode": "MAN",
      "latitude": 53.3656,
      "longitude": -2.2729
    },
    {
      "unlocode": "GBLON",
      "country": "GB",
      "place": "London",
      "iataCode": "LHR",
      "latitude": 51.5074,
      "longitude": -0.1278
    }
  ]
}

// OR alternative JSON format:
{
  "items": [
    {
      "unlocode": "GBMAN",
      "country": "GB",
      "place": "Manchester",
      "iataCode": "MAN",
      "latitude": 53.3656,
      "longitude": -2.2729
    }
  ]
}

// OR simple array:
[
  {
    "unlocode": "GBMAN",
    "country": "GB",
    "place": "Manchester",
    "iataCode": "MAN",
    "latitude": 53.3656,
    "longitude": -2.2729
  }
]`}
                      </pre>
                    </div>
                    
                    <div>
                      <p className="text-xs text-gray-700 font-semibold mb-2">✅ XML Format (Also Supported):</p>
                      <pre className="text-xs bg-gray-900 text-gray-100 p-3 rounded overflow-x-auto max-h-96">
{`<?xml version="1.0" encoding="UTF-8"?>
<Locations>
  <Location>
    <unlocode>GBMAN</unlocode>
    <country>GB</country>
    <place>Manchester</place>
    <iataCode>MAN</iataCode>
    <latitude>53.3656</latitude>
    <longitude>-2.2729</longitude>
  </Location>
  <Location>
    <unlocode>GBLON</unlocode>
    <country>GB</country>
    <place>London</place>
    <iataCode>LHR</iataCode>
    <latitude>51.5074</latitude>
    <longitude>-0.1278</longitude>
  </Location>
</Locations>

// OR OTA_VehLocSearchRS format (same as branch import):
{
  "OTA_VehLocSearchRS": {
    "VehMatchedLocs": [
      {
        "VehMatchedLoc": {
          "LocationDetail": {
            "attr": {
              "Code": "DXBA02",
              "Name": "Dubai Airport",
              "Latitude": "25.228005",
              "Longitude": "55.364241"
            },
            "Address": {
              "CountryName": {
                "attr": {
                  "Code": "AE"
                }
              }
            },
            "NatoLocode": "AEDXB"  // Optional: explicit UN/LOCODE
          }
        }
      }
    ]
  }
}`}
                      </pre>
                    </div>
                    
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-xs text-blue-900 font-semibold mb-2">📝 Required Fields:</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <div className="text-xs text-blue-800">
                            <code className="bg-blue-100 px-1.5 py-0.5 rounded font-mono">unlocode</code> (required) - UN/LOCODE identifier (e.g., "GBMAN")
                          </div>
                          <div className="text-xs text-blue-800">
                            <code className="bg-blue-100 px-1.5 py-0.5 rounded font-mono">country</code> (optional) - 2-letter country code (e.g., "GB")
                          </div>
                          <div className="text-xs text-blue-800">
                            <code className="bg-blue-100 px-1.5 py-0.5 rounded font-mono">place</code> (optional) - Location name (e.g., "Manchester")
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-xs text-blue-800">
                            <code className="bg-blue-100 px-1.5 py-0.5 rounded font-mono">iataCode</code> (optional) - IATA airport code (e.g., "MAN")
                          </div>
                          <div className="text-xs text-blue-800">
                            <code className="bg-blue-100 px-1.5 py-0.5 rounded font-mono">latitude</code> (optional) - Decimal degrees
                          </div>
                          <div className="text-xs text-blue-800">
                            <code className="bg-blue-100 px-1.5 py-0.5 rounded font-mono">longitude</code> (optional) - Decimal degrees
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-blue-700 mt-2 italic">
                        Note: Only <code className="bg-blue-100 px-1 rounded">unlocode</code> is required. Other fields are optional but recommended.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Validation Errors Table */}
      {hasErrors && !isFormatError && (
        <Card className="border-2 border-red-200">
          <CardHeader className="bg-red-50 border-b border-red-200">
            <div className="flex items-center gap-3">
              <XCircle className="w-5 h-5 text-red-600" />
              <CardTitle className="text-lg font-bold text-red-900">
                Validation Errors ({result.errors.length})
              </CardTitle>
            </div>
            <p className="text-sm text-red-700 mt-2">
              The following locations could not be imported due to validation errors. Please fix the issues and try again.
            </p>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Index</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">UN/LOCODE</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Error</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {result.errors.map((error: any, idx: number) => (
                    <tr key={idx} className="hover:bg-red-50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{error.index + 1}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <code className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-mono">
                          {error.unlocode || 'N/A'}
                        </code>
                      </td>
                      <td className="px-4 py-3 text-sm text-red-700">{error.error}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Availability Fetch Result Display (Pricing tab) — shows car cards with full OTA data
const PAGE_SIZE = 6

// Card for a single stored availability sample (in the "Stored samples" list)
const StoredSampleCard: React.FC<{ sample: import('../api/endpoints').StoredAvailabilitySample }> = ({ sample }) => {
  const [expanded, setExpanded] = useState(false)
  const [page, setPage] = useState(0)
  const [expandedCard, setExpandedCard] = useState<number | null>(null)

  const offers: any[] = sample.offersSummary ?? []
  const totalPages = Math.max(1, Math.ceil(offers.length / PAGE_SIZE))
  const pageOffers = offers.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  const pickupDate = sample.pickupIso?.slice(0, 16).replace('T', ' ') ?? '—'
  const returnDate = sample.returnIso?.slice(0, 16).replace('T', ' ') ?? '—'
  const fetchedDate = sample.fetchedAt ? new Date(sample.fetchedAt).toLocaleString() : '—'

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
      {/* Sample header */}
      <button
        type="button"
        onClick={() => { setExpanded(e => !e); setPage(0); setExpandedCard(null) }}
        className="w-full flex items-start justify-between gap-4 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
      >
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-sm text-gray-900">
              {sample.pickupLoc || '—'} → {sample.returnLoc || '—'}
            </span>
            <Badge variant="secondary" className="text-xs">{sample.offersCount} vehicle{sample.offersCount !== 1 ? 's' : ''}</Badge>
            {(() => {
              const fmt = (sample as any).adapterType || sample.criteria?.adapterType || 'xml'
              const colors: Record<string, string> = { xml: 'bg-orange-100 text-orange-700', json: 'bg-green-100 text-green-700', grpc: 'bg-purple-100 text-purple-700' }
              const labels: Record<string, string> = { xml: 'OTA XML', json: 'Gloria JSON', grpc: 'Gloria gRPC' }
              return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors[fmt] || colors.xml}`}>{labels[fmt] || fmt.toUpperCase()}</span>
            })()}
            {sample.criteria?.requestorId && (
              <span className="text-xs text-gray-400">ID: {sample.criteria.requestorId}</span>
            )}
          </div>
          <div className="text-xs text-gray-500 mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5">
            <span>Pick-up: {pickupDate}</span>
            <span>Return: {returnDate}</span>
            <span className="text-gray-400">Fetched: {fetchedDate}</span>
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>

      {/* Expanded vehicle list */}
      {expanded && (
        <div className="border-t border-gray-100 px-4 py-3 space-y-3">
          {offers.length === 0 ? (
            <p className="text-sm text-gray-400 italic">No vehicle data stored for this sample (fetched before full data storage was enabled — re-fetch to update).</p>
          ) : (
            <>
              {/* Pagination header */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500">{offers.length} vehicles — page {page + 1} of {totalPages}</p>
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={() => { setPage(p => Math.max(0, p - 1)); setExpandedCard(null) }} disabled={page === 0}
                      className="px-2 py-1 text-xs rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-50">‹</button>
                    <span className="text-xs text-gray-500 px-1">{page + 1}/{totalPages}</span>
                    <button type="button" onClick={() => { setPage(p => Math.min(totalPages - 1, p + 1)); setExpandedCard(null) }} disabled={page >= totalPages - 1}
                      className="px-2 py-1 text-xs rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-50">›</button>
                  </div>
                </div>
              )}

              {/* Vehicle cards */}
              {pageOffers.map((offer: any, idx: number) => {
                const globalIdx = page * PAGE_SIZE + idx
                return (
                  <div key={globalIdx} className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="flex gap-3 p-3">
                      {offer.picture_url ? (
                        <img src={offer.picture_url} alt={offer.vehicle_make_model || 'Vehicle'}
                          className="w-24 h-16 object-contain flex-shrink-0 rounded bg-gray-50 border border-gray-100"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                      ) : (
                        <div className="w-24 h-16 flex-shrink-0 rounded bg-gray-100 flex items-center justify-center">
                          <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l2 .001M1 16h2m16 0h2M13 8h4l3 5-3 .001M13 8v8" />
                          </svg>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold text-sm text-gray-900 leading-tight">{offer.vehicle_make_model || '—'}</p>
                            <div className="flex flex-wrap gap-x-2 gap-y-0.5 mt-0.5">
                              {offer.vehicle_class && <span className="text-xs font-mono bg-gray-100 text-gray-600 px-1 rounded">{offer.vehicle_class}</span>}
                              {offer.transmission_type && <span className="text-xs text-gray-500">{offer.transmission_type}</span>}
                              {offer.door_count && <span className="text-xs text-gray-500">{offer.door_count} doors</span>}
                              {offer.baggage && <span className="text-xs text-gray-500">{offer.baggage} bags</span>}
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="font-bold text-emerald-700 text-base">
                              {offer.total_price ? `${offer.currency || ''} ${Number(offer.total_price).toFixed(2)}` : '—'}
                            </p>
                            <Badge variant={offer.availability_status === 'Available' ? 'success' : 'default'} className="text-xs mt-0.5">
                              {offer.availability_status || 'Available'}
                            </Badge>
                          </div>
                        </div>
                        {/* Included chips */}
                        {(offer.included?.filter((t: any) => t.header || t.code).length ?? 0) > 0 && (
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {offer.included.filter((t: any) => t.header || t.code).slice(0, 4).map((t: any, i: number) => (
                              <span key={i} className="text-xs bg-green-50 text-green-700 border border-green-200 rounded px-1.5 py-0.5">✓ {t.header || t.code}</span>
                            ))}
                            {offer.included.filter((t: any) => t.header || t.code).length > 4 && (
                              <span className="text-xs text-gray-400">+{offer.included.filter((t: any) => t.header || t.code).length - 4} more</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Expand detail */}
                    <button type="button" onClick={() => setExpandedCard(expandedCard === globalIdx ? null : globalIdx)}
                      className="w-full flex items-center justify-between px-3 py-1.5 bg-gray-50 border-t border-gray-100 text-xs text-gray-500 hover:bg-gray-100 transition-colors">
                      <span>{expandedCard === globalIdx ? 'Hide details' : 'Details (terms, VehID)'}</span>
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expandedCard === globalIdx ? 'rotate-180' : ''}`} />
                    </button>
                    {expandedCard === globalIdx && (
                      <div className="px-3 pb-3 pt-2 bg-gray-50 border-t border-gray-100 space-y-2 text-xs">
                        {offer.veh_id && (
                          <p><span className="text-gray-500">VehID:</span> <code className="bg-white border border-gray-200 px-1.5 py-0.5 rounded font-mono">{offer.veh_id}</code></p>
                        )}
                        {(offer.included?.filter((t: any) => t.header || t.code).length ?? 0) > 0 && (
                          <div>
                            <p className="font-semibold text-green-700 mb-1">Included</p>
                            {offer.included.map((t: any, i: number) => (
                              <p key={i} className="text-gray-700">✓ <strong>{t.header || t.code}</strong>{t.excess && t.excess !== '0.00' ? ` (excess ${t.excess})` : ''}</p>
                            ))}
                          </div>
                        )}
                        {(offer.not_included?.filter((t: any) => t.header || t.code).length ?? 0) > 0 && (
                          <div>
                            <p className="font-semibold text-blue-700 mb-1">Optional extras</p>
                            {offer.not_included.map((t: any, i: number) => (
                              <p key={i} className="text-gray-600">+ <strong>{t.header || t.code}</strong>{t.price && t.price !== '0.00' ? ` — ${t.price} ${offer.currency}` : ''}</p>
                            ))}
                          </div>
                        )}
                        {(offer.priced_equips?.length ?? 0) > 0 && (
                          <div>
                            <p className="font-semibold text-purple-700 mb-1">Equipment add-ons</p>
                            {offer.priced_equips.map((eq: any, i: number) => (
                              <p key={i} className="text-gray-600">• {eq.description || eq.equip_type || '—'}{eq.charge?.Amount ? ` — ${offer.currency} ${Number(eq.charge.Amount).toFixed(2)}` : ''}</p>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}

              {/* Bottom pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-1 pt-1">
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button key={i} type="button" onClick={() => { setPage(i); setExpandedCard(null) }}
                      className={`px-2.5 py-1 text-xs rounded border transition-colors ${i === page ? 'border-blue-500 bg-blue-50 text-blue-700 font-semibold' : 'border-gray-300 hover:bg-gray-50'}`}>
                      {i + 1}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

const AvailabilityFetchResultDisplay: React.FC<{ result: any }> = ({ result }) => {
  const isError = !!result.error
  const isDuplicate = !result.error && result.stored === false && result.duplicate === true
  const isStored = !result.error && result.stored === true
  const isFormatError = result.error === 'INVALID_FORMAT' || result.error === 'INVALID_RESPONSE_FORMAT'
  const [showSample, setShowSample] = useState(isFormatError)
  const [expandedCard, setExpandedCard] = useState<number | null>(null)
  const [page, setPage] = useState(0)

  const allOffers: any[] = result.offersSummary ?? []
  const totalPages = Math.max(1, Math.ceil(allOffers.length / PAGE_SIZE))
  const pageOffers = allOffers.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  return (
    <div className="space-y-4">
      {/* Status banner */}
      <Card className={`border-2 ${
        isError ? 'border-red-200 bg-red-50' :
        isDuplicate ? 'border-amber-200 bg-amber-50' :
        'border-green-200 bg-green-50'
      }`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isError ? (
                <XCircle className="w-5 h-5 text-red-600" />
              ) : isDuplicate ? (
                <Info className="w-5 h-5 text-amber-600" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              )}
              <CardTitle className={`text-lg font-bold ${
                isError ? 'text-red-900' : isDuplicate ? 'text-amber-900' : 'text-green-900'
              }`}>
                {isError ? 'Fetch Failed' : isDuplicate ? 'Duplicate — Not Stored' : 'Fetch & Store Summary'}
              </CardTitle>
            </div>
            {!isError && (result.offersCount ?? 0) >= 0 && (
              <Badge variant={isDuplicate ? 'secondary' : 'success'} className="font-semibold">
                {result.offersCount} vehicle{result.offersCount !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <p className={`text-sm font-medium ${
            isError ? 'text-red-800' : isDuplicate ? 'text-amber-800' : 'text-green-800'
          }`}>
            {result.message}
          </p>
          {isStored && (
            <p className="text-xs text-green-700 mt-1">
              {result.isNew ? 'New availability sample stored in database.' : 'Existing sample updated with new data.'}
            </p>
          )}
          {isDuplicate && (
            <p className="text-xs text-amber-700 mt-1">
              Same data already stored for this criteria; no duplicate was saved.
            </p>
          )}
          {result.criteria && (
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
              <span><strong>Pick-up:</strong> {result.criteria.pickupLoc} {result.criteria.pickupIso?.slice(0, 16)}</span>
              <span><strong>Return:</strong> {result.criteria.returnLoc} {result.criteria.returnIso?.slice(0, 16)}</span>
              {result.criteria.requestorId && <span><strong>Requestor ID:</strong> {result.criteria.requestorId}</span>}
              {result.criteria.driverAge && <span><strong>Driver age:</strong> {result.criteria.driverAge}</span>}
              {result.criteria.citizenCountry && <span><strong>Country:</strong> {result.criteria.citizenCountry}</span>}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Vehicle results cards */}
      {!isError && allOffers.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-700">
              {allOffers.length} vehicle{allOffers.length !== 1 ? 's' : ''} available
              {totalPages > 1 && (
                <span className="font-normal text-gray-500 ml-1">(page {page + 1} of {totalPages})</span>
              )}
            </p>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => { setPage(p => Math.max(0, p - 1)); setExpandedCard(null) }}
                  disabled={page === 0}
                  className="px-2 py-1 text-xs rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-50 transition-colors"
                >
                  ‹ Prev
                </button>
                <span className="text-xs text-gray-500">{page + 1} / {totalPages}</span>
                <button
                  type="button"
                  onClick={() => { setPage(p => Math.min(totalPages - 1, p + 1)); setExpandedCard(null) }}
                  disabled={page >= totalPages - 1}
                  className="px-2 py-1 text-xs rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-50 transition-colors"
                >
                  Next ›
                </button>
              </div>
            )}
          </div>
          {pageOffers.map((offer: any, idx: number) => {
            const globalIdx = page * PAGE_SIZE + idx
            return (
              <div key={globalIdx} className="border border-gray-200 rounded-xl shadow-sm bg-white overflow-hidden">
                <div className="flex gap-4 p-4">
                  {/* Car image */}
                  {offer.picture_url ? (
                    <img
                      src={offer.picture_url}
                      alt={offer.vehicle_make_model || 'Vehicle'}
                      className="w-32 h-20 object-contain flex-shrink-0 rounded-lg bg-gray-50 border border-gray-100"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                    />
                  ) : (
                    <div className="w-32 h-20 flex-shrink-0 rounded-lg bg-gray-100 flex items-center justify-center">
                      <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                  )}

                  {/* Car details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div>
                        <h3 className="font-bold text-gray-900 text-base leading-tight">{offer.vehicle_make_model || '—'}</h3>
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                          {offer.vehicle_class && (
                            <span className="text-xs text-gray-500 font-mono bg-gray-100 px-1.5 py-0.5 rounded">{offer.vehicle_class}</span>
                          )}
                          {offer.vehicle_category && (
                            <span className="text-xs text-gray-500">Cat {offer.vehicle_category}</span>
                          )}
                          {offer.transmission_type && (
                            <span className="text-xs text-gray-600">{offer.transmission_type}</span>
                          )}
                          {offer.air_condition_ind && (
                            <span className="text-xs text-gray-600">A/C: {offer.air_condition_ind}</span>
                          )}
                          {offer.door_count && (
                            <span className="text-xs text-gray-600">{offer.door_count} doors</span>
                          )}
                          {offer.baggage && (
                            <span className="text-xs text-gray-600">{offer.baggage} bags</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-xl font-bold text-emerald-700">
                          {offer.total_price ? `${offer.currency || ''} ${Number(offer.total_price).toFixed(2)}` : '—'}
                        </div>
                        <div className="text-xs text-gray-500">total incl. tax</div>
                        <Badge variant={offer.availability_status === 'Available' ? 'success' : 'default'} className="mt-1 text-xs">
                          {offer.availability_status || 'Available'}
                        </Badge>
                      </div>
                    </div>

                    {/* Included terms (brief chips) */}
                    {(offer.included?.filter((t: any) => t.header || t.code).length ?? 0) > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {(offer.included ?? []).filter((t: any) => t.header || t.code).slice(0, 5).map((t: any, i: number) => (
                          <span key={i} className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-700 border border-green-200 rounded px-2 py-0.5">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                            {t.header || t.code}
                          </span>
                        ))}
                        {(offer.included?.filter((t: any) => t.header || t.code).length ?? 0) > 5 && (
                          <span className="text-xs text-gray-500">+{offer.included.filter((t: any) => t.header || t.code).length - 5} more</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Expand/collapse for full details */}
                <button
                  type="button"
                  onClick={() => setExpandedCard(expandedCard === globalIdx ? null : globalIdx)}
                  className="w-full flex items-center justify-between px-4 py-2 bg-gray-50 border-t border-gray-100 text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <span>{expandedCard === globalIdx ? 'Hide details' : 'Show full details (terms, extras, VehID)'}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${expandedCard === globalIdx ? 'rotate-180' : ''}`} />
                </button>

                {expandedCard === globalIdx && (
                  <div className="px-4 pb-4 pt-3 border-t border-gray-100 space-y-4 bg-gray-50">
                    {/* VehID */}
                    {offer.veh_id && (
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-gray-500 font-medium">VehID:</span>
                        <code className="bg-white border border-gray-200 px-2 py-0.5 rounded font-mono text-gray-800">{offer.veh_id}</code>
                        <span className="text-gray-400">(booking reference)</span>
                      </div>
                    )}

                    {/* Included terms */}
                    {(offer.included?.filter((t: any) => t.header || t.code).length ?? 0) > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-green-700 mb-1.5">Included in price</p>
                        <div className="space-y-1">
                          {(offer.included ?? []).map((t: any, i: number) => (
                            <div key={i} className="flex items-start gap-2 text-xs">
                              <svg className="w-3.5 h-3.5 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                              <div>
                                <span className="font-medium text-gray-800">{t.header || t.code}</span>
                                {t.excess && t.excess !== '0.00' && <span className="text-gray-500 ml-1">(excess: {t.excess})</span>}
                                {t.details && t.details !== t.header && <p className="text-gray-500 mt-0.5">{t.details}</p>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Optional extras */}
                    {(offer.not_included?.filter((t: any) => t.header || t.code).length ?? 0) > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-blue-700 mb-1.5">Optional extras (available at desk)</p>
                        <div className="space-y-1.5">
                          {(offer.not_included ?? []).map((t: any, i: number) => (
                            <div key={i} className="flex items-start gap-2 text-xs bg-blue-50 border border-blue-100 rounded p-2">
                              <svg className="w-3.5 h-3.5 text-blue-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                              <div className="flex-1">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-medium text-gray-800">{t.header || t.code}</span>
                                  {t.price && t.price !== '0.00' && (
                                    <span className="text-blue-700 font-semibold">{t.price} {offer.currency}/rental</span>
                                  )}
                                </div>
                                {t.excess && t.excess !== '0.00' && <span className="text-gray-500">Excess: {t.excess}</span>}
                                {t.details && t.details !== t.header && <p className="text-gray-500 mt-0.5 leading-relaxed">{t.details}</p>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Priced equipment */}
                    {(offer.priced_equips?.length ?? 0) > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-purple-700 mb-1.5">Equipment add-ons</p>
                        <div className="grid grid-cols-2 gap-2">
                          {(offer.priced_equips ?? []).map((eq: any, i: number) => (
                            <div key={i} className="text-xs bg-purple-50 border border-purple-100 rounded p-2">
                              <div className="font-medium text-gray-800">{eq.description || eq.equip_type || eq.vendor_equip_id || '—'}</div>
                              <div className="text-purple-700 font-semibold">
                                {eq.charge?.Amount ? `${offer.currency || ''} ${Number(eq.charge.Amount).toFixed(2)}/rental` : ''}
                                {eq.charge?.UnitCharge && eq.charge?.UnitName ? ` (${eq.charge.UnitCharge}/${eq.charge.UnitName})` : ''}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}

          {/* Bottom pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => { setPage(p => Math.max(0, p - 1)); setExpandedCard(null) }}
                disabled={page === 0}
                className="px-3 py-1.5 text-sm rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-50 transition-colors"
              >
                ‹ Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => { setPage(i); setExpandedCard(null) }}
                  className={`px-3 py-1.5 text-sm rounded border transition-colors ${i === page ? 'border-blue-500 bg-blue-50 text-blue-700 font-semibold' : 'border-gray-300 hover:bg-gray-50'}`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                type="button"
                onClick={() => { setPage(p => Math.min(totalPages - 1, p + 1)); setExpandedCard(null) }}
                disabled={page >= totalPages - 1}
                className="px-3 py-1.5 text-sm rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-50 transition-colors"
              >
                Next ›
              </button>
            </div>
          )}
        </div>
      )}

      {/* Raw XML response debug section — always shown when present */}
      {(result.rawResponsePreview || result.parsedPreview) && (
        <details className="border border-gray-200 rounded-lg bg-gray-50">
          <summary className="px-4 py-2.5 text-xs font-semibold text-gray-600 cursor-pointer select-none hover:bg-gray-100 rounded-lg flex items-center gap-2">
            <svg className="w-3.5 h-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
            Debug: raw endpoint response &amp; parsed XML structure
          </summary>
          <div className="p-4 space-y-3">
            {result.parsedPreview && (
              <div>
                <p className="text-xs font-semibold text-gray-700 mb-1">Parsed XML structure (first VehAvailCore):</p>
                <pre className="text-xs font-mono bg-white border border-gray-200 rounded p-3 overflow-x-auto max-h-48 text-gray-800">
                  {JSON.stringify(result.parsedPreview, null, 2)}
                </pre>
              </div>
            )}
            {result.rawResponsePreview && (
              <div>
                <p className="text-xs font-semibold text-gray-700 mb-1">Raw endpoint response (first 3000 chars):</p>
                <pre className="text-xs font-mono bg-white border border-gray-200 rounded p-3 overflow-x-auto max-h-64 text-gray-800">
                  {result.rawResponsePreview}
                </pre>
              </div>
            )}
          </div>
        </details>
      )}

      {isFormatError && result.details && (
        <Card className="border-2 border-red-200">
          <CardHeader className="bg-red-50 border-b border-red-200">
            <div className="flex items-center gap-3">
              <XCircle className="w-5 h-5 text-red-600" />
              <CardTitle className="text-lg font-bold text-red-900">Format Error</CardTitle>
            </div>
            <p className="text-sm text-red-700 mt-2">
              The endpoint response format is not recognized. The endpoint should return OTA_VehAvailRateRS XML in response to an OTA_VehAvailRateRQ XML POST.
            </p>
            <p className="text-xs text-red-600 mt-1 font-semibold">
              Response must contain <code className="bg-red-100 px-1 rounded">VehAvailRSCore</code> and <code className="bg-red-100 px-1 rounded">VehVendorAvails</code>.
            </p>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {result.details.dataPreview && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm font-semibold text-red-900 mb-2">Response preview:</p>
                  <pre className="text-xs bg-red-100 text-red-900 p-3 rounded overflow-x-auto max-h-40">
                    {result.details.dataPreview}
                  </pre>
                </div>
              )}
              {result.details.expectedFormats && result.details.expectedFormats.length > 0 && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm font-semibold text-blue-900 mb-2">Expected formats:</p>
                  <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
                    {result.details.expectedFormats.map((format: string, idx: number) => (
                      <li key={idx}>{format}</li>
                    ))}
                  </ul>
                  {result.details.help && (
                    <p className="text-xs text-blue-700 mt-2 italic">{result.details.help}</p>
                  )}
                </div>
              )}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowSample(!showSample)}
                  className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-semibold text-gray-800">
                      Sample OTA VehAvailRSCore format (how your data should look)
                    </span>
                  </div>
                  {showSample ? <ChevronUp className="w-4 h-4 text-gray-600" /> : <ChevronDown className="w-4 h-4 text-gray-600" />}
                </button>
                {showSample && (
                  <div className="p-4 bg-white border-t border-gray-200">
                    <p className="text-xs text-gray-700 font-semibold mb-2">JSON root structure:</p>
                    <pre className="text-xs bg-gray-900 text-gray-100 p-3 rounded overflow-x-auto max-h-80">{`{
  "@attributes": { "TimeStamp", "Target", "Version", "CDCode" },
  "Success": [],
  "VehAvailRSCore": {
    "VehRentalCore": {
      "@attributes": { "PickUpDateTime", "ReturnDateTime" },
      "PickUpLocation": { "@attributes": { "LocationCode", "Locationname", ... } },
      "ReturnLocation": { "@attributes": { "LocationCode", "Locationname", ... } }
    },
    "VehVendorAvails": {
      "VehVendorAvail": {
        "VehAvails": {
          "VehAvail": [
            {
              "VehAvailCore": { "@attributes": { "Status", "RStatus", "VehID" } },
              "Vehicle": { "VehMakeModel", "VehType", "VehClass", "VehTerms" },
              "RentalRate": { ... },
              "VehicleCharges": { "VehicleCharge": [...], "TotalCharge": { "@attributes": { "RateTotalAmount", "CurrencyCode" } } },
              "PricedEquips": [ ... ]
            }
          ]
        }
      }
    }
  }
}`}</pre>
                    <p className="text-xs text-gray-600 mt-2">
                      PHP <code className="bg-gray-100 px-1 rounded">var_dump()</code> of the same structure is also parsed automatically.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

const STATUS_VARIANTS: Record<string, 'success' | 'warning' | 'default'> = {
  paid: 'success',
  open: 'warning',
  draft: 'default',
  uncollectible: 'default',
  void: 'default',
}

function formatAmount(cents: number, currency: string): string {
  const code = currency.toUpperCase() === 'EUR' ? 'EUR' : currency
  return new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency: code,
    minimumFractionDigits: 2,
  }).format(cents / 100)
}

function SourceTransactionsTab() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['source', 'transactions'],
    queryFn: () => transactionsApi.getMyTransactions(),
  })
  const items: SourceTransaction[] = data?.items ?? []

  return (
    <>
      <div className="mb-8">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl shadow-sm">
              <Receipt className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                My Transactions
              </h1>
              <p className="mt-2 text-gray-600 font-medium">View your billing history and invoices</p>
            </div>
          </div>
          <Button variant="secondary" size="sm" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <Card className="border border-gray-200 shadow-sm">
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="py-12 flex justify-center">
              <Loader size="lg" />
            </div>
          ) : error ? (
            <p className="text-red-600 py-4">Failed to load transactions. Please try again.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Date</th>
                    <th className="text-left py-2">Plan</th>
                    <th className="text-left py-2">Status</th>
                    <th className="text-right py-2">Amount</th>
                    <th className="text-right py-2">Period</th>
                    <th className="text-right py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((t) => (
                    <tr key={t.id} className="border-b border-gray-100">
                      <td className="py-2 text-gray-700">
                        {t.createdAt ? formatDate(t.createdAt) : '—'}
                      </td>
                      <td className="py-2">{t.planName ?? '—'}</td>
                      <td className="py-2">
                        <Badge variant={STATUS_VARIANTS[t.status] ?? 'default'}>
                          {t.status}
                        </Badge>
                      </td>
                      <td className="py-2 text-right font-medium">
                        {formatAmount(t.amountPaid || t.amountDue, t.currency)}
                      </td>
                      <td className="py-2 text-right text-gray-600">
                        {t.periodStart && t.periodEnd
                          ? `${formatDate(t.periodStart).split(' ')[0]} – ${formatDate(t.periodEnd).split(' ')[0]}`
                          : '—'}
                      </td>
                      <td className="py-2 text-right">
                        {t.hostedInvoiceUrl && (
                          <a
                            href={t.hostedInvoiceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                          >
                            <ExternalLink className="w-4 h-4" />
                            View
                          </a>
                        )}
                        {t.invoicePdf && (
                          <a
                            href={t.invoicePdf}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-gray-600 hover:underline ml-2"
                          >
                            <FileText className="w-4 h-4" />
                            PDF
                          </a>
                        )}
                        {!t.hostedInvoiceUrl && !t.invoicePdf && '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {items.length === 0 && (
                <p className="text-gray-500 py-4">
                  No transactions yet. Transactions appear when you pay for a plan via Stripe.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  )
}

export default function SourcePage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [user, setUser] = useState<any>(null)
  
  // Get active tab from URL or default to dashboard
  const tabFromUrl = searchParams.get('tab') as 'dashboard' | 'agreements' | 'locations' | 'branches' | 'location-branches' | 'pricing' | 'transactions' | 'location-requests' | 'health' | 'verification' | 'support' | 'docs' | 'settings' | null
  const [activeTab, setActiveTab] = useState<'dashboard' | 'agreements' | 'locations' | 'branches' | 'location-branches' | 'pricing' | 'transactions' | 'location-requests' | 'health' | 'verification' | 'support' | 'docs' | 'settings'>(
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

  // Branch quota exceeded modal (402): add more branches then retry import
  const [quotaModal, setQuotaModal] = useState<{
    payload: BranchQuotaExceededPayload
    retry: () => Promise<void>
  } | null>(null)
  const [isAddingBranches, setIsAddingBranches] = useState(false)
  
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
  const handleTabChange = (tab: 'dashboard' | 'agreements' | 'locations' | 'branches' | 'location-branches' | 'pricing' | 'location-requests' | 'health' | 'verification' | 'support' | 'docs' | 'settings') => {
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
    if (tab && ['dashboard', 'agreements', 'locations', 'branches', 'location-branches', 'pricing', 'location-requests', 'health', 'verification', 'support', 'docs', 'settings'].includes(tab)) {
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

  // Auto-load stored availability samples whenever the pricing tab becomes active
  useEffect(() => {
    if (activeTab === 'pricing') {
      loadStoredSamples()
    }
  }, [activeTab])

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
  const [isImportingLocations, setIsImportingLocations] = useState(false)
  const [isLocationEndpointConfigOpen, setIsLocationEndpointConfigOpen] = useState(false)
  const [locationEndpointUrl, setLocationEndpointUrl] = useState('')
  const [isSavingLocationEndpoint, setIsSavingLocationEndpoint] = useState(false)
  const [isValidatingLocationEndpoint, setIsValidatingLocationEndpoint] = useState(false)
  const [showLocationImportResult, setShowLocationImportResult] = useState(false)
  const [locationImportResult, setLocationImportResult] = useState<any>(null)
  const [locationConfigTab, setLocationConfigTab] = useState<'settings' | 'sample'>('settings')
  const [locationSamplePaste, setLocationSamplePaste] = useState('')
  const [locationListEndpointUrl, setLocationListEndpointUrl] = useState('')
  const [locationListRequestRoot, setLocationListRequestRoot] = useState('')
  const [locationListAccountId, setLocationListAccountId] = useState('')
  const [isLocationListConfigOpen, setIsLocationListConfigOpen] = useState(false)
  const [isSavingLocationListConfig, setIsSavingLocationListConfig] = useState(false)
  const [isImportingLocationList, setIsImportingLocationList] = useState(false)
  const [locationListImportResult, setLocationListImportResult] = useState<any>(null)
  const [showLocationListImportResult, setShowLocationListImportResult] = useState(false)
  const [locationListConfigTab, setLocationListConfigTab] = useState<'settings' | 'sample'>('settings')
  const [locationSampleValidation, setLocationSampleValidation] = useState<{
    ok: boolean
    format?: string
    count?: number
    errors?: string[]
  } | null>(null)
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null)
  const [availabilityEndpointUrl, setAvailabilityEndpointUrl] = useState('')
  const [isSavingAvailabilityEndpoint, setIsSavingAvailabilityEndpoint] = useState(false)
  const [isFetchingAvailability, setIsFetchingAvailability] = useState(false)
  const [fetchAvailabilityResult, setFetchAvailabilityResult] = useState<{
    message: string
    offersCount?: number
    stored?: boolean
    isNew?: boolean
    error?: string
    details?: { expectedFormats?: string[]; help?: string; dataPreview?: string }
  } | null>(null)
  // OTA request parameters for the pricing tab test form
  const [otaRequestorId, setOtaRequestorId] = useState('')
  const [otaPickupLoc, setOtaPickupLoc] = useState('TIAA01')
  const [otaReturnLoc, setOtaReturnLoc] = useState('TIAA01')
  const [otaPickupDateTime, setOtaPickupDateTime] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 30); d.setHours(14, 0, 0, 0)
    return d.toISOString().slice(0, 16)
  })
  const [otaReturnDateTime, setOtaReturnDateTime] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 34); d.setHours(14, 0, 0, 0)
    return d.toISOString().slice(0, 16)
  })
  const [otaDriverAge, setOtaDriverAge] = useState(30)
  const [otaCitizenCountry, setOtaCitizenCountry] = useState('US')
  const [forceRefreshAvailability, setForceRefreshAvailability] = useState(false)
  const [availabilityAdapterType, setAvailabilityAdapterType] = useState<'xml' | 'json' | 'grpc'>('xml')
  const [grpcEndpointAddress, setGrpcEndpointAddress] = useState('')
  // Stored availability samples (loaded on pricing tab mount)
  const [storedSamples, setStoredSamples] = useState<import('../api/endpoints').StoredAvailabilitySample[]>([])
  const [isLoadingStoredSamples, setIsLoadingStoredSamples] = useState(false)
  const queryClient = useQueryClient()
  
  // Branches state
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null)
  const [isEditBranchModalOpen, setIsEditBranchModalOpen] = useState(false)
  
  // gRPC Test state
  const [grpcTestResult, setGrpcTestResult] = useState<SourceGrpcTestResponse | null>(null)
  const [isTestingGrpc, setIsTestingGrpc] = useState(false)

  // Health state
  const [healthLoading, setHealthLoading] = useState(false)
  const [health, setHealth] = useState<SourceHealth | null>(null)

  // Verification re-run state
  const [verificationStatus, setVerificationStatus] = useState<'IDLE' | 'PENDING' | 'RUNNING' | 'PASSED' | 'FAILED'>('IDLE')
  const [verificationLoading, setVerificationLoading] = useState(false)
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null)
  const [verificationHistory, setVerificationHistory] = useState<VerificationResult[]>([])
  
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

  // Subscription (plan gate for branches/locations)
  const { data: subscription, isLoading: isLoadingSubscription } = useQuery({
    queryKey: ['subscription'],
    queryFn: () => subscriptionApi.getMySubscription(),
    retry: false,
    enabled: !!user?.company?.id,
  })
  const subscriptionActive =
    !!subscription?.active &&
    !!subscription.currentPeriodEnd &&
    new Date(subscription.currentPeriodEnd) > new Date()
  const nearExpiry =
    subscriptionActive &&
    !!subscription?.currentPeriodEnd &&
    (new Date(subscription.currentPeriodEnd).getTime() - Date.now()) / (7 * 24 * 60 * 60 * 1000) < 1

  useEffect(() => {
    if (searchParams.get('checkout') === 'success') {
      queryClient.invalidateQueries({ queryKey: ['subscription'] })
      const tab = searchParams.get('tab') || 'dashboard'
      setSearchParams({ tab }, { replace: true })
    }
  }, [searchParams, queryClient, setSearchParams])

  // Form state for creating agreement
  const [selectedAgentId, setSelectedAgentId] = useState('')
  const [agreementRef, setAgreementRef] = useState('')
  const [validFrom, setValidFrom] = useState('')
  const [validTo, setValidTo] = useState('')

  useEffect(() => {
    // Load user data from localStorage
    const userData = localStorage.getItem('user')
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData)
        setUser(parsedUser)
        
        // Check if company exists before accessing its properties
        if (!parsedUser?.company?.id) {
          console.warn('User data missing company information')
          return
        }
        
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
        if (parsedUser.company?.status === 'ACTIVE') {
          loadAgents()
          loadEndpointConfig()
          // Preload health
          loadHealth()
          // Load verification status
          loadVerificationStatus()
        }
      } catch (error) {
        console.error('Failed to parse user data from localStorage:', error)
      }
    }
  }, [])

  const loadVerificationStatus = async () => {
    try {
      const result = await verificationApi.getStatus()
      if (result) {
        setVerificationResult(result)
        setVerificationStatus(result.passed ? 'PASSED' : 'FAILED')
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
      setLocationEndpointUrl(response.locationEndpointUrl || '')
      setLocationListEndpointUrl(response.locationListEndpointUrl || '')
      setLocationListRequestRoot(response.locationListRequestRoot || '')
      setLocationListAccountId(response.locationListAccountId || '')
      setAvailabilityEndpointUrl(response.availabilityEndpointUrl || '')
      // Pre-fill OTA requestor ID from saved account ID
      if (response.locationListAccountId) {
        setOtaRequestorId(response.locationListAccountId)
      }
      
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
      } else if (error.response?.status === 404) {
        toast.error('Endpoints endpoint not found. Please check your backend configuration.')
      } else if (error.response?.status >= 500) {
        toast.error('Server error. Please try again later or contact support.')
      } else {
        toast.error(errorMessage || 'Failed to load endpoint configuration. Please try again.')
      }
    } finally {
      setIsLoadingEndpoints(false)
    }
  }

  // Load locationEndpointUrl and availabilityEndpointUrl when endpointConfig changes
  useEffect(() => {
    if (endpointConfig?.locationEndpointUrl) {
      setLocationEndpointUrl(endpointConfig.locationEndpointUrl)
    }
    if (endpointConfig?.availabilityEndpointUrl) {
      setAvailabilityEndpointUrl(endpointConfig.availabilityEndpointUrl)
    }
    if (endpointConfig?.grpcEndpoint) {
      setGrpcEndpointAddress((endpointConfig.grpcEndpoint as string).replace(/^grpc:\/\//, ''))
    }
    if (endpointConfig?.locationListEndpointUrl != null) {
      setLocationListEndpointUrl(endpointConfig.locationListEndpointUrl || '')
    }
    if (endpointConfig?.locationListRequestRoot != null) {
      setLocationListRequestRoot(endpointConfig.locationListRequestRoot || '')
    }
    if (endpointConfig?.locationListAccountId != null) {
      setLocationListAccountId(endpointConfig.locationListAccountId || '')
    }
  }, [endpointConfig])

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
      const errorData = error.response?.data || {}
      const errorMessage = errorData.message || 'Failed to import branches'
      const errorCode = errorData.error || ''
      if (error.response?.status === 402 && errorCode === 'BRANCH_QUOTA_EXCEEDED') {
        setQuotaModal({
          payload: errorData as BranchQuotaExceededPayload,
          retry: () => importBranches(),
        })
      } else if (error.response?.status === 400 && (errorCode === 'NOT_APPROVED' || errorMessage.includes('approved'))) {
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

  const importLocations = async () => {
    setIsImportingLocations(true)
    try {
      const result = await endpointsApi.importLocations()
      
      // Check if there are errors in the response
      if (result.errors && result.errors.length > 0) {
        // Partial success or errors - show result modal
        setLocationImportResult(result)
        setShowLocationImportResult(true)
        
        if (result.imported > 0 || result.updated > 0) {
          toast.success(`Locations imported: ${result.imported} new, ${result.updated} updated, ${result.skipped} skipped`, { duration: 5000 })
        } else {
          toast.warning(`Import completed but no locations were imported. ${result.skipped} location(s) were skipped.`, { duration: 7000 })
        }
      } else if (result.imported > 0 || result.updated > 0) {
        // Complete success
        toast.success(`Locations imported successfully! ${result.imported} new, ${result.updated} updated`)
      } else {
        toast.warning('No locations found to import')
      }
      
      // Reload synced locations after import
      if (user?.company?.id) {
        loadSyncedLocations()
      }
      // Reload endpoint config to get updated lastLocationSyncAt
      await loadEndpointConfig()
    } catch (error: any) {
      console.error('Failed to import locations:', error)
      const errorData = error.response?.data || {}
      const errorMessage = errorData.message || 'Failed to import locations'
      const errorCode = errorData.error || ''
      
      // Handle format errors with detailed display
      if (error.response?.status === 400 && (errorCode === 'INVALID_FORMAT' || errorCode === 'INVALID_RESPONSE_FORMAT')) {
        setLocationImportResult({
          message: errorMessage,
          error: errorCode,
          details: errorData.details,
          imported: 0,
          updated: 0,
          skipped: 0,
          total: 0,
          errors: [{
            index: 0,
            error: errorMessage,
            details: errorData.details
          }]
        })
        setShowLocationImportResult(true)
        toast.error(errorMessage, { duration: 8000 })
      } else if (error.response?.status === 402 && errorCode === 'BRANCH_QUOTA_EXCEEDED') {
        setQuotaModal({
          payload: errorData as BranchQuotaExceededPayload,
          retry: () => importLocations(),
        })
      } else if (error.response?.status === 400 && (errorCode === 'NOT_APPROVED' || errorMessage.includes('approved'))) {
        setErrorModal({
          isOpen: true,
          title: 'Account Approval Required',
          message: errorMessage,
          error: errorCode,
        })
      } else {
        setLocationImportResult({
          message: errorMessage,
          error: errorCode,
          details: errorData.details,
          imported: 0,
          updated: 0,
          skipped: 0,
          total: 0,
          errors: [{
            index: 0,
            error: errorMessage,
            details: errorData.details
          }]
        })
        setShowLocationImportResult(true)
        toast.error(errorMessage, { duration: 8000 })
      }
    } finally {
      setIsImportingLocations(false)
    }
  }

  const handleConfirmAddBranches = async () => {
    if (!quotaModal) return
    const { payload, retry } = quotaModal
    const newQuantity = payload.currentCount + payload.adding
    setIsAddingBranches(true)
    try {
      await subscriptionApi.updateSubscriptionQuantity(newQuantity)
      setQuotaModal(null)
      toast.success(`Added ${payload.needToAdd} branches. Your subscription will be prorated.`)
      await retry()
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to update subscription')
    } finally {
      setIsAddingBranches(false)
    }
  }

  const handleSaveLocationEndpointUrl = async () => {
    setIsSavingLocationEndpoint(true)
    try {
      await endpointsApi.updateConfig({
        httpEndpoint: endpointConfig?.httpEndpoint || '',
        grpcEndpoint: endpointConfig?.grpcEndpoint || '',
        branchEndpointUrl: endpointConfig?.branchEndpointUrl,
        locationEndpointUrl: locationEndpointUrl,
        availabilityEndpointUrl: endpointConfig?.availabilityEndpointUrl,
      })
      queryClient.invalidateQueries({ queryKey: ['endpointConfig'] })
      await loadEndpointConfig()
      setIsLocationEndpointConfigOpen(false)
      toast.success('Location endpoint URL configured successfully')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save endpoint URL')
    } finally {
      setIsSavingLocationEndpoint(false)
    }
  }

  const handleSaveLocationListConfig = async () => {
    setIsSavingLocationListConfig(true)
    try {
      await endpointsApi.updateConfig({
        httpEndpoint: endpointConfig?.httpEndpoint || '',
        grpcEndpoint: endpointConfig?.grpcEndpoint || '',
        branchEndpointUrl: endpointConfig?.branchEndpointUrl,
        locationEndpointUrl: endpointConfig?.locationEndpointUrl,
        locationListEndpointUrl: locationListEndpointUrl.trim() || undefined,
        locationListRequestRoot: locationListRequestRoot.trim() || undefined,
        locationListAccountId: locationListAccountId.trim() || undefined,
        availabilityEndpointUrl: endpointConfig?.availabilityEndpointUrl,
      })
      queryClient.invalidateQueries({ queryKey: ['endpointConfig'] })
      await loadEndpointConfig()
      setIsLocationListConfigOpen(false)
      toast.success('Location list endpoint configuration saved')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save configuration')
    } finally {
      setIsSavingLocationListConfig(false)
    }
  }

  const importLocationList = async () => {
    setIsImportingLocationList(true)
    setLocationListImportResult(null)
    setShowLocationListImportResult(false)
    try {
      const result = await endpointsApi.importLocationList()
      setLocationListImportResult(result)
      setShowLocationListImportResult(true)
      if (result.errors && result.errors.length > 0) {
        if ((result.imported || 0) > 0 || (result.updated || 0) > 0) {
          toast.success(`Location list imported: ${result.imported || 0} new, ${result.updated || 0} updated locations; ${result.branchesImported || 0} new, ${result.branchesUpdated || 0} updated branches`)
        } else {
          toast.warning(`Import completed with issues. ${result.skipped || 0} skipped.`)
        }
      } else {
        toast.success(`Location list imported: ${result.imported || 0} locations, ${result.branchesImported || 0} branches created, ${result.branchesUpdated || 0} branches updated`)
      }
      queryClient.invalidateQueries({ queryKey: ['branches'] })
      await loadEndpointConfig()
      if (user?.company?.id) loadSyncedLocations()
    } catch (error: any) {
      const errorData = error.response?.data || {}
      setLocationListImportResult({
        message: errorData.message || 'Failed to import location list',
        error: errorData.error,
        imported: 0,
        updated: 0,
        skipped: 0,
        total: 0,
        errors: [{ index: 0, error: errorData.message || error.message }],
        details: errorData.details ? { dataPreview: errorData.details } : undefined,
      })
      setShowLocationListImportResult(true)
      toast.error(errorData.message || 'Failed to import location list')
    } finally {
      setIsImportingLocationList(false)
    }
  }

  const handleSaveAvailabilityEndpointUrl = async () => {
    setIsSavingAvailabilityEndpoint(true)
    try {
      await endpointsApi.updateConfig({
        httpEndpoint: endpointConfig?.httpEndpoint || '',
        grpcEndpoint: endpointConfig?.grpcEndpoint || '',
        branchEndpointUrl: endpointConfig?.branchEndpointUrl || undefined,
        locationEndpointUrl: endpointConfig?.locationEndpointUrl || undefined,
        locationListEndpointUrl: endpointConfig?.locationListEndpointUrl || undefined,
        locationListRequestRoot: endpointConfig?.locationListRequestRoot || undefined,
        locationListAccountId: otaRequestorId.trim() || endpointConfig?.locationListAccountId || undefined,
        availabilityEndpointUrl: availabilityEndpointUrl.trim() || undefined,
      })
      queryClient.invalidateQueries({ queryKey: ['endpointConfig'] })
      await loadEndpointConfig()
      toast.success('Availability endpoint URL saved')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save availability endpoint URL')
    } finally {
      setIsSavingAvailabilityEndpoint(false)
    }
  }

  const loadStoredSamples = async () => {
    setIsLoadingStoredSamples(true)
    try {
      const { samples } = await endpointsApi.getAvailabilitySamples()
      setStoredSamples(samples)
    } catch {
      // silently ignore — tab still works without historical data
    } finally {
      setIsLoadingStoredSamples(false)
    }
  }

  const handleFetchAvailability = async () => {
    const isGrpc = availabilityAdapterType === 'grpc'
    const urlToUse = isGrpc
      ? (grpcEndpointAddress.trim() || (endpointConfig as any)?.grpcEndpoint)
      : (availabilityEndpointUrl.trim() || endpointConfig?.availabilityEndpointUrl || endpointConfig?.httpEndpoint)
    if (!urlToUse) {
      if (isGrpc) {
        toast.error('Enter a gRPC endpoint address (e.g. localhost:50051)')
      } else {
        toast.error('Configure an availability endpoint URL first')
      }
      return
    }
    if (!otaPickupLoc.trim() || !otaReturnLoc.trim()) {
      toast.error('Pick-up and Return location codes are required')
      return
    }
    setIsFetchingAvailability(true)
    setFetchAvailabilityResult(null)
    try {
      const result = await endpointsApi.fetchAvailability({
        url: isGrpc ? grpcEndpointAddress.trim() || undefined : availabilityEndpointUrl.trim() || undefined,
        adapterType: availabilityAdapterType,
        pickupLoc: otaPickupLoc.trim(),
        returnLoc: otaReturnLoc.trim(),
        pickupDateTime: otaPickupDateTime ? `${otaPickupDateTime}:00` : undefined,
        returnDateTime: otaReturnDateTime ? `${otaReturnDateTime}:00` : undefined,
        requestorId: otaRequestorId.trim() || undefined,
        driverAge: otaDriverAge || undefined,
        citizenCountry: otaCitizenCountry.trim() || undefined,
        force: forceRefreshAvailability || undefined,
      })
      setFetchAvailabilityResult(result)
      if (result.duplicate) {
        toast('Data unchanged — not stored (same data already exists)', { icon: 'ℹ️' })
      } else {
        toast.success(result.message)
        // Reload stored samples so the new result appears in the stored-samples list
        loadStoredSamples()
      }
    } catch (error: any) {
      const errorData = error.response?.data || {}
      const errorMessage = errorData.message || 'Failed to fetch availability'
      const errorCode = errorData.error || ''
      setFetchAvailabilityResult({
        message: errorMessage,
        error: errorCode,
        details: errorData.details,
      })
      toast.error(errorMessage)
    } finally {
      setIsFetchingAvailability(false)
    }
  }

  const validateLocationEndpoint = async () => {
    if (!locationEndpointUrl.trim()) {
      toast.error('Please enter a location endpoint URL first')
      return
    }

    setIsValidatingLocationEndpoint(true)
    try {
      // Test the endpoint by making a request
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10s timeout

      let testUrl = locationEndpointUrl.trim()
      if (!testUrl.startsWith('http://') && !testUrl.startsWith('https://')) {
        testUrl = `http://${testUrl}`
      }

      const response = await fetch(testUrl, {
        method: 'GET',
        headers: {
          'Request-Type': 'LocationRq',
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      } as any)

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`Endpoint returned status ${response.status}`)
      }

      const responseText = await response.text()
      
      // Try to parse as JSON
      let isValid = false
      let format = ''
      try {
        const json = JSON.parse(responseText)
        if (Array.isArray(json) || json.Locations || json.items || json.Location) {
          isValid = true
          format = 'JSON'
        } else if (json.OTA_VehLocSearchRS?.VehMatchedLocs || json.gloria?.VehMatchedLocs) {
          isValid = true
          format = 'JSON (OTA_VehLocSearchRS)'
        }
      } catch {
        // Try XML
        if (responseText.includes('<Locations>') || responseText.includes('<Location>')) {
          isValid = true
          format = 'XML'
        } else if (responseText.includes('OTA_VehLocSearchRS') && responseText.includes('VehMatchedLocs')) {
          isValid = true
          format = 'PHP var_dump / OTA'
        }
      }

      if (isValid) {
        toast.success(`Endpoint is valid! Detected ${format} format.`)
      } else {
        toast.warning('Endpoint responded but format could not be detected. Expected JSON, XML, or PHP var_dump (OTA_VehLocSearchRS).')
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        toast.error('Endpoint validation timed out')
      } else {
        toast.error(`Endpoint validation failed: ${error.message || 'Unknown error'}`)
      }
    } finally {
      setIsValidatingLocationEndpoint(false)
    }
  }

  /** Client-side validation of pasted location sample (JSON, XML, or PHP var_dump OTA). */
  const validateLocationSample = () => {
    const pasted = locationSamplePaste.trim()
    setLocationSampleValidation(null)
    if (!pasted) {
      setLocationSampleValidation({ ok: false, errors: ['Paste sample data first.'] })
      return
    }
    const errors: string[] = []
    try {
      const parsed = JSON.parse(pasted)
      let count = 0
      if (Array.isArray(parsed)) count = parsed.length
      else if (Array.isArray(parsed.Locations)) count = parsed.Locations.length
      else if (Array.isArray(parsed.items)) count = parsed.items.length
      else if (parsed.OTA_VehLocSearchRS?.VehMatchedLocs) count = parsed.OTA_VehLocSearchRS.VehMatchedLocs.length
      else if (parsed.gloria?.VehMatchedLocs) count = parsed.gloria.VehMatchedLocs.length
      if (count > 0) {
        setLocationSampleValidation({ ok: true, format: 'JSON', count })
        return
      }
      errors.push('JSON is valid but no known location array found (expect Locations, items, or OTA_VehLocSearchRS.VehMatchedLocs).')
    } catch {
      if (pasted.includes('OTA_VehLocSearchRS') && pasted.includes('VehMatchedLocs')) {
        const locationDetailCount = (pasted.match(/\["LocationDetail"\]/g) || []).length
        const count = locationDetailCount
        setLocationSampleValidation({
          ok: count > 0,
          format: 'PHP var_dump / OTA',
          count: count || undefined,
          errors: count === 0 ? ['OTA structure found but no LocationDetail blocks detected.'] : undefined,
        })
        return
      }
      const xmlLocCount = (pasted.match(/<Location\b/g) || []).length
      if (pasted.includes('<Locations>') || xmlLocCount > 0) {
        setLocationSampleValidation({ ok: xmlLocCount > 0, format: 'XML', count: xmlLocCount || undefined })
        return
      }
      errors.push('Could not recognize format. Use JSON, XML, or PHP var_dump with OTA_VehLocSearchRS and VehMatchedLocs.')
    }
    setLocationSampleValidation({ ok: false, errors })
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
    <div className="flex h-screen bg-gray-50">
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
                className="relative p-3 text-gray-700 hover:bg-gray-100 rounded transition-colors"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 h-5 w-5 bg-red-600 text-white text-xs font-medium rounded-full border-2 border-white flex items-center justify-center">
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
            <div className="max-w-6xl mx-auto px-6 py-8 animate-in fade-in duration-200">
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
              <div 
                key={activeTab}
                className="animate-in fade-in duration-200"
              >
                {subscriptionActive && nearExpiry && subscription?.currentPeriodEnd && (
                  <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex flex-wrap items-center justify-between gap-3">
                    <span className="text-amber-900 font-medium">
                      Your plan expires on {new Date(subscription.currentPeriodEnd).toLocaleDateString()}. Renew now to continue.
                    </span>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => setSearchParams((prev) => ({ ...Object.fromEntries(prev), renew: '1' }))}
                    >
                      Renew now
                    </Button>
                  </div>
                )}
                {(searchParams.get('renew') === '1' || (!isLoadingSubscription && !subscriptionActive && ['dashboard', 'locations', 'branches', 'location-branches', 'location-requests'].includes(activeTab))) ? (
                  <PlanPicker />
                ) : (
                <>
                {activeTab === 'dashboard' && (
                <>
                  {/* Header */}
                  <div className="mb-8">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="p-3 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl shadow-sm">
                        <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                      <Card className="mb-6 border border-gray-200 shadow-sm">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg">
                                  <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                  </svg>
                                </div>
                                <div>
                                  <h3 className="text-lg font-bold text-gray-900">Company Information</h3>
                                  <p className="text-sm text-gray-500">Your source identification details</p>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div className="p-4 bg-gray-50 rounded border border-gray-200">
                                  <label className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-2 block">
                                    Company ID
                                  </label>
                                  <div className="flex items-center gap-2">
                                    <code className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded text-gray-900 font-mono text-sm">
                                      {user.company.id}
                                    </code>
                                    <button
                                      onClick={() => {
                                        navigator.clipboard.writeText(user.company.id)
                                        toast.success('Company ID copied!')
                                      }}
                                      className="p-2 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                                      title="Copy Company ID"
                                    >
                                      <svg className="w-4 h-4 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                      </svg>
                                    </button>
                                  </div>
                                </div>
                                
                                <div className="p-4 bg-gray-50 rounded border border-gray-200">
                                  <label className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-2 block">
                                    Company Type
                                  </label>
                                  <Badge variant="info" className="text-sm">
                                    {user.company.type}
                                  </Badge>
                                </div>
                              </div>
                              
                              <div className="p-4 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-l-4 border-blue-400 rounded-lg">
                                <div className="flex items-start gap-3">
                                  <div className="p-1.5 bg-blue-100 rounded-lg flex-shrink-0 mt-0.5">
                                    <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                  <div>
                                    <p className="text-sm font-semibold text-blue-900 mb-1">API Integration Tip</p>
                                    <p className="text-xs text-blue-800 leading-relaxed">
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
                    <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Active Agreements</p>
                            <p className="text-3xl font-bold text-gray-900 mb-1">
                              {(agents || []).flatMap(a => a.agentAgreements || []).filter(a => a.status === 'ACCEPTED' || a.status === 'ACTIVE').length}
                            </p>
                            <p className="text-xs text-gray-500">
                              {(agents || []).flatMap(a => a.agentAgreements || []).filter(a => a.status === 'OFFERED').length} pending
                            </p>
                          </div>
                          <div className="p-4 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl shadow-sm">
                            <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Health Status Card */}
                    <Card className={`transform transition-all duration-300 hover:shadow-md border-2 shadow-sm ${
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
                          <div className={`p-3 rounded-lg ${
                            health?.healthy ? 'bg-green-100' : 
                            health?.excludedUntil && new Date(health.excludedUntil).getTime() > Date.now() ? 'bg-red-100' : 
                            'bg-yellow-100'
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
                    <Card className={`border shadow-sm hover:shadow-md transition-shadow duration-200 ${
                      grpcTestResult?.ok ? 'border-green-200' : endpointConfig?.grpcEndpoint ? 'border-yellow-200' : 'border-gray-200'
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
                          <div className={`p-3 rounded-lg ${
                            grpcTestResult?.ok ? 'bg-green-100' : 
                            endpointConfig?.grpcEndpoint ? 'bg-yellow-100' : 
                            'bg-gray-100'
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
                      />
                    </div>
                  )}

                  {/* Offer Agreement Shortcut */}
                  {user?.company.status === 'ACTIVE' && endpointConfig?.grpcEndpoint && grpcTestResult?.ok && (
                    <Card className="mt-6 bg-gray-50 border border-gray-200">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900 mb-1">Ready to Offer an Agreement?</h3>
                              <p className="text-sm text-gray-600">
                                Create and offer agreements to agents to start accepting bookings from them.
                              </p>
                            </div>
                          </div>
                          <Button 
                            onClick={() => setActiveTab('agreements')} 
                            variant="primary"
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
                    <Card className="mt-6 border border-yellow-200 bg-yellow-50">
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
                      <svg className="w-8 h-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                  <div>
                        <h1 className="text-3xl font-semibold text-gray-900">
                          Locations
                        </h1>
                        <p className="mt-2 text-gray-600 font-medium">Manage your pickup and drop-off locations</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 space-y-6">
                    {/* Location Sync Status */}
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-3">
                            <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            <div>
                              <CardTitle className="text-xl font-semibold text-gray-900">Location Sync Status</CardTitle>
                              <p className="text-sm text-gray-600 mt-1">Sync your coverage and import branches</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <Button 
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                syncLocations()
                              }} 
                              loading={isSyncingLocations}
                              variant="primary"
                              size="sm"
                              disabled={!subscriptionActive}
                              title={!subscriptionActive ? 'Select a plan to continue.' : undefined}
                              className="shadow-md hover:shadow-lg"
                            >
                              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                              Sync Locations
                            </Button>
                            <Button 
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                importBranches()
                              }} 
                              loading={isImportingBranches}
                              variant="secondary"
                              size="sm"
                              disabled={!subscriptionActive}
                              title={!subscriptionActive ? 'Select a plan to continue.' : undefined}
                              className="shadow-md hover:shadow-lg"
                            >
                              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                              </svg>
                              Import Branches
                            </Button>
                            <Button 
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                setIsLocationEndpointConfigOpen(true)
                              }} 
                              variant="ghost"
                              size="sm"
                              disabled={!subscriptionActive}
                              className="shadow-md hover:shadow-lg"
                              title={!subscriptionActive ? 'Select a plan to continue.' : 'Configure location import endpoint URL'}
                            >
                              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              Configure Endpoint
                            </Button>
                            <Button 
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                importLocations()
                              }} 
                              loading={isImportingLocations}
                              variant="secondary"
                              size="sm"
                              disabled={!subscriptionActive}
                              className="shadow-md hover:shadow-lg"
                              title={!subscriptionActive ? 'Select a plan to continue.' : (endpointConfig?.locationEndpointUrl ? `Import from ${endpointConfig.locationEndpointUrl}` : 'Import from configured endpoint')}
                            >
                              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              Import Locations
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
                                Click "Sync Locations" to sync your coverage from supplier adapter. Click "Import Branches" to import branches from your HTTP endpoint. Click "Configure Endpoint" to set up your location import endpoint, then click "Import Locations" to import locations/UN/LOCODEs from your HTTP endpoint (supports JSON, XML, and PHP var_dump / OTA_VehLocSearchRS, same as branch import).
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
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              
                              console.log('Plus button clicked! Attempting to focus search input...')
                              
                              // Small delay to ensure DOM is ready
                              setTimeout(() => {
                                const searchInput = document.getElementById('add-location-search-input') as HTMLInputElement
                                if (searchInput) {
                                  searchInput.focus()
                                  searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' })
                                  console.log('Search input focused successfully!')
                                } else {
                                  console.error('Search input not found!')
                                }
                              }, 10)
                            }}
                            onMouseDown={(e) => {
                              e.stopPropagation()
                            }}
                            onMouseUp={(e) => {
                              e.stopPropagation()
                            }}
                            className="p-2 bg-white rounded-lg shadow-sm hover:shadow-md hover:bg-emerald-50 active:bg-emerald-100 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 relative z-10"
                            style={{ pointerEvents: 'auto' }}
                            aria-label="Focus search to add location"
                            title="Click to start searching for a location"
                          >
                            <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                          </button>
                          <div>
                            <CardTitle className="text-xl font-bold text-gray-900">Add Location to Coverage</CardTitle>
                            <p className="text-sm text-gray-600 mt-1">Search and add new locations to your coverage</p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-6">
                      <AddLocationForm
                        disabled={!subscriptionActive}
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
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                loadLocations(true)
                              }} 
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

                  {/* Location Endpoint Configuration Modal */}
                  <Modal
                    isOpen={isLocationEndpointConfigOpen}
                    onClose={() => {
                      setIsLocationEndpointConfigOpen(false)
                      setLocationConfigTab('settings')
                      setLocationSamplePaste('')
                      setLocationSampleValidation(null)
                    }}
                    title="Configure Location Import Endpoint"
                    size="lg"
                  >
                    <div className="space-y-4">
                      {/* Tabs */}
                      <div className="flex border-b border-gray-200">
                        <button
                          type="button"
                          onClick={() => setLocationConfigTab('settings')}
                          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
                            locationConfigTab === 'settings'
                              ? 'border-blue-600 text-blue-600'
                              : 'border-transparent text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          Settings
                        </button>
                        <button
                          type="button"
                          onClick={() => setLocationConfigTab('sample')}
                          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
                            locationConfigTab === 'sample'
                              ? 'border-blue-600 text-blue-600'
                              : 'border-transparent text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          Sample & Validate
                        </button>
                      </div>

                      {locationConfigTab === 'settings' && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Location Endpoint URL
                            </label>
                            <Input
                              value={locationEndpointUrl}
                              onChange={(e) => setLocationEndpointUrl(e.target.value)}
                              placeholder="https://example.com/loctest.php"
                              helperText="Enter the URL that returns location data in JSON, XML, or PHP var_dump (OTA_VehLocSearchRS) format"
                            />
                          </div>
                          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-sm text-blue-800 font-semibold mb-2">Supported formats</p>
                            <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
                              <li>JSON: <code>{`{ Locations: [...] }`}</code>, <code>{`{ items: [...] }`}</code>, or array</li>
                              <li>XML: <code>{`<Locations><Location>...</Location></Locations>`}</code></li>
                              <li><strong>PHP var_dump / OTA:</strong> <code>OTA_VehLocSearchRS</code> with <code>VehMatchedLocs</code> and <code>LocationDetail</code> (attr: Code, Name, Latitude, Longitude; Address.CountryName.attr.Code). Unlocode derived as country + first 3 of Code (e.g. DXBA02 → AEDXB).</li>
                            </ul>
                            <p className="text-xs text-blue-600 mt-2">Use the <strong>Sample & Validate</strong> tab to see an example and paste your response to check format.</p>
                          </div>
                          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                            <Button
                              variant="secondary"
                              onClick={validateLocationEndpoint}
                              loading={isValidatingLocationEndpoint}
                              disabled={!locationEndpointUrl.trim()}
                              type="button"
                            >
                              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Test Endpoint
                            </Button>
                            <Button variant="secondary" onClick={() => setIsLocationEndpointConfigOpen(false)} type="button">
                              Cancel
                            </Button>
                            <Button
                              variant="primary"
                              onClick={handleSaveLocationEndpointUrl}
                              loading={isSavingLocationEndpoint}
                              disabled={!locationEndpointUrl.trim()}
                            >
                              Save
                            </Button>
                          </div>
                        </>
                      )}

                      {locationConfigTab === 'sample' && (
                        <>
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-2">Expected sample (OTA PHP var_dump)</p>
                            <p className="text-xs text-gray-600 mb-2">Your endpoint should return a structure like this. Each location has <code>LocationDetail</code> with <code>attr</code> (Code, Name, Latitude, Longitude) and <code>Address.CountryName.attr.Code</code> (e.g. AE).</p>
                            <pre className="text-xs bg-gray-900 text-gray-100 p-3 rounded-lg overflow-x-auto max-h-48 overflow-y-auto font-mono whitespace-pre">
{`array(1) {
  ["OTA_VehLocSearchRS"]=> array(4) {
    ["VehMatchedLocs"]=> array(2) {
      [0]=> array(1) {
        ["VehMatchedLoc"]=> array(1) {
          ["LocationDetail"]=> array(6) {
            ["attr"]=> array(8) {
              ["Code"]=> string(6) "DXBA02"
              ["Name"]=> string(13) "Dubai Airport"
              ["Latitude"]=> string(9) "25.236158"
              ["Longitude"]=> string(9) "55.362354"
              ["BranchType"]=> string(6) "DXBA02"
            }
            ["Address"]=> array(4) {
              ["CountryName"]=> array(2) {
                ["value"]=> string(20) "UNITED ARAB EMIRATES"
                ["attr"]=> array(1) { ["Code"]=> string(2) "AE" }
              }
            }
          }
        }
      }
      [1]=> ... second location ...
    }
  }
}`}
                            </pre>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Paste your sample response</label>
                            <p className="text-xs text-gray-500 mb-1">Paste JSON, XML, or PHP var_dump output here and click Validate to check format and location count.</p>
                            <textarea
                              value={locationSamplePaste}
                              onChange={(e) => {
                                setLocationSamplePaste(e.target.value)
                                setLocationSampleValidation(null)
                              }}
                              placeholder="Paste endpoint response (JSON, XML, or PHP var_dump)..."
                              className="w-full h-40 px-3 py-2 border border-gray-300 rounded-md text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              spellCheck={false}
                            />
                            <div className="flex items-center gap-3 mt-2">
                              <Button
                                type="button"
                                variant="secondary"
                                onClick={validateLocationSample}
                                disabled={!locationSamplePaste.trim()}
                              >
                                Validate sample
                              </Button>
                              {locationSampleValidation && (
                                <div className={`flex-1 text-sm ${locationSampleValidation.ok ? 'text-green-700' : 'text-red-700'}`}>
                                  {locationSampleValidation.ok ? (
                                    <span>
                                      <CheckCircle2 className="w-4 h-4 inline mr-1 align-middle" />
                                      Detected <strong>{locationSampleValidation.format}</strong>
                                      {locationSampleValidation.count != null && ` — ${locationSampleValidation.count} location(s)`}.
                                    </span>
                                  ) : (
                                    <span>
                                      <XCircle className="w-4 h-4 inline mr-1 align-middle" />
                                      {locationSampleValidation.errors?.join(' ') || 'Validation failed.'}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                            {locationSampleValidation?.errors && locationSampleValidation.errors.length > 0 && (
                              <ul className="mt-2 text-xs text-red-700 list-disc list-inside">
                                {locationSampleValidation.errors.map((err, i) => (
                                  <li key={i}>{err}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                          <div className="flex justify-end pt-2 border-t border-gray-200">
                            <Button variant="secondary" onClick={() => setIsLocationEndpointConfigOpen(false)} type="button">
                              Close
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  </Modal>

                  {/* Location Import Results Modal */}
                  <Modal
                    isOpen={showLocationImportResult && locationImportResult !== null}
                    onClose={() => {
                      setShowLocationImportResult(false)
                      setLocationImportResult(null)
                    }}
                    title="Location Import Results"
                    size="xl"
                  >
                    {locationImportResult && (
                      <div className="max-h-[85vh] overflow-y-auto -mx-6 -mt-6 px-6 pt-6">
                        <LocationImportResultDisplay result={locationImportResult} />
                      </div>
                    )}
                  </Modal>
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
                      subscriptionActive={subscriptionActive}
                      onEdit={(branch) => {
                        setSelectedBranch(branch)
                        setIsEditBranchModalOpen(true)
                      }}
                      onQuotaExceeded={(payload, retry) => setQuotaModal({ payload, retry })}
                    />
                  </div>
                </>
              )}

              {activeTab === 'location-branches' && (
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
                          Location &amp; Branches
                        </h1>
                        <p className="mt-2 text-gray-600 font-medium">Import locations and branches from your GLORIA location list endpoint</p>
                      </div>
                    </div>
                  </div>

                  <Card className="mb-6 border border-gray-200 shadow-sm">
                    <CardHeader className="bg-gray-50 border-b border-gray-200">
                      <CardTitle className="text-lg">Endpoint</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">Configure the endpoint URL, request root element (e.g. GLORIA_locationlistrq), and Account ID. A POST request with XML body is sent; the response should be XML containing CountryList &gt; Country &gt; VehMatchedLocs &gt; VehMatchedLoc &gt; LocationDetail.</p>
                    </CardHeader>
                    <CardContent className="pt-4 flex flex-wrap items-center gap-3">
                      <Button
                        variant="secondary"
                        onClick={() => setIsLocationListConfigOpen(true)}
                        type="button"
                      >
                        Configure Endpoint
                      </Button>
                      <Button
                        variant="primary"
                        onClick={importLocationList}
                        loading={isImportingLocationList}
                        disabled={!locationListEndpointUrl.trim()}
                        type="button"
                      >
                        Import from endpoint
                      </Button>
                      {locationListEndpointUrl && (
                        <span className="text-sm text-gray-500 truncate max-w-md" title={locationListEndpointUrl}>
                          {locationListEndpointUrl}
                        </span>
                      )}
                    </CardContent>
                  </Card>

                  <div className="mt-6">
                    <BranchList
                      subscriptionActive={subscriptionActive}
                      onEdit={(branch) => {
                        setSelectedBranch(branch)
                        setIsEditBranchModalOpen(true)
                      }}
                      onQuotaExceeded={(payload, retry) => setQuotaModal({ payload, retry })}
                      hideHeader={true}
                    />
                  </div>

                  <Modal
                    isOpen={isLocationListConfigOpen}
                    onClose={() => setIsLocationListConfigOpen(false)}
                    title="Configure Location List Endpoint"
                    size="lg"
                  >
                    <div className="space-y-4">
                      <div className="flex border-b border-gray-200">
                        <button
                          type="button"
                          onClick={() => setLocationListConfigTab('settings')}
                          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${locationListConfigTab === 'settings' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        >
                          Settings
                        </button>
                        <button
                          type="button"
                          onClick={() => setLocationListConfigTab('sample')}
                          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${locationListConfigTab === 'sample' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        >
                          Sample &amp; Validate
                        </button>
                      </div>
                      {locationListConfigTab === 'settings' && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Endpoint URL</label>
                            <Input
                              value={locationListEndpointUrl}
                              onChange={(e) => setLocationListEndpointUrl(e.target.value)}
                              placeholder="https://example.com/locationlist.php"
                              helperText="URL that accepts POST XML with your request root (e.g. GLORIA_locationlistrq)"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Request root element name</label>
                            <Input
                              value={locationListRequestRoot}
                              onChange={(e) => setLocationListRequestRoot(e.target.value)}
                              placeholder="GLORIA_locationlistrq"
                              helperText="Root element of the XML request body; response is expected to use the same name with 'rs' suffix (e.g. GLORIA_locationlistrs)"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Account ID (optional)</label>
                            <Input
                              value={locationListAccountId}
                              onChange={(e) => setLocationListAccountId(e.target.value)}
                              placeholder="e.g. Gloria001"
                              helperText='Used in request as <AccountID ID="..."/>'
                            />
                          </div>
                          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                            <Button variant="secondary" onClick={() => setIsLocationListConfigOpen(false)} type="button">Cancel</Button>
                            <Button variant="primary" onClick={handleSaveLocationListConfig} loading={isSavingLocationListConfig} disabled={!locationListEndpointUrl.trim()} type="button">Save</Button>
                          </div>
                        </>
                      )}
                      {locationListConfigTab === 'sample' && (
                        <>
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-2">Sample request (POST body)</p>
                            <pre className="text-xs bg-gray-900 text-gray-100 p-3 rounded-lg overflow-x-auto max-h-40 font-mono whitespace-pre">{`<?xml version="1.0" encoding="UTF-8"?>
<${locationListRequestRoot || 'GLORIA_locationlistrq'} TimeStamp="${new Date().toISOString().slice(0, 19)}" Target="Production" Version="1.00">
  <ACC>
    <Source>
      <AccountID ID="${locationListAccountId || 'Gloria001'}"/>
    </Source>
  </ACC>
</${locationListRequestRoot || 'GLORIA_locationlistrq'}>`}</pre>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-2">Expected response structure</p>
                            <p className="text-xs text-gray-500 mb-1">The endpoint returns XML. Below is the JSON schema showing the expected structure and field types. Country code is taken from the <code className="bg-gray-200 px-1 rounded">CountryCode</code> element inside each <code className="bg-gray-200 px-1 rounded">Country</code>.</p>
                            <pre className="text-xs bg-gray-900 text-gray-100 p-3 rounded-lg overflow-x-auto max-h-[28rem] font-mono whitespace-pre">{`{
  "${locationListRequestRoot ? locationListRequestRoot.replace(/rq$/i, 'rs') : 'GLORIA_locationlistrs'}": {
    "@attributes": {
      "TimeStamp": "string",
      "Target": "string",
      "Version": "string"
    },
    "Success": {},
    "RentalBrand": "string",
    "CountryList": [
      {
        "Country": "string",
        "CountryCode": "string (2-letter ISO)",
        "VehMatchedLocs": [
          {
            "VehMatchedLoc": [
              {
                "LocationDetail": {
                  "@attributes": {
                    "BranchType": "string",
                    "AtAirport": "true | false",
                    "LocationType": "string",
                    "Code": "string",
                    "Brand": "string",
                    "Name": "string",
                    "Latitude": "number",
                    "Longitude": "number"
                  },
                  "Address": {
                    "AddressLine": "string",
                    "CityName": "string",
                    "PostalCode": "string",
                    "CountryName": {
                      "@attributes": { "Code": "string" },
                      "value": "string"
                    }
                  },
                  "Telephone": {
                    "@attributes": { "PhoneNumber": "string" }
                  },
                  "Opening": {
                    "monday":    { "@attributes": { "Open": "HH:mm - HH:mm | Closed" } },
                    "tuesday":   { "@attributes": { "Open": "HH:mm - HH:mm | Closed" } },
                    "wednesday": { "@attributes": { "Open": "HH:mm - HH:mm | Closed" } },
                    "thursday":  { "@attributes": { "Open": "HH:mm - HH:mm | Closed" } },
                    "friday":    { "@attributes": { "Open": "HH:mm - HH:mm | Closed" } },
                    "saturday":  { "@attributes": { "Open": "HH:mm - HH:mm | Closed" } },
                    "sunday":    { "@attributes": { "Open": "HH:mm - HH:mm | Closed" } }
                  },
                  "PickupInstructions": {
                    "@attributes": { "Pickup": "string" }
                  },
                  "Cars": {
                    "Code": [
                      {
                        "@attributes": {
                          "Acrisscode": "string",
                          "Group": "string",
                          "Make": "string",
                          "Model": "string",
                          "Doors": "number",
                          "Seats": "number",
                          "DepositAmount": "number | empty"
                        }
                      }
                    ]
                  }
                }
              }
            ]
          }
        ]
      }
    ]
  }
}`}</pre>
                            <p className="text-xs text-gray-400 mt-2 italic">The actual response is XML; this JSON schema shows the structure and field types.</p>
                          </div>
                          <div className="flex justify-end pt-2 border-t border-gray-200">
                            <Button variant="secondary" onClick={() => setIsLocationListConfigOpen(false)} type="button">Close</Button>
                          </div>
                        </>
                      )}
                    </div>
                  </Modal>

                  <Modal
                    isOpen={showLocationListImportResult && locationListImportResult !== null}
                    onClose={() => { setShowLocationListImportResult(false); setLocationListImportResult(null); }}
                    title="Location List Import Results"
                    size="xl"
                  >
                    {locationListImportResult && (
                      <div className="max-h-[85vh] overflow-y-auto -mx-6 -mt-6 px-6 pt-6">
                        <LocationImportResultDisplay result={locationListImportResult} />
                        {(locationListImportResult.branchesImported != null || locationListImportResult.branchesUpdated != null) && (
                          <div className="mt-4 flex gap-2">
                            {(locationListImportResult.branchesImported || 0) > 0 && (
                              <Badge variant="success">{locationListImportResult.branchesImported} branches created</Badge>
                            )}
                            {(locationListImportResult.branchesUpdated || 0) > 0 && (
                              <Badge variant="info">{locationListImportResult.branchesUpdated} branches updated</Badge>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </Modal>
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

              {activeTab === 'pricing' && (
                <>
                  <div className="mb-8">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="p-3 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-xl shadow-sm">
                        <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                          Pricing &amp; Availability
                        </h1>
                        <p className="mt-2 text-gray-600 font-medium">Test your pricing endpoint and store availability samples (OTA XML · Gloria JSON · Gloria gRPC)</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 space-y-6">

                    {/* ── Format Selector + Endpoint + Request Parameters ── */}
                    <Card className="border border-gray-200 shadow-sm">
                      <CardHeader>
                        <CardTitle className="text-lg">Format &amp; Endpoint</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Format tabs */}
                        <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm font-medium">
                          {(['xml', 'json', 'grpc'] as const).map((fmt) => {
                            const labels = { xml: 'OTA XML', json: 'Gloria JSON', grpc: 'Gloria gRPC' }
                            const active = availabilityAdapterType === fmt
                            return (
                              <button
                                key={fmt}
                                onClick={() => setAvailabilityAdapterType(fmt)}
                                className={`flex-1 py-2 px-3 transition-colors ${
                                  active
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-white text-gray-600 hover:bg-gray-50'
                                }`}
                              >
                                {labels[fmt]}
                              </button>
                            )
                          })}
                        </div>

                        {/* Endpoint field — HTTP for xml/json, gRPC address for grpc */}
                        {availabilityAdapterType !== 'grpc' ? (
                          <div>
                            <p className="text-xs text-gray-500 mb-2">
                              {availabilityAdapterType === 'xml'
                                ? 'Gloria POSTs an OTA_VehAvailRateRQ XML body (Content-Type: text/xml) and expects OTA_VehAvailRateRS XML back.'
                                : 'Gloria POSTs a JSON body with Gloria field names (Content-Type: application/json) and expects { vehicles: [...] } back.'}
                            </p>
                            <div className="flex gap-2 items-end">
                              <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Endpoint URL</label>
                                <Input
                                  value={availabilityEndpointUrl}
                                  onChange={(e) => setAvailabilityEndpointUrl(e.target.value)}
                                  placeholder="https://ota.tlinternationalgroup.com/pricetest.php"
                                />
                              </div>
                              <Button
                                variant="secondary"
                                onClick={handleSaveAvailabilityEndpointUrl}
                                loading={isSavingAvailabilityEndpoint}
                                disabled={!availabilityEndpointUrl.trim()}
                              >
                                Save
                              </Button>
                            </div>
                            {endpointConfig?.availabilityEndpointUrl && (
                              <p className="text-xs text-gray-500 mt-1">Saved: <code className="bg-gray-100 px-1 rounded">{endpointConfig.availabilityEndpointUrl}</code></p>
                            )}
                          </div>
                        ) : (
                          <div>
                            <p className="text-xs text-gray-500 mb-2">
                              Gloria connects to your gRPC source backend via <code className="bg-gray-100 px-1 rounded">source_provider.proto</code> — calls <code className="bg-gray-100 px-1 rounded">GetAvailability</code>.
                            </p>
                            <label className="block text-sm font-medium text-gray-700 mb-1">gRPC Address <span className="font-normal text-gray-400">(host:port)</span></label>
                            <Input
                              value={grpcEndpointAddress}
                              onChange={(e) => setGrpcEndpointAddress(e.target.value)}
                              placeholder="localhost:50051"
                            />
                            {(endpointConfig as any)?.grpcEndpoint && (
                              <p className="text-xs text-gray-500 mt-1">Saved: <code className="bg-gray-100 px-1 rounded">{(endpointConfig as any).grpcEndpoint}</code></p>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* ── Request Parameters ── */}
                    <Card className="border border-gray-200 shadow-sm">
                      <CardHeader>
                        <CardTitle className="text-lg">
                          {availabilityAdapterType === 'xml' ? 'OTA_VehAvailRateRQ' : availabilityAdapterType === 'json' ? 'Gloria JSON' : 'Gloria gRPC'} request parameters
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800 leading-relaxed">
                          {availabilityAdapterType === 'xml' && <>Gloria sends an <strong>OTA_VehAvailRateRQ XML POST</strong> to your endpoint. Fill in the fields below and click <strong>Fetch &amp; Store</strong>.</>}
                          {availabilityAdapterType === 'json' && <>Gloria sends a <strong>JSON POST</strong> with Gloria field names (<code>pickup_unlocode</code>, <code>agreement_ref</code>, etc.) and expects <code className="bg-blue-100 px-1 rounded">{`{ "vehicles": [ ... ] }`}</code> back.</>}
                          {availabilityAdapterType === 'grpc' && <>Gloria calls <strong>GetAvailability</strong> on your source backend using <code>source_provider.proto</code> (AvailabilityRequest → AvailabilityResponse).</>}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {/* RequestorID */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              RequestorID <span className="text-gray-400 font-normal">(broker account number)</span>
                            </label>
                            <Input
                              value={otaRequestorId}
                              onChange={(e) => setOtaRequestorId(e.target.value)}
                              placeholder="1000097"
                              helperText="The ID passed in <RequestorID Type='5' ID='...'>"
                            />
                          </div>

                          {/* Citizen country */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              CitizenCountryName Code <span className="text-gray-400 font-normal">(ISO 2-letter)</span>
                            </label>
                            <Input
                              value={otaCitizenCountry}
                              onChange={(e) => setOtaCitizenCountry(e.target.value.toUpperCase())}
                              placeholder="US"
                              maxLength={2}
                              helperText="e.g. US, GB, AE, IE"
                            />
                          </div>

                          {/* PickUpLocation */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              PickUpLocation LocationCode
                            </label>
                            <Input
                              value={otaPickupLoc}
                              onChange={(e) => setOtaPickupLoc(e.target.value.toUpperCase())}
                              placeholder="TIAA01"
                              helperText="Branch location code (from your branches)"
                            />
                          </div>

                          {/* ReturnLocation */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              ReturnLocation LocationCode
                            </label>
                            <Input
                              value={otaReturnLoc}
                              onChange={(e) => setOtaReturnLoc(e.target.value.toUpperCase())}
                              placeholder="TIAA01"
                              helperText="Same as pick-up for one-way or same-location rental"
                            />
                          </div>

                          {/* PickUpDateTime */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">PickUpDateTime</label>
                            <input
                              type="datetime-local"
                              value={otaPickupDateTime}
                              onChange={(e) => setOtaPickupDateTime(e.target.value)}
                              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          {/* ReturnDateTime */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">ReturnDateTime</label>
                            <input
                              type="datetime-local"
                              value={otaReturnDateTime}
                              onChange={(e) => setOtaReturnDateTime(e.target.value)}
                              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          {/* Driver Age */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Driver Age</label>
                            <input
                              type="number"
                              min={18}
                              max={99}
                              value={otaDriverAge}
                              onChange={(e) => setOtaDriverAge(Number(e.target.value))}
                              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>

                        {/* Request preview — format specific */}
                        <details className="border border-gray-200 rounded-lg">
                          <summary className="px-4 py-2 text-xs font-semibold text-gray-600 cursor-pointer select-none hover:bg-gray-50">
                            {availabilityAdapterType === 'xml' && 'Preview OTA_VehAvailRateRQ XML that will be sent'}
                            {availabilityAdapterType === 'json' && 'Preview Gloria JSON request body that will be sent'}
                            {availabilityAdapterType === 'grpc' && 'Preview Gloria gRPC AvailabilityRequest that will be sent'}
                          </summary>
                          {availabilityAdapterType === 'xml' && (
                            <pre className="text-xs font-mono text-gray-700 bg-gray-50 p-4 overflow-x-auto max-h-56 border-t border-gray-200">{`<?xml version="1.0" encoding="UTF-8"?>
<OTA_VehAvailRateRQ xmlns="http://www.opentravel.org/OTA/2003/05"
    TimeStamp="${new Date().toISOString().slice(0,19)}" Target="Production" Version="1.007">
  <POS>
    <Source>
      <RequestorID Type="5" ID="${otaRequestorId || '1000097'}"/>
    </Source>
  </POS>
  <VehAvailRQCore Status="Available">
    <VehRentalCore PickUpDateTime="${otaPickupDateTime ? otaPickupDateTime + ':00' : '2026-03-18T14:00:00'}"
                   ReturnDateTime="${otaReturnDateTime ? otaReturnDateTime + ':00' : '2026-03-22T14:00:00'}">
      <PickUpLocation LocationCode="${otaPickupLoc || 'TIAA01'}"/>
      <ReturnLocation LocationCode="${otaReturnLoc || 'TIAA01'}"/>
    </VehRentalCore>
    <DriverType Age="${otaDriverAge || 30}"/>
  </VehAvailRQCore>
  <VehAvailRQInfo>
    <Customer>
      <Primary>
        <CitizenCountryName Code="${otaCitizenCountry || 'US'}"/>
      </Primary>
    </Customer>
  </VehAvailRQInfo>
</OTA_VehAvailRateRQ>`}</pre>
                          )}
                          {availabilityAdapterType === 'json' && (
                            <pre className="text-xs font-mono text-gray-700 bg-gray-50 p-4 overflow-x-auto max-h-56 border-t border-gray-200">{JSON.stringify({
                              agreement_ref: otaRequestorId || '1000097',
                              pickup_unlocode: otaPickupLoc || 'TIAA01',
                              dropoff_unlocode: otaReturnLoc || 'TIAA01',
                              pickup_iso: otaPickupDateTime ? otaPickupDateTime + ':00' : '2026-03-18T14:00:00',
                              dropoff_iso: otaReturnDateTime ? otaReturnDateTime + ':00' : '2026-03-22T14:00:00',
                              driver_age: otaDriverAge || 30,
                              residency_country: otaCitizenCountry || 'US',
                            }, null, 2)}</pre>
                          )}
                          {availabilityAdapterType === 'grpc' && (
                            <pre className="text-xs font-mono text-gray-700 bg-gray-50 p-4 overflow-x-auto max-h-56 border-t border-gray-200">{`// source_provider.proto — AvailabilityRequest
message AvailabilityRequest {
  agreement_ref      = "${otaRequestorId || '1000097'}"
  pickup_unlocode    = "${otaPickupLoc || 'TIAA01'}"
  dropoff_unlocode   = "${otaReturnLoc || 'TIAA01'}"
  pickup_iso         = "${otaPickupDateTime ? otaPickupDateTime + ':00' : '2026-03-18T14:00:00'}"
  dropoff_iso        = "${otaReturnDateTime ? otaReturnDateTime + ':00' : '2026-03-22T14:00:00'}"
  driver_age         = ${otaDriverAge || 30}
  residency_country  = "${otaCitizenCountry || 'US'}"
}
// Endpoint: ${grpcEndpointAddress || 'host:port'} → GetAvailability`}</pre>
                          )}
                        </details>

                        <div className="flex flex-wrap items-center gap-3 pt-2">
                          <Button
                            variant="primary"
                            onClick={handleFetchAvailability}
                            loading={isFetchingAvailability}
                            disabled={
                              availabilityAdapterType === 'grpc'
                                ? !grpcEndpointAddress.trim() && !(endpointConfig as any)?.grpcEndpoint
                                : !availabilityEndpointUrl.trim() && !endpointConfig?.availabilityEndpointUrl && !endpointConfig?.httpEndpoint
                            }
                          >
                            Fetch &amp; Store
                          </Button>
                          <label className="flex items-center gap-1.5 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={forceRefreshAvailability}
                              onChange={(e) => setForceRefreshAvailability(e.target.checked)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-xs text-gray-600">Force re-store</span>
                          </label>
                          <p className="text-xs text-gray-500 self-center">
                            {availabilityAdapterType === 'xml' && 'OTA XML POST → OTA_VehAvailRateRS → stored in Gloria'}
                            {availabilityAdapterType === 'json' && 'JSON POST → Gloria vehicles[] → stored in Gloria'}
                            {availabilityAdapterType === 'grpc' && 'gRPC GetAvailability → VehicleOffer[] → stored in Gloria'}
                          </p>
                        </div>

                        {fetchAvailabilityResult && (
                          <AvailabilityFetchResultDisplay result={fetchAvailabilityResult} />
                        )}
                      </CardContent>
                    </Card>

                    {/* ── Stored Availability Samples ── */}
                    <Card className="border border-gray-200 shadow-sm">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-lg">Stored availability samples</CardTitle>
                            <p className="text-sm text-gray-500 mt-1">
                              All previously fetched results for this source — each unique search criteria is stored separately.
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            onClick={loadStoredSamples}
                            loading={isLoadingStoredSamples}
                            className="text-xs"
                          >
                            Refresh
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {isLoadingStoredSamples && storedSamples.length === 0 ? (
                          <div className="flex items-center gap-2 text-sm text-gray-500 py-4">
                            <svg className="animate-spin w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                            </svg>
                            Loading stored samples…
                          </div>
                        ) : storedSamples.length === 0 ? (
                          <p className="text-sm text-gray-400 italic py-4">
                            No stored samples yet. Click "Fetch &amp; Store" above to test your endpoint and save the result.
                          </p>
                        ) : (
                          <div className="space-y-4">
                            {storedSamples.map((sample) => (
                              <StoredSampleCard key={sample.id} sample={sample} />
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* ── OTA Format Reference ── */}
                    {/* ── Format reference — switches with the format selector above ── */}
                    <Card className="border border-gray-200 shadow-sm">
                      <CardHeader>
                        <CardTitle className="text-lg">
                          {availabilityAdapterType === 'xml' && 'OTA XML format reference'}
                          {availabilityAdapterType === 'json' && 'Gloria JSON format reference'}
                          {availabilityAdapterType === 'grpc' && 'Gloria gRPC format reference'}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">

                        {/* ── OTA XML reference ── */}
                        {availabilityAdapterType === 'xml' && (<>
                          <p className="text-sm text-gray-700">
                            Your endpoint must accept an <strong>OTA_VehAvailRateRQ XML POST</strong> (<code className="bg-gray-100 px-1 rounded">Content-Type: text/xml</code>) and return <strong>OTA_VehAvailRateRS XML</strong>. Gloria automatically parses the XML response and extracts vehicle data, pricing, and terms.
                          </p>
                          <div>
                            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Request sent to your endpoint (OTA_VehAvailRateRQ)</p>
                            <pre className="text-xs font-mono text-gray-800 bg-gray-50 border border-gray-200 rounded-lg p-3 overflow-x-auto max-h-48">{`<?xml version="1.0" encoding="UTF-8"?>
<OTA_VehAvailRateRQ xmlns="http://www.opentravel.org/OTA/2003/05"
    TimeStamp="2026-03-18T14:31:15" Target="Production" Version="1.007">
  <POS>
    <Source>
      <RequestorID Type="5" ID="1000097"/>   <!-- broker account number -->
    </Source>
  </POS>
  <VehAvailRQCore Status="Available">
    <VehRentalCore PickUpDateTime="2026-03-18T14:00:00"
                   ReturnDateTime="2026-03-22T14:00:00">
      <PickUpLocation LocationCode="TIAA01"/>
      <ReturnLocation LocationCode="TIAA01"/>
    </VehRentalCore>
    <DriverType Age="35"/>
  </VehAvailRQCore>
  <VehAvailRQInfo>
    <Customer><Primary>
      <CitizenCountryName Code="US"/>
    </Primary></Customer>
  </VehAvailRQInfo>
</OTA_VehAvailRateRQ>`}</pre>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Expected response (OTA_VehAvailRateRS)</p>
                            <pre className="text-xs font-mono text-gray-800 bg-gray-50 border border-gray-200 rounded-lg p-3 overflow-x-auto max-h-64">{`<?xml version="1.0" encoding="UTF-8"?>
<OTA_VehAvailRateRS xmlns="http://www.opentravel.org/OTA/2003/05"
    TimeStamp="2026-03-18T14:31:15" Target="Production" Version="1.007">
  <Success />
  <VehAvailRSCore>
    <VehRentalCore PickUpDateTime="2026-03-18T14:00:00" ReturnDateTime="2026-03-22T14:00:00">
      <PickUpLocation LocationCode="TIAA01" />
      <ReturnLocation LocationCode="TIAA01" />
    </VehRentalCore>
  </VehAvailRSCore>
  <VehVendorAvails>
    <VehVendorAvail>
      <VehAvails>
        <VehAvail>
          <VehAvailCore Status="Available" RStatus="Inc" VehID="CDAR65505909190226">
            <Vehicle AirConditionInd="Yes" TransmissionType="Automatic">
              <VehMakeModel Name="TOYOTA COROLLA"
                PictureURL="https://...front-toyotacorollaestate.png" />
              <VehType VehicleCategory="CDAR" DoorCount="5" Baggage="2" />
              <VehClass Size="5" />
              <VehTerms>
                <Included code="CDW" mandatory="Yes" header="Standard Insurance (CDW)"
                  price="0.00" excess="900.00" deposit="900.00" details="..." />
                <NotIncluded code="PCDW" mandatory="No" header="Premium Insurance (PCDW)"
                  price="60.00" excess="0.00" deposit="500.00" details="..." />
              </VehTerms>
            </Vehicle>
            <VehicleCharges>
              <VehicleCharge Amount="110.00" CurrencyCode="EUR" Purpose="1">
                <Calculation UnitCharge="33.00" UnitName="Day" Quantity="4" />
              </VehicleCharge>
            </VehicleCharges>
            <TotalCharge RateTotalAmount="132.00" CurrencyCode="EUR" taxInclusive="true" />
            <PricedEquips>
              <PricedEquip>
                <Equipment Description="GPS" vendorEquipID="GPS" />
                <Charge><Amount>32.00</Amount></Charge>
              </PricedEquip>
            </PricedEquips>
          </VehAvailCore>
        </VehAvail>
      </VehAvails>
    </VehVendorAvail>
  </VehVendorAvails>
</OTA_VehAvailRateRS>`}</pre>
                          </div>
                          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 space-y-1">
                            <p className="font-semibold">What Gloria extracts from each VehAvailCore:</p>
                            <ul className="list-disc list-inside space-y-0.5 mt-1">
                              <li><code>VehID</code> — unique rate reference (used for booking)</li>
                              <li><code>VehMakeModel Name</code> + <code>PictureURL</code> — car name and image</li>
                              <li><code>TransmissionType</code>, <code>AirConditionInd</code>, <code>DoorCount</code>, <code>Baggage</code></li>
                              <li><code>VehicleCategory</code> (ACRISS code), <code>VehClass Size</code></li>
                              <li><code>TotalCharge RateTotalAmount</code> + <code>CurrencyCode</code> — total price</li>
                              <li><code>VehTerms Included / NotIncluded</code> — insurance &amp; extras included/not</li>
                              <li><code>PricedEquips</code> — optional add-on equipment with pricing</li>
                            </ul>
                          </div>
                        </>)}

                        {/* ── Gloria JSON reference ── */}
                        {availabilityAdapterType === 'json' && (<>
                          <p className="text-sm text-gray-700">
                            Your endpoint must accept a <strong>JSON POST</strong> (<code className="bg-gray-100 px-1 rounded">Content-Type: application/json</code>) and return <code className="bg-gray-100 px-1 rounded">{`{ "vehicles": [ ... ] }`}</code>. Field names use Gloria's naming convention (matching <code className="bg-gray-100 px-1 rounded">source_provider.proto</code>).
                          </p>
                          <div>
                            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Request body Gloria sends (JSON POST)</p>
                            <pre className="text-xs font-mono text-gray-800 bg-gray-50 border border-gray-200 rounded-lg p-3 overflow-x-auto max-h-48">{`{
  "agreement_ref":     "1000097",            // broker account number
  "pickup_unlocode":   "TIAA01",             // pick-up location code
  "dropoff_unlocode":  "TIAA01",             // return location code
  "pickup_iso":        "2026-03-18T14:00:00",
  "dropoff_iso":       "2026-03-22T14:00:00",
  "driver_age":        35,
  "residency_country": "US"                  // ISO 2-letter country code
}`}</pre>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Expected response your endpoint returns</p>
                            <pre className="text-xs font-mono text-gray-800 bg-gray-50 border border-gray-200 rounded-lg p-3 overflow-x-auto max-h-72">{`{
  "vehicles": [
    {
      "supplier_offer_ref":  "CDAR65505909190226",  // unique offer ID (required for booking)
      "vehicle_class":       "CDAR",                // ACRISS code
      "make_model":          "TOYOTA COROLLA",       // car name
      "currency":            "EUR",
      "total_price":         132.00,
      "availability_status": "AVAILABLE",            // AVAILABLE | ON_REQUEST | SOLD_OUT
      "picture_url":         "https://...corolla.png",
      "door_count":          "5",
      "baggage":             "2",
      "vehicle_category":    "CDAR",
      "veh_id":              "CDAR65505909190226",
      // Optional: rich terms + pricing as a JSON string
      "ota_vehicle_json": "{
        \\"veh_terms_included\\": [
          { \\"code\\": \\"CDW\\", \\"header\\": \\"Standard Insurance (CDW)\\",
            \\"price\\": \\"0.00\\", \\"excess\\": \\"900.00\\", \\"deposit\\": \\"900.00\\" }
        ],
        \\"veh_terms_not_included\\": [
          { \\"code\\": \\"PCDW\\", \\"header\\": \\"Premium Insurance (PCDW)\\",
            \\"price\\": \\"60.00\\", \\"excess\\": \\"0.00\\" }
        ],
        \\"vehicle_charges\\": [
          { \\"Amount\\": \\"110.00\\", \\"CurrencyCode\\": \\"EUR\\",
            \\"UnitCharge\\": \\"33.00\\", \\"Quantity\\": \\"4\\" }
        ],
        \\"total_charge\\": { \\"RateTotalAmount\\": \\"132.00\\", \\"CurrencyCode\\": \\"EUR\\" },
        \\"priced_equips\\": [
          { \\"description\\": \\"GPS\\", \\"equip_type\\": \\"GPS\\",
            \\"charge\\": { \\"Amount\\": 32.00 } }
        ]
      }"
    }
  ]
}`}</pre>
                          </div>
                          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 space-y-1">
                            <p className="font-semibold">What Gloria extracts from each vehicle object:</p>
                            <ul className="list-disc list-inside space-y-0.5 mt-1">
                              <li><code>supplier_offer_ref</code> — unique offer ID (required for booking)</li>
                              <li><code>vehicle_class</code>, <code>make_model</code> — ACRISS code and car name</li>
                              <li><code>total_price</code> + <code>currency</code> — price and currency</li>
                              <li><code>availability_status</code> — AVAILABLE / ON_REQUEST / SOLD_OUT</li>
                              <li><code>picture_url</code>, <code>door_count</code>, <code>baggage</code>, <code>vehicle_category</code>, <code>veh_id</code></li>
                              <li><code>ota_vehicle_json</code> — optional JSON string for terms, charges, extras (same rich data as OTA XML)</li>
                            </ul>
                          </div>
                        </>)}

                        {/* ── Gloria gRPC reference ── */}
                        {availabilityAdapterType === 'grpc' && (<>
                          <p className="text-sm text-gray-700">
                            Your source backend must implement <strong>SourceProviderService</strong> from <code className="bg-gray-100 px-1 rounded">source_provider.proto</code>. Gloria connects directly via gRPC and calls <code className="bg-gray-100 px-1 rounded">GetAvailability</code> — no HTTP needed.
                          </p>
                          <div>
                            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Proto definition (source_provider.proto)</p>
                            <pre className="text-xs font-mono text-gray-800 bg-gray-50 border border-gray-200 rounded-lg p-3 overflow-x-auto max-h-72">{`syntax = "proto3";
package source_provider;

// ── Request ──────────────────────────────────────────────────────────
message AvailabilityRequest {
  string agreement_ref     = 1;   // broker account number
  string pickup_unlocode   = 2;   // pick-up location code  (e.g. TIAA01)
  string dropoff_unlocode  = 3;   // return location code
  string pickup_iso        = 4;   // ISO datetime  2026-03-18T14:00:00
  string dropoff_iso       = 5;
  int32  driver_age        = 6;
  string residency_country = 7;   // ISO 2-letter  (e.g. US)
  repeated string vehicle_classes = 8;  // optional ACRISS filter
}

// ── Response ─────────────────────────────────────────────────────────
message VehicleOffer {
  string supplier_offer_ref  = 1;   // unique offer ID — required for booking
  string vehicle_class       = 2;   // ACRISS code (e.g. CDAR)
  string make_model          = 3;   // car name  (e.g. TOYOTA COROLLA)
  string currency            = 4;   // ISO 4217  (e.g. EUR)
  double total_price         = 5;
  string availability_status = 6;   // AVAILABLE | ON_REQUEST | SOLD_OUT
  // Optional rich fields
  string picture_url         = 7;
  string door_count          = 8;
  string baggage             = 9;
  string vehicle_category    = 10;  // ACRISS (e.g. CDAR)
  string veh_id              = 11;
  string ota_vehicle_json    = 12;  // JSON: terms, charges, priced_equips
}

message AvailabilityResponse {
  repeated VehicleOffer vehicles = 1;
}

// ── Service ──────────────────────────────────────────────────────────
service SourceProviderService {
  rpc GetHealth      (Empty)               returns (HealthResponse);
  rpc GetLocations   (Empty)               returns (LocationsResponse);
  rpc GetAvailability(AvailabilityRequest) returns (AvailabilityResponse);
  rpc CreateBooking  (BookingCreateRequest)returns (BookingResponse);
  rpc ModifyBooking  (BookingRef)          returns (BookingResponse);
  rpc CancelBooking  (BookingRef)          returns (BookingResponse);
  rpc CheckBooking   (BookingRef)          returns (BookingResponse);
}`}</pre>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Example ota_vehicle_json value (rich terms &amp; pricing)</p>
                            <pre className="text-xs font-mono text-gray-800 bg-gray-50 border border-gray-200 rounded-lg p-3 overflow-x-auto max-h-48">{`// Set VehicleOffer.ota_vehicle_json to a JSON string like:
{
  "veh_terms_included": [
    { "code": "CDW", "header": "Standard Insurance (CDW)",
      "price": "0.00", "excess": "900.00", "deposit": "900.00",
      "mandatory": "Yes", "details": "Collision damage waiver..." }
  ],
  "veh_terms_not_included": [
    { "code": "PCDW", "header": "Premium Insurance (PCDW)",
      "price": "60.00", "excess": "0.00", "mandatory": "No" }
  ],
  "vehicle_charges": [
    { "Amount": "110.00", "CurrencyCode": "EUR",
      "UnitCharge": "33.00", "Quantity": "4", "UnitName": "Day" }
  ],
  "total_charge": { "RateTotalAmount": "132.00", "CurrencyCode": "EUR" },
  "priced_equips": [
    { "description": "GPS", "equip_type": "GPS",
      "charge": { "Amount": 32.00 } }
  ]
}`}</pre>
                          </div>
                          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 space-y-1">
                            <p className="font-semibold">What Gloria extracts from each VehicleOffer:</p>
                            <ul className="list-disc list-inside space-y-0.5 mt-1">
                              <li><code>supplier_offer_ref</code> — unique offer ID (required for booking)</li>
                              <li><code>vehicle_class</code>, <code>make_model</code> — ACRISS code and car name</li>
                              <li><code>total_price</code> + <code>currency</code></li>
                              <li><code>availability_status</code> — AVAILABLE / ON_REQUEST / SOLD_OUT</li>
                              <li><code>picture_url</code>, <code>door_count</code>, <code>baggage</code>, <code>vehicle_category</code>, <code>veh_id</code></li>
                              <li><code>ota_vehicle_json</code> — JSON string parsed for terms, charges, extras (same as OTA XML VehTerms / PricedEquips)</li>
                            </ul>
                            <p className="mt-2 font-semibold">gRPC address format:</p>
                            <p className="font-mono">host:port &nbsp;(e.g. <strong>localhost:50051</strong> or <strong>source.example.com:443</strong>)</p>
                            <p className="mt-1">No <code>grpc://</code> prefix needed — Gloria adds the insecure channel automatically.</p>
                          </div>
                        </>)}

                      </CardContent>
                    </Card>
                  </div>
                </>
              )}

              {activeTab === 'transactions' && (
                <SourceTransactionsTab />
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

              {activeTab === 'support' && (
                <>
                  <Support />
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
                                className={`p-4 rounded border transition-colors ${
                                  index === 0 
                                    ? result.passed 
                                      ? 'bg-green-50 border-green-200' 
                                      : 'bg-red-50 border-red-200'
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
                                        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
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
                </>
                )}
              </div>
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

      {/* Branch quota exceeded modal: add more branches then retry */}
      {quotaModal && (
        <Modal
          isOpen={!!quotaModal}
          onClose={() => setQuotaModal(null)}
          title="Add more branches"
        >
          <div className="space-y-4">
            <p className="text-gray-700">
              {quotaModal.payload.message}
            </p>
            <p className="text-sm text-gray-600">
              Add <strong>{quotaModal.payload.needToAdd}</strong> more branch{quotaModal.payload.needToAdd !== 1 ? 'es' : ''} to your subscription. Your next invoice will be prorated.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setQuotaModal(null)} disabled={isAddingBranches}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleConfirmAddBranches} loading={isAddingBranches} disabled={isAddingBranches}>
                Confirm and add branches
              </Button>
            </div>
          </div>
        </Modal>
      )}
      
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
