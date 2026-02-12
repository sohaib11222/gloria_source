import React, { useState } from 'react'
import { AlertCircle, XCircle, CheckCircle2, ChevronDown, ChevronUp, FileText } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'
import { Badge } from './ui/Badge'
import { ValidationError, ImportSummary } from '../api/endpoints'

interface ValidationErrorsDisplayProps {
  summary: ImportSummary
  validationErrors?: ValidationError[]
  message: string
}

export const ValidationErrorsDisplay: React.FC<ValidationErrorsDisplayProps> = ({
  summary,
  validationErrors = [],
  message,
}) => {
  const [showExample, setShowExample] = useState(false)
  
  // Debug logging
  React.useEffect(() => {
    console.log('[ValidationErrorsDisplay] Props:', {
      summary,
      validationErrorsCount: validationErrors.length,
      validationErrors,
      message,
      hasErrors: validationErrors.length > 0,
      firstError: validationErrors[0]
    })
  }, [summary, validationErrors, message])
  
  // Show errors if validationErrors array has items OR invalid count > 0
  // Branches may be imported even with validation issues, so show errors for transparency
  const hasErrors = validationErrors.length > 0 || (summary.invalid ?? 0) > 0
  const hasPartialSuccess = (summary.imported ?? 0) > 0 || (summary.updated ?? 0) > 0
  // Success: no errors and (we have import results, or this is pre-upload validation with valid data)
  const isValidationOnlySuccess = (summary.total ?? 0) > 0 && (summary.invalid ?? 0) === 0 && !hasErrors
  const isCompleteSuccess = !hasErrors && (hasPartialSuccess || isValidationOnlySuccess)

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
              {summary.imported > 0 && (
                <Badge variant="success" className="font-semibold">
                  {summary.imported} Imported
                </Badge>
              )}
              {summary.updated > 0 && (
                <Badge variant="info" className="font-semibold">
                  {summary.updated} Updated
                </Badge>
              )}
              {summary.skipped > 0 && (
                <Badge variant="warning" className="font-semibold">
                  {summary.skipped} Skipped
                </Badge>
              )}
              {summary.invalid > 0 && (
                <Badge variant="danger" className="font-semibold">
                  {summary.invalid} Invalid
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
            {message}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="bg-white/70 rounded-lg p-3 border border-gray-200">
              <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                Total
              </div>
              <div className="text-lg font-bold text-gray-900">{summary.total}</div>
            </div>
            <div className="bg-white/70 rounded-lg p-3 border border-green-200">
              <div className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-1">
                Valid
              </div>
              <div className="text-lg font-bold text-green-900">{summary.valid}</div>
            </div>
            <div className="bg-white/70 rounded-lg p-3 border border-red-200">
              <div className="text-xs font-semibold text-red-700 uppercase tracking-wide mb-1">
                Invalid
              </div>
              <div className="text-lg font-bold text-red-900">{summary.invalid}</div>
            </div>
            <div className="bg-white/70 rounded-lg p-3 border border-blue-200">
              <div className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1">
                Imported
              </div>
              <div className="text-lg font-bold text-blue-900">{summary.imported}</div>
            </div>
            <div className="bg-white/70 rounded-lg p-3 border border-purple-200">
              <div className="text-xs font-semibold text-purple-700 uppercase tracking-wide mb-1">
                Updated
              </div>
              <div className="text-lg font-bold text-purple-900">{summary.updated}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Validation Errors Table */}
      {hasErrors ? (
        <Card className="border-2 border-red-200">
          <CardHeader className="bg-red-50 border-b border-red-200">
            <div className="flex items-center gap-3">
              <XCircle className="w-5 h-5 text-red-600" />
              <CardTitle className="text-lg font-bold text-red-900">
                Validation Errors ({validationErrors.length})
              </CardTitle>
            </div>
            <p className="text-sm text-red-700 mt-2">
              {hasPartialSuccess 
                ? `The following ${validationErrors.length} branch(es) had validation issues but were still imported. Please review and fix the issues if needed.`
                : `The following branches could not be imported due to validation errors. Please fix the issues and try again.`
              }
            </p>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      #
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Branch Code
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Branch Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Error Message
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Missing/Invalid Fields
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Missing Days
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {validationErrors.map((error: any, idx: number) => {
                    // Extract error details - handle both old and new error formats
                    const errorObj = error.error || error;
                    const errorFields = errorObj.fields || errorObj.missingFields || [];
                    const errorMessage = errorObj.error || errorObj.message || "Location validation failed";
                    
                    // Extract missing fields - try multiple sources
                    // Include all fields that don't have ':' (which indicates format errors)
                    const missingFields = errorObj.missingFields || 
                                        errorObj.details?.missingFields ||
                                        errorFields.filter((f: string) => !f.includes(':')) || [];
                    
                    // Extract format/validation errors
                    const formatErrors = errorObj.validationErrors || 
                                       errorObj.details?.validationErrors ||
                                       errorFields.filter((f: string) => f.includes(':') || f.includes('Invalid')) || [];
                    
                    // Extract invalid days
                    const invalidDays = errorObj.days || 
                                      errorObj.invalidDays || 
                                      errorObj.details?.invalidDays || [];
                    
                    // Debug logging for troubleshooting (only for first error to avoid spam)
                    if (idx === 0) {
                      console.log(`[ValidationErrorsDisplay] First error details:`, {
                        error,
                        errorObj,
                        missingFields,
                        formatErrors,
                        invalidDays,
                        errorFields,
                        hasDetails: !!errorObj.details,
                        errorMessage,
                      });
                    }
                    
                    return (
                      <tr key={idx} className="hover:bg-red-50 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-sm font-medium text-gray-900">
                            {error.index + 1}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {error.branchCode ? (
                            <code className="text-sm font-mono font-semibold text-gray-900 bg-gray-100 px-2 py-1 rounded">
                              {error.branchCode}
                            </code>
                          ) : (
                            <span className="text-sm text-gray-400 italic">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-900">
                            {error.branchName || <span className="text-gray-400 italic">—</span>}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-red-700 font-medium max-w-md space-y-1">
                            <div>{errorMessage}</div>
                            {formatErrors.length > 0 && (
                              <div className="mt-2 space-y-1">
                                {formatErrors.map((err: string, errIdx: number) => (
                                  <div key={errIdx} className="text-xs text-orange-700 bg-orange-50 px-2 py-1 rounded">
                                    {err}
                                  </div>
                                ))}
                              </div>
                            )}
                            {errorObj.details && (
                              <div className="mt-2 text-xs text-gray-600">
                                {errorObj.details.missingFields && errorObj.details.missingFields.length > 0 && (
                                  <div className="mb-1">
                                    <strong>Missing:</strong> {errorObj.details.missingFields.join(', ')}
                                  </div>
                                )}
                                {errorObj.details.validationErrors && errorObj.details.validationErrors.length > 0 && (
                                  <div className="mb-1">
                                    <strong>Invalid:</strong> {errorObj.details.validationErrors.join(', ')}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {missingFields.length > 0 ? (
                            <div className="space-y-2">
                              <div className="flex flex-wrap gap-1">
                                {missingFields.map((field: string, fieldIdx: number) => (
                                  <Badge
                                    key={fieldIdx}
                                    variant="danger"
                                    className="text-xs font-mono"
                                    title={`Missing required field: ${field}`}
                                  >
                                    {field}
                                  </Badge>
                                ))}
                              </div>
                              {errorObj.details?.missingFields && errorObj.details.missingFields.length > missingFields.length && (
                                <div className="text-xs text-gray-600 mt-1">
                                  + {errorObj.details.missingFields.length - missingFields.length} more
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400 italic">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {invalidDays.length > 0 ? (
                            <div className="space-y-1">
                              <div className="flex flex-wrap gap-1">
                                {invalidDays.map((day: string, dayIdx: number) => (
                                  <Badge
                                    key={dayIdx}
                                    variant="warning"
                                    className="text-xs"
                                  >
                                    {day.includes('.') ? day : `${day} (missing)`}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400 italic">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="mt-4 space-y-2">
              {hasPartialSuccess && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-xs text-yellow-800 font-semibold mb-1">
                    <strong>⚠️ Note:</strong> Branches were imported despite validation issues.
                  </p>
                  <p className="text-xs text-yellow-700">
                    The system imported the branches with available data. Missing or invalid fields may have been set to defaults or left empty.
                  </p>
                </div>
              )}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-800 font-semibold mb-1">
                  <strong>Validation Issues Found:</strong>
                </p>
                <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
                  <li><strong>Missing Fields:</strong> Some required fields are missing from the data</li>
                  <li><strong>Format Errors:</strong> Some fields may not match the expected format</li>
                  <li><strong>Missing Days:</strong> Opening hours may be missing for some days</li>
                  <li><strong>Coordinates:</strong> Latitude and Longitude may be missing or invalid</li>
                </ul>
                {!hasPartialSuccess && (
                  <p className="text-xs text-blue-700 mt-2">
                    <strong>How to fix:</strong> Ensure all required fields are present in your XML/JSON/PHP var_dump data and match the expected format.
                  </p>
                )}
              </div>
              
              {/* Example Data Format - Collapsible */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => setShowExample(!showExample)}
                  className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-semibold text-gray-800">
                      📋 Expected Data Format Examples
                    </span>
                  </div>
                  {showExample ? (
                    <ChevronUp className="w-4 h-4 text-gray-600" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-600" />
                  )}
                </button>
                
                {showExample && (
                  <div className="p-4 bg-white space-y-4 border-t border-gray-200">
                    <div>
                      <p className="text-xs text-gray-700 font-semibold mb-2">✅ JSON Format (Recommended):</p>
                      <pre className="text-xs bg-gray-900 text-gray-100 p-3 rounded overflow-x-auto max-h-96">
{`{
  "Branchcode": "DXBA02",
  "Name": "Dubai Airport",
  "AtAirport": "true",
  "LocationType": "Outside Airport",
  "CollectionType": "AIRPORT",
  "Latitude": 25.228005,
  "Longitude": 55.364241,
  "EmailAddress": "branch@example.com",
  "Telephone": {
    "attr": {
      "PhoneNumber": "+9715076671777"
    }
  },
  "Address": {
    "AddressLine": {
      "value": "Umm Ramool, Marrakech Street"
    },
    "CityName": {
      "value": "Dubai"
    },
    "PostalCode": {
      "value": "000000"
    },
    "CountryName": {
      "value": "UNITED ARAB EMIRATES",
      "attr": {
        "Code": "AE"
      }
    }
  },
  "Opening": {
    "Monday": {
      "attr": {
        "Open": "09:00",
        "Closed": "22:00"
      }
    },
    "Tuesday": {
      "attr": {
        "Open": "09:00",
        "Closed": "22:00"
      }
    }
    // ... include all 7 days
  }
}`}
                      </pre>
                    </div>
                    
                    <div>
                      <p className="text-xs text-gray-700 font-semibold mb-2">✅ OTA XML / PHP var_dump Format (Also Supported):</p>
                      <pre className="text-xs bg-gray-900 text-gray-100 p-3 rounded overflow-x-auto max-h-96">
{`array(1) {
  ["OTA_VehLocSearchRS"]=> array(4) {
    ["VehMatchedLocs"]=> array(1) {
      [0]=> array(1) {
        ["VehMatchedLoc"]=> array(1) {
          ["LocationDetail"]=> array(6) {
            ["attr"]=> array(8) {
              ["Code"]=> string(6) "DXBA02"
              ["Name"]=> string(13) "Dubai Airport"
              ["AtAirport"]=> string(4) "true"
              ["LocationType"]=> string(15) "Outside Airport"
              ["Latitude"]=> string(9) "25.228005"
              ["Longitude"]=> string(9) "55.364241"
            }
            ["Address"]=> array(4) {
              ["AddressLine"]=> array(1) {
                ["value"]=> string(69) "Umm Ramool..."
              }
              ["CityName"]=> array(1) {
                ["value"]=> string(5) "Dubai"
              }
              ["PostalCode"]=> array(1) {
                ["value"]=> string(6) "000000"
              }
              ["CountryName"]=> array(2) {
                ["value"]=> string(20) "UNITED ARAB EMIRATES"
                ["attr"]=> array(1) {
                  ["Code"]=> string(2) "AE"
                }
              }
            }
            ["Telephone"]=> array(1) {
              ["attr"]=> array(1) {
                ["PhoneNumber"]=> string(17) "+971 50 766 71 77"
              }
            }
            ["Opening"]=> array(7) {
              ["monday"]=> array(1) {
                ["attr"]=> array(1) {
                  ["Open"]=> string(16) "09:00 - 22:00"
                }
              }
              // ... include all 7 days
            }
          }
        }
      }
    }
  }
}`}
                      </pre>
                    </div>
                    
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-xs text-blue-900 font-semibold mb-2">📝 Required Fields Checklist:</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <div className="text-xs text-blue-800">
                            <code className="bg-blue-100 px-1.5 py-0.5 rounded font-mono">Branchcode</code> or <code className="bg-blue-100 px-1.5 py-0.5 rounded font-mono">Code</code>
                          </div>
                          <div className="text-xs text-blue-800">
                            <code className="bg-blue-100 px-1.5 py-0.5 rounded font-mono">Name</code>
                          </div>
                          <div className="text-xs text-blue-800">
                            <code className="bg-blue-100 px-1.5 py-0.5 rounded font-mono">AtAirport</code> ("true" or "false")
                          </div>
                          <div className="text-xs text-blue-800">
                            <code className="bg-blue-100 px-1.5 py-0.5 rounded font-mono">LocationType</code>
                          </div>
                          <div className="text-xs text-blue-800">
                            <code className="bg-blue-100 px-1.5 py-0.5 rounded font-mono">CollectionType</code> ("AIRPORT" or "CITY")
                          </div>
                          <div className="text-xs text-blue-800">
                            <code className="bg-blue-100 px-1.5 py-0.5 rounded font-mono">Latitude</code> (number)
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-xs text-blue-800">
                            <code className="bg-blue-100 px-1.5 py-0.5 rounded font-mono">Longitude</code> (number)
                          </div>
                          <div className="text-xs text-blue-800">
                            <code className="bg-blue-100 px-1.5 py-0.5 rounded font-mono">EmailAddress</code>
                          </div>
                          <div className="text-xs text-blue-800">
                            <code className="bg-blue-100 px-1.5 py-0.5 rounded font-mono">Telephone.attr.PhoneNumber</code>
                          </div>
                          <div className="text-xs text-blue-800">
                            <code className="bg-blue-100 px-1.5 py-0.5 rounded font-mono">Address.CountryName.attr.Code</code>
                          </div>
                          <div className="text-xs text-blue-800">
                            <code className="bg-blue-100 px-1.5 py-0.5 rounded font-mono">Opening</code> (all 7 days with Open/Closed)
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-blue-700 mt-2 italic">
                        Note: The system will import branches even if some fields are missing, but validation warnings will be shown.
                      </p>
                    </div>
                  </div>
                )}
              </div>
              {validationErrors.some((e: any) => {
                const err = e.error || e;
                return (err.days && err.days.length > 0) || (err.invalidDays && err.invalidDays.length > 0);
              }) && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-xs text-yellow-800">
                    <strong>Opening Hours Format:</strong> Each day must have both <code className="bg-yellow-100 px-1 rounded">Open</code> and <code className="bg-yellow-100 px-1 rounded">Closed</code> times in <code className="bg-yellow-100 px-1 rounded">HH:MM</code> format (e.g., "09:00", "18:00").
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        // Show message if no detailed errors but summary shows invalid
        summary.invalid > 0 && validationErrors.length === 0 && (
          <Card className="border-2 border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6">
              <div className="text-center py-4">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> {summary.invalid} branch(es) had validation issues, but detailed error information is not available.
                </p>
                <p className="text-xs text-yellow-700 mt-2">
                  The branches were still imported. Check the server logs for more details.
                </p>
              </div>
            </CardContent>
          </Card>
        )
      )}
    </div>
  )
}
