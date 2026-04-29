import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'
import { Button } from './ui/Button'
import { Location } from '../api/endpoints'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { endpointsApi } from '../api/endpoints'
import toast from 'react-hot-toast'
import { Badge } from './ui/Badge'

interface AvailableLocationsProps {
  locations: Location[]
  isLoadingLocations: boolean
  showLocations: boolean
  loadLocations: () => void
  showRemoveButton?: boolean
  agreementFilterActive?: boolean
  listMeta?: { inherited?: boolean; hasMockData?: boolean } | null
}

function formatCoordinates(loc: Location): string | null {
  if (loc.coordinatesMissing) return null
  const lat = loc.latitude
  const lon = loc.longitude
  if (lat === 0 && lon === 0) return null
  if (Number.isNaN(lat) || Number.isNaN(lon)) return null
  return `${lat.toFixed(4)}, ${lon.toFixed(4)}`
}

export const AvailableLocations: React.FC<AvailableLocationsProps> = ({
  locations,
  isLoadingLocations,
  showLocations,
  loadLocations,
  showRemoveButton = false,
  agreementFilterActive = false,
  listMeta,
}) => {
  const queryClient = useQueryClient()

  const removeLocationMutation = useMutation({
    mutationFn: (unlocode: string) => endpointsApi.removeLocation(unlocode),
    onSuccess: (data) => {
      toast.success(`Location ${data.unlocode} removed successfully!`)
      queryClient.invalidateQueries({ queryKey: ['locations'] })
      queryClient.invalidateQueries({ queryKey: ['syncedLocations'] })
      setTimeout(() => {
        loadLocations()
      }, 500)
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Failed to remove location'
      toast.error(errorMessage)
    },
  })

  const handleRemoveLocation = (unlocode: string, place: string) => {
    if (window.confirm(`Are you sure you want to remove ${unlocode} (${place}) from your coverage?`)) {
      removeLocationMutation.mutate(unlocode)
    }
  }

  const showLinkedCol = locations.some((l) => !!l.synced_at)

  return (
    <Card className="transform transition-all duration-300 hover:shadow-xl border-2 border-gray-100">
      <CardHeader className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-gray-900">Available Locations</CardTitle>
              <p className="text-sm text-gray-600 mt-1">UN/LOCODE coverage for pickups and drop-offs</p>
            </div>
          </div>
          <Button
            onClick={() => loadLocations()}
            loading={isLoadingLocations}
            variant="secondary"
            size="sm"
            className="shadow-md hover:shadow-lg"
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-l-4 border-blue-400 rounded-lg">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-blue-900 mb-1">About Locations</p>
              <p className="text-xs text-blue-800 leading-relaxed">
                {agreementFilterActive ? (
                  <>
                    Codes allowed for the selected agreement (including overrides). Place, country, IATA, and coordinates
                    come from the Gloria UN/LOCODE master record when it exists.
                    {listMeta?.inherited ? (
                      <span className="block mt-1 font-medium">
                        This source has no dedicated coverage rows yet — the full global UN/LOCODE list is shown
                        (inherited mode).
                      </span>
                    ) : null}
                    {listMeta?.hasMockData ? (
                      <span className="block mt-1">Some rows may be marked as mock when the source uses mock data.</span>
                    ) : null}
                  </>
                ) : (
                  <>
                    Rows are your source <strong>coverage</strong> from <strong>Sync Locations</strong>,{' '}
                    <strong>Import Locations</strong>, <strong>Location &amp; Branches</strong> (list import), or manual adds.
                    Display fields use the Gloria <strong>UN/LOCODE</strong> master when it exists; otherwise we map from an
                    imported <strong>branch</strong> whose <code className="bg-white px-1 rounded text-[11px]">natoLocode</code> (or{' '}
                    <code className="bg-white px-1 rounded text-[11px]">branchCode</code>) matches the code. Set{' '}
                    <strong>Master</strong> to <strong>Gloria</strong> vs <strong>Branch</strong> accordingly; <strong>Pending</strong> means no master row and no matching branch yet.
                  </>
                )}
              </p>
            </div>
          </div>
        </div>

        {showLocations ? (
          locations.length > 0 ? (
            <div className="overflow-x-auto rounded border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      UN/LOCODE
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Country
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      IATA
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Coordinates
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Master
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Data
                    </th>
                    {showLinkedCol && (
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Linked
                      </th>
                    )}
                    {showRemoveButton && (
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {locations.map((location) => {
                    const coords = formatCoordinates(location)
                    return (
                      <tr key={location.unlocode} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <code className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-mono">
                            {location.unlocode}
                          </code>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-900">{location.place || '—'}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {location.country ? (
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700">
                              {location.country}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {location.iata_code ? (
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700">
                              {location.iata_code}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {coords ? (
                            <span className="text-xs text-gray-600 font-mono">{coords}</span>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {location.hasMasterRecord === false ? (
                            <Badge variant="warning" className="text-[10px]">
                              Pending
                            </Badge>
                          ) : location.enrichedFromBranch ? (
                            <Badge variant="info" className="text-[10px]" title="Filled from an imported branch (natoLocode or branch code)">
                              Branch
                            </Badge>
                          ) : (
                            <Badge variant="success" className="text-[10px]" title="Gloria UN/LOCODE master record">
                              Gloria
                            </Badge>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {location.isMock ? (
                            <Badge variant="default" className="text-[10px]">
                              Mock
                            </Badge>
                          ) : (
                            <span className="text-xs text-gray-500">Live</span>
                          )}
                        </td>
                        {showLinkedCol && (
                          <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">
                            {location.synced_at
                              ? new Date(location.synced_at).toLocaleString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : '—'}
                          </td>
                        )}
                        {showRemoveButton && (
                          <td className="px-4 py-3 whitespace-nowrap">
                            <Button
                              onClick={() => handleRemoveLocation(location.unlocode, location.place)}
                              loading={removeLocationMutation.isPending}
                              variant="secondary"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                            >
                              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Remove
                            </Button>
                          </td>
                        )}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-4">
                <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No locations found</h3>
              <p className="text-sm text-gray-500 mb-4">No locations are configured for this agreement.</p>
              <Button onClick={() => loadLocations()} variant="secondary" size="sm">
                Try Loading Again
              </Button>
            </div>
          )
        ) : (
          <div className="text-center py-16">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mb-4">
              <svg className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready to Load Locations</h3>
            <p className="text-sm text-gray-500 mb-4">Select an agreement and click &quot;Load Locations&quot; to view available locations</p>
            <Button onClick={() => loadLocations()} variant="primary" size="sm">
              Load Locations
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
