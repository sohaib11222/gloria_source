import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'
import { Button } from './ui/Button'
import { Location } from '../api/endpoints'

interface AvailableLocationsProps {
  locations: Location[]
  isLoadingLocations: boolean
  showLocations: boolean
  loadLocations: () => void
}

export const AvailableLocations: React.FC<AvailableLocationsProps> = ({
  locations,
  isLoadingLocations,
  showLocations,
  loadLocations,
}) => {
  return (
    <Card className="mb-8">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Available Locations</CardTitle>
          <Button
            onClick={loadLocations}
            loading={isLoadingLocations}
            variant="secondary"
            size="sm"
          >
            Load Locations
          </Button>
        </div>
        <p className="text-sm text-gray-600">
          View available pickup and drop-off locations
        </p>
      </CardHeader>
      <CardContent>
        {/* Info Note */}
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> These locations are added manually in the database for testing and connection purposes. 
            They are used to verify that the system integration is working correctly.
          </p>
        </div>

        {showLocations ? (
          locations.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">UN/LOCODE</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Country</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IATA</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Coordinates</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {locations.map((location) => (
                    <tr key={location.unlocode} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <code className="text-xs text-gray-900 font-mono">{location.unlocode}</code>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900">{location.place}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm text-gray-600">{location.country}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-xs text-gray-600">{location.iata_code || '—'}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-xs text-gray-500">
                          {(location.latitude !== 0 || location.longitude !== 0) ? `${location.latitude}, ${location.longitude}` : '—'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No locations found</h3>
              <p className="mt-1 text-sm text-gray-500">No locations are configured for this agreement.</p>
            </div>
          )
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">Select an agreement and click "Load Locations" to view available locations</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

