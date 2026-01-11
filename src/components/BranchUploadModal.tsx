import React, { useState, useRef } from 'react'
import { Upload, X, FileJson, AlertCircle, CheckCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'
import { Button } from './ui/Button'
import toast from 'react-hot-toast'

interface BranchUploadModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export const BranchUploadModal: React.FC<BranchUploadModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [isUploading, setIsUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    setFileError(null)

    if (!file) {
      setSelectedFile(null)
      return
    }

    // Validate file type
    if (!file.name.endsWith('.json')) {
      setFileError('Please select a JSON file')
      setSelectedFile(null)
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setFileError('File size must be less than 5MB')
      setSelectedFile(null)
      return
    }

    setSelectedFile(file)
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      setFileError('Please select a file')
      return
    }

    setIsUploading(true)
    setFileError(null)

    try {
      // Read file as text
      const fileContent = await selectedFile.text()

      // Parse JSON
      let branchesData: any
      try {
        branchesData = JSON.parse(fileContent)
      } catch (parseError) {
        setFileError('Invalid JSON file. Please check the file format.')
        setIsUploading(false)
        return
      }

      // Import the API function dynamically to avoid circular dependencies
      const { endpointsApi } = await import('../api/endpoints')

      // Upload branches
      const result = await endpointsApi.uploadBranches(branchesData)

      toast.success(
        `Branches uploaded successfully! ${result.imported} imported, ${result.updated} updated, ${result.total} total.`,
        { duration: 5000 }
      )

      // Reset state
      setSelectedFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      // Call success callback and close
      if (onSuccess) {
        onSuccess()
      }
      onClose()
    } catch (error: any) {
      console.error('Failed to upload branches:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Failed to upload branches'
      setFileError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsUploading(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const file = e.dataTransfer.files?.[0]
    if (file) {
      // Create a synthetic event to reuse handleFileSelect
      const syntheticEvent = {
        target: { files: [file] },
      } as any
      handleFileSelect(syntheticEvent)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] flex flex-col transform transition-all shadow-xl">
        <CardHeader className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <Upload className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-gray-900">
                  Upload Branches
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Upload branches from a JSON file
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="hover:bg-gray-100"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6 overflow-y-auto flex-1 min-h-0 px-6">
          <div className="space-y-6">
            {/* File Upload Area */}
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                selectedFile
                  ? 'border-green-300 bg-green-50'
                  : fileError
                  ? 'border-red-300 bg-red-50'
                  : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFileSelect}
                className="hidden"
                id="branch-file-upload"
              />

              {selectedFile ? (
                <div className="space-y-3">
                  <CheckCircle className="w-12 h-12 text-green-600 mx-auto" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{selectedFile.name}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {(selectedFile.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedFile(null)
                      if (fileInputRef.current) {
                        fileInputRef.current.value = ''
                      }
                      setFileError(null)
                    }}
                    className="text-xs"
                  >
                    Remove
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <FileJson className="w-12 h-12 text-gray-400 mx-auto" />
                  <div>
                    <label
                      htmlFor="branch-file-upload"
                      className="cursor-pointer text-blue-600 hover:text-blue-700 font-semibold"
                    >
                      Click to select a JSON file
                    </label>
                    <p className="text-sm text-gray-500 mt-2">or drag and drop</p>
                    <p className="text-xs text-gray-400 mt-2">
                      Maximum file size: 5MB
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Error Message */}
            {fileError && (
              <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-red-900">Error</p>
                  <p className="text-sm text-red-700 mt-1">{fileError}</p>
                </div>
              </div>
            )}

            {/* Format Information */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-blue-900 mb-2">Expected JSON Format:</p>
              <pre className="text-xs bg-white p-3 rounded border border-blue-100 overflow-x-auto">
{`{
  "CompanyCode": "CMP00023",
  "Branches": [
    {
      "Branchcode": "BR001",
      "Name": "Airport Branch",
      "Status": "ACTIVE",
      "LocationType": "AIRPORT",
      "NatoLocode": "GBMAN",
      "Address": {
        "CityName": { "value": "Manchester" },
        "CountryName": { 
          "value": "United Kingdom",
          "attr": { "Code": "GB" }
        }
      },
      "Latitude": 53.3656,
      "Longitude": -2.2729
    }
  ]
}`}
              </pre>
              <p className="text-xs text-blue-700 mt-2">
                Or provide an array of branches directly: <code className="bg-white px-1 rounded">[{`[{...}, {...}]`}]</code>
              </p>
            </div>

          </div>
        </CardContent>
        {/* Action Buttons - Fixed at bottom */}
        <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-end gap-3">
            <Button
              variant="secondary"
              onClick={onClose}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleUpload}
              loading={isUploading}
              disabled={!selectedFile || isUploading}
              className="flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Upload Branches
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

