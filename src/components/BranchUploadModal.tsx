import React, { useState, useRef } from 'react'
import { Upload, X, FileJson, AlertCircle, CheckCircle, FileText, Clipboard, CheckCircle2, XCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import toast from 'react-hot-toast'
import { ValidationErrorsDisplay } from './ValidationErrorsDisplay'
import { ImportBranchesResponse } from '../api/endpoints'

interface BranchUploadModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

type UploadMode = 'file' | 'paste'
type ViewType = 'raw' | 'json' | 'xml' | 'php' | 'csv' | 'formatted'

export const BranchUploadModal: React.FC<BranchUploadModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [uploadMode, setUploadMode] = useState<UploadMode>('file')
  const [viewType, setViewType] = useState<ViewType>('raw')
  const [isUploading, setIsUploading] = useState(false)
  const [isValidating, setIsValidating] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [pastedData, setPastedData] = useState('')
  const [fileError, setFileError] = useState<string | null>(null)
  const [validationResult, setValidationResult] = useState<ImportBranchesResponse | null>(null)
  const [showValidationResult, setShowValidationResult] = useState(false)
  const [formattedPreview, setFormattedPreview] = useState<string>('')
  const [defaultCountryCode, setDefaultCountryCode] = useState('')
  const [formatSampleTab, setFormatSampleTab] = useState<'json' | 'xml' | 'csv' | 'php' | 'excel'>('json')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Reset state when modal closes
  React.useEffect(() => {
    if (!isOpen) {
      setSelectedFile(null)
      setPastedData('')
      setFileError(null)
      setValidationResult(null)
      setShowValidationResult(false)
      setFormattedPreview('')
      setViewType('raw')
      setDefaultCountryCode('')
      setFormatSampleTab('json')
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }, [isOpen])

  // Format and preview data based on view type
  const formatXml = (text: string) => {
    let indent = 0
    return text
      .replace(/></g, '>\n<')
      .split('\n')
      .map((line) => {
        const trimmed = line.trim()
        if (!trimmed) return ''
        if (trimmed.startsWith('</')) indent--
        const indented = '  '.repeat(Math.max(0, indent)) + trimmed
        if (trimmed.startsWith('<') && !trimmed.startsWith('</') && !trimmed.endsWith('/>')) indent++
        return indented
      })
      .filter(Boolean)
      .join('\n')
  }
  const formatPhp = (text: string) =>
    text
      .replace(/array\(/g, 'array(\n  ')
      .replace(/\)=>/g, ') =>\n  ')
      .replace(/\["([^"]+)"\]=>/g, '["$1"] =>')
      .replace(/string\((\d+)\)\s+"([^"]+)"/g, 'string($1) "$2"')
  const formatCsv = (text: string) => {
    const lines = text.split(/\r?\n/).filter(Boolean)
    if (lines.length === 0) return text
    const rows = lines.map((line) => line.split(',').map((c) => c.replace(/^"|"$/g, '').trim()))
    const maxCols = Math.max(...rows.map((r) => r.length), 1)
    const colWidths = Array.from({ length: maxCols }, (_, c) =>
      Math.max(2, ...rows.map((r) => (r[c] ?? '').length))
    )
    return rows
      .map((row) =>
        Array.from({ length: maxCols }, (_, c) => (row[c] ?? '').padEnd(colWidths[c], ' ')).join(' | ')
      )
      .join('\n')
  }

  React.useEffect(() => {
    if (uploadMode === 'paste' && pastedData.trim()) {
      const content = pastedData.trim()
      let formatted = ''
      try {
        if (viewType === 'json') {
          const parsed = JSON.parse(content)
          formatted = JSON.stringify(parsed, null, 2)
        } else if (viewType === 'xml' || (viewType === 'formatted' && (content.startsWith('<') || content.includes('<?xml')))) {
          formatted = formatXml(content)
        } else if (viewType === 'php' || (viewType === 'formatted' && content.includes('array(') && content.includes('OTA_VehLocSearchRS'))) {
          formatted = formatPhp(content)
        } else if (viewType === 'csv' || (viewType === 'formatted' && content.includes(',') && content.split(/\r?\n/).length >= 2 && content.split(/\r?\n/)[1].includes(','))) {
          formatted = formatCsv(content)
        } else if (viewType === 'formatted') {
          try {
            const parsed = JSON.parse(content)
            formatted = JSON.stringify(parsed, null, 2)
          } catch {
            formatted = content
          }
        } else {
          formatted = content
        }
      } catch {
        formatted = content
      }
      setFormattedPreview(formatted)
    } else if (uploadMode === 'file' && selectedFile) {
      setFormattedPreview('')
    } else {
      setFormattedPreview('')
    }
  }, [pastedData, viewType, uploadMode, selectedFile])

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    setFileError(null)
    setValidationResult(null)
    setShowValidationResult(false)

    if (!file) {
      setSelectedFile(null)
      return
    }

    // Accept JSON, XML, PHP, CSV, and Excel files
    const validExtensions = ['.json', '.xml', '.txt', '.php', '.csv', '.xlsx', '.xls']
    const isValidExtension = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext))
    
    if (!isValidExtension) {
      setFileError('Please select a JSON, XML, PHP, CSV, or Excel file')
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

  // Parse data from various formats
  const parseData = async (content: string): Promise<any> => {
    // Try JSON first
    try {
      const jsonData = JSON.parse(content)
      return jsonData
    } catch (jsonError) {
      // Not JSON, might be PHP var_dump or XML
      // Return the raw content string - backend will parse it
      return content
    }
  }

  // Validate data without uploading
  const handleValidate = async () => {
    let content = ''
    
    if (uploadMode === 'file' && selectedFile) {
      content = await selectedFile.text()
    } else if (uploadMode === 'paste' && pastedData.trim()) {
      content = pastedData.trim()
    } else {
      setFileError(uploadMode === 'file' ? 'Please select a file' : 'Please paste data')
      return
    }

    if (!content.trim()) {
      setFileError('No data provided')
      return
    }

    setIsValidating(true)
    setFileError(null)
    setValidationResult(null)
    setShowValidationResult(false)

    try {
      const { endpointsApi } = await import('../api/endpoints')
      
      // Parse the data
      const parsedData = await parseData(content)
      
      // If it's raw PHP/XML format, we need to send it differently
      // For now, try to upload with validateOnly flag (we'll add this to backend)
      // Or we can use the import endpoint which handles PHP format
      
      // For validation, we'll use a temporary validation endpoint or simulate it
      // Since backend doesn't have validate-only yet, we'll parse and show structure
      
      // Check if it's PHP var_dump format
      const isPhpVarDump = content.includes('array(') && content.includes('OTA_VehLocSearchRS')
      
      // CSV: first row headers, rest data rows
      const lines = content.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
      const looksLikeCsv = lines.length >= 2 && lines[0].includes(',') && lines[1].includes(',')
      if (looksLikeCsv) {
        const headerLine = lines[0].toLowerCase()
        const hasCode = headerLine.includes('branchcode') || headerLine.includes('code')
        const rowCount = Math.max(0, lines.length - 1)
        const valid = hasCode ? rowCount : 0
        const invalid = hasCode ? 0 : rowCount
        setValidationResult({
          message: hasCode
            ? `CSV format OK. ${rowCount} row(s) detected. Validation will run on upload.`
            : 'CSV missing Branchcode or Code column. First row must be headers with Branchcode or Code.',
          imported: 0,
          updated: 0,
          skipped: 0,
          total: rowCount,
          summary: {
            total: rowCount,
            valid,
            invalid,
            imported: 0,
            updated: 0,
            skipped: 0,
          },
          validationErrors: invalid > 0 ? [{ index: 0, branchCode: '—', branchName: '—', error: { error: 'Missing Branchcode/Code column in header', fields: [] } }] : undefined,
          warnings: hasCode ? ['You can proceed with upload.'] : ['Add a column named Branchcode or Code.'],
        })
        setShowValidationResult(true)
        setIsValidating(false)
        return
      }

      if (isPhpVarDump || parsedData.format === 'php_or_xml') {
        setValidationResult({
          message: 'PHP var_dump or XML format detected. Structure accepted; full validation will run on upload.',
          imported: 0,
          updated: 0,
          skipped: 0,
          total: 1,
          summary: {
            total: 1,
            valid: 1,
            invalid: 0,
            imported: 0,
            updated: 0,
            skipped: 0,
          },
          warnings: ['Proceed with upload to validate and import.'],
        })
        setShowValidationResult(true)
        setIsValidating(false)
        return
      }

      // XML (OTA) without PHP pattern
      const isXml = content.startsWith('<') || content.includes('<?xml') || content.includes('<OTA_')
      if (isXml && typeof parsedData === 'string') {
        setValidationResult({
          message: 'OTA XML format detected. Structure accepted; full validation will run on upload.',
          imported: 0,
          updated: 0,
          skipped: 0,
          total: 1,
          summary: {
            total: 1,
            valid: 1,
            invalid: 0,
            imported: 0,
            updated: 0,
            skipped: 0,
          },
          warnings: ['Proceed with upload to validate and import.'],
        })
        setShowValidationResult(true)
        setIsValidating(false)
        return
      }

      if (typeof parsedData === 'string') {
        setFileError('Could not detect format. Use JSON, OTA XML, PHP var_dump, or CSV.')
        setIsValidating(false)
        return
      }

      {
        // For JSON format, we can validate structure
        let branches: any[] = []
        
        if (Array.isArray(parsedData)) {
          branches = parsedData
        } else if (parsedData.Branches && Array.isArray(parsedData.Branches)) {
          branches = parsedData.Branches
        } else if (parsedData.OTA_VehLocSearchRS || parsedData.gloria) {
          setValidationResult({
            message: 'OTA JSON format detected. Structure accepted; full validation will run on upload.',
            imported: 0,
            updated: 0,
            skipped: 0,
            total: 1,
            summary: { total: 1, valid: 1, invalid: 0, imported: 0, updated: 0, skipped: 0 },
            warnings: ['Proceed with upload to validate and import.'],
          })
          setShowValidationResult(true)
          setIsValidating(false)
          return
        } else {
          setFileError('Invalid data format. Expected JSON with Branches array or array of branches.')
          setIsValidating(false)
          return
        }

        // Basic structure validation
        const validationErrors: any[] = []
        branches.forEach((branch, index) => {
          const errors: string[] = []
          if (!branch.Branchcode && !branch.Code) {
            errors.push('Branchcode or Code is required')
          }
          if (!branch.Name) {
            errors.push('Name is required')
          }
          if (errors.length > 0) {
            validationErrors.push({
              index,
              branchCode: branch.Branchcode || branch.Code || 'UNKNOWN',
              branchName: branch.Name || 'UNKNOWN',
              error: {
                error: errors.join(', '),
                fields: errors,
              },
            })
          }
        })

        setValidationResult({
          message: validationErrors.length === 0 
            ? 'Data structure is valid' 
            : `${validationErrors.length} branch(es) have validation issues`,
          imported: 0,
          updated: 0,
          skipped: 0,
          total: branches.length,
          summary: {
            total: branches.length,
            valid: branches.length - validationErrors.length,
            invalid: validationErrors.length,
            imported: 0,
            updated: 0,
            skipped: 0,
          },
          validationErrors: validationErrors.length > 0 ? validationErrors : undefined,
          warnings: validationErrors.length > 0 
            ? [`${validationErrors.length} branch(es) have validation issues. You can still upload, but missing fields will be stored as null.`]
            : ['Data structure looks good! You can proceed with upload.'],
        })
        setShowValidationResult(true)
      }
    } catch (error: any) {
      console.error('Validation error:', error)
      setFileError(error.message || 'Failed to validate data')
    } finally {
      setIsValidating(false)
    }
  }

  const handleUpload = async () => {
    let content = ''
    let uploadFormat: 'CSV' | 'EXCEL' | null = null

    if (uploadMode === 'file' && selectedFile) {
      const name = selectedFile.name.toLowerCase()
      if (name.endsWith('.csv')) {
        content = await selectedFile.text()
        uploadFormat = 'CSV'
      } else if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
        const buffer = await selectedFile.arrayBuffer()
        const bytes = new Uint8Array(buffer)
        let binary = ''
        for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
        content = btoa(binary)
        uploadFormat = 'EXCEL'
      } else {
        content = await selectedFile.text()
      }
    } else if (uploadMode === 'paste' && pastedData.trim()) {
      content = pastedData.trim()
    } else {
      setFileError(uploadMode === 'file' ? 'Please select a file' : 'Please paste data')
      return
    }

    if (!content.trim() && !uploadFormat) {
      setFileError('No data provided')
      return
    }

    setIsUploading(true)
    setFileError(null)
    const defaultCountry = defaultCountryCode.trim() || undefined

    try {
      const { endpointsApi } = await import('../api/endpoints')

      // CSV or Excel: send rawContent + format + defaultCountryCode
      if (uploadFormat === 'CSV' || uploadFormat === 'EXCEL') {
        const result = await endpointsApi.uploadBranches({
          rawContent: content,
          format: uploadFormat,
          defaultCountryCode: defaultCountry,
        })
        if (result.validationErrors && result.validationErrors.length > 0) {
          setValidationResult(result)
          setShowValidationResult(true)
          toast.success(
            `Branches uploaded! ${result.imported} imported, ${result.updated} updated. ${result.validationErrors.length} had validation issues.`,
            { duration: 5000 }
          )
        } else {
          toast.success(
            `Branches uploaded successfully! ${result.imported} imported, ${result.updated} updated, ${result.total} total.`,
            { duration: 5000 }
          )
          setSelectedFile(null)
          setPastedData('')
          setValidationResult(null)
          setShowValidationResult(false)
          if (fileInputRef.current) fileInputRef.current.value = ''
          if (onSuccess) onSuccess()
          onClose()
        }
        setIsUploading(false)
        return
      }
      
      // Check if it's PHP var_dump or XML format first
      const isPhpVarDump = content.includes('array(') && content.includes('OTA_VehLocSearchRS')
      
      if (isPhpVarDump) {
        // For PHP var_dump format, send as rawContent object (backend will extract it)
        const result = await endpointsApi.uploadBranches({
          rawContent: content,
          ...(defaultCountry ? { defaultCountryCode: defaultCountry } : {}),
        })
        
        if (result.validationErrors && result.validationErrors.length > 0) {
          // Show validation results
          setValidationResult(result)
          setShowValidationResult(true)
          toast.success(
            `Branches uploaded! ${result.imported} imported, ${result.updated} updated. ${result.validationErrors.length} had validation issues.`,
            { duration: 5000 }
          )
        } else {
          toast.success(
            `Branches uploaded successfully! ${result.imported} imported, ${result.updated} updated, ${result.total} total.`,
            { duration: 5000 }
          )
          
          // Reset state and close
          setSelectedFile(null)
          setPastedData('')
          setValidationResult(null)
          setShowValidationResult(false)
          if (fileInputRef.current) {
            fileInputRef.current.value = ''
          }

          // Call success callback and close
          if (onSuccess) {
            onSuccess()
          }
          onClose()
        }
        setIsUploading(false)
        return
      }
      
      // Parse the data for JSON format
      const parsedData = await parseData(content)
      
      // Check if parsed data is still a string (not JSON) - send as rawContent
      if (typeof parsedData === 'string') {
        const result = await endpointsApi.uploadBranches({
          rawContent: parsedData,
          ...(defaultCountry ? { defaultCountryCode: defaultCountry } : {}),
        })
        
        if (result.validationErrors && result.validationErrors.length > 0) {
          setValidationResult(result)
          setShowValidationResult(true)
          toast.success(
            `Branches uploaded! ${result.imported} imported, ${result.updated} updated. ${result.validationErrors.length} had validation issues.`,
            { duration: 5000 }
          )
        } else {
          toast.success(
            `Branches uploaded successfully! ${result.imported} imported, ${result.updated} updated, ${result.total} total.`,
            { duration: 5000 }
          )
          
          setSelectedFile(null)
          setPastedData('')
          setValidationResult(null)
          setShowValidationResult(false)
          if (fileInputRef.current) {
            fileInputRef.current.value = ''
          }

          if (onSuccess) {
            onSuccess()
          }
          onClose()
        }
        setIsUploading(false)
        return
      }

      // For JSON format, upload normally
      const result = await endpointsApi.uploadBranches(parsedData)

      // Show validation results if any
      if (result.validationErrors && result.validationErrors.length > 0) {
        setValidationResult(result)
        setShowValidationResult(true)
        // Don't close modal - let user see validation results
        toast.success(
          `Branches uploaded! ${result.imported} imported, ${result.updated} updated. ${result.validationErrors.length} had validation issues.`,
          { duration: 5000 }
        )
      } else {
        toast.success(
          `Branches uploaded successfully! ${result.imported} imported, ${result.updated} updated, ${result.total} total.`,
          { duration: 5000 }
        )
        
        // Reset state and close
        setSelectedFile(null)
        setPastedData('')
        setValidationResult(null)
        setShowValidationResult(false)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }

        // Call success callback and close
        if (onSuccess) {
          onSuccess()
        }
        onClose()
      }
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
      const syntheticEvent = {
        target: { files: [file] },
      } as any
      handleFileSelect(syntheticEvent)
      setUploadMode('file')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] flex flex-col transform transition-all shadow-xl">
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
                  Upload branches from JSON, XML, PHP, CSV, or Excel — or paste data
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
            {/* Optional: default country for CSV/Excel or when missing in data */}
            <div className="max-w-xs">
              <Input
                value={defaultCountryCode}
                onChange={(e) => setDefaultCountryCode(e.target.value.toUpperCase().slice(0, 3))}
                placeholder="Default country code (e.g. AE, US)"
                helperText="Optional. Used for CSV/Excel when a row has no country, or to map branches to a country."
                maxLength={3}
              />
            </div>

            {/* Mode Tabs */}
            <div className="flex gap-2 border-b border-gray-200">
              <button
                onClick={() => {
                  setUploadMode('file')
                  setFileError(null)
                  setValidationResult(null)
                  setShowValidationResult(false)
                }}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  uploadMode === 'file'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FileJson className="w-4 h-4" />
                  Upload File
                </div>
              </button>
              <button
                onClick={() => {
                  setUploadMode('paste')
                  setFileError(null)
                  setValidationResult(null)
                  setShowValidationResult(false)
                }}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  uploadMode === 'paste'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Clipboard className="w-4 h-4" />
                  Paste Data
                </div>
              </button>
            </div>

            {/* File Upload Area */}
            {uploadMode === 'file' && (
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
                  accept=".json,.xml,.txt,.php,.csv,.xlsx,.xls,application/json,text/xml,text/plain,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
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
                        setValidationResult(null)
                        setShowValidationResult(false)
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
                        Click to select a file
                      </label>
                      <p className="text-sm text-gray-500 mt-2">or drag and drop</p>
                      <p className="text-xs text-gray-400 mt-2">
                        Max 5MB. Supported: JSON, XML, PHP, CSV, Excel (.xlsx, .xls). For CSV/Excel columns see Configure Branch Endpoint → Expected structure.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Paste Data Area */}
            {uploadMode === 'paste' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700">
                    Paste your data here (JSON, OTA XML, PHP var_dump, or CSV)
                  </label>
                  {/* View Type Selector */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-gray-500">View:</span>
                    <div className="flex flex-wrap gap-1 border border-gray-300 rounded-lg overflow-hidden">
                      {(['raw', 'json', 'xml', 'php', 'csv', 'formatted'] as const).map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setViewType(v)}
                          className={`px-2 py-1 text-xs font-medium transition-colors capitalize ${
                            viewType === v ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {v === 'raw' ? 'Raw' : v === 'formatted' ? 'Auto' : v}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Editor/Preview Area */}
                <div className="relative border border-gray-300 rounded-lg overflow-hidden">
                  {viewType === 'raw' ? (
                    <textarea
                      value={pastedData}
                      onChange={(e) => {
                        setPastedData(e.target.value)
                        setFileError(null)
                        setValidationResult(null)
                        setShowValidationResult(false)
                      }}
                      placeholder={`Paste your data here...

Supported: JSON, OTA XML, PHP var_dump, or CSV (header row + data).
See "Standard format samples" below for each format.`}
                      className="w-full h-64 p-4 font-mono text-sm resize-y focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                    />
                  ) : (
                    <div className="relative">
                      <textarea
                        value={pastedData}
                        onChange={(e) => {
                          setPastedData(e.target.value)
                          setFileError(null)
                          setValidationResult(null)
                          setShowValidationResult(false)
                        }}
                        className="absolute inset-0 w-full h-64 p-4 font-mono text-sm resize-y focus:ring-2 focus:ring-blue-500 focus:outline-none bg-transparent text-transparent caret-blue-600"
                        style={{ zIndex: 1 }}
                        spellCheck={false}
                      />
                      <pre className="absolute inset-0 w-full h-64 p-4 font-mono text-sm overflow-auto bg-gray-900 text-gray-100 pointer-events-none" style={{ zIndex: 0 }}>
                        <code>{formattedPreview || pastedData || 'Paste your data here...'}</code>
                      </pre>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <p>
                    Supports JSON, OTA XML, PHP var_dump, and CSV. Use Validate to check structure before uploading.
                  </p>
                  {pastedData.trim() && (
                    <p className="text-blue-600">
                      {pastedData.length} characters
                    </p>
                  )}
                </div>
              </div>
            )}

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

            {/* Validation Result */}
            {showValidationResult && validationResult && (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {validationResult.summary.invalid === 0 ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-yellow-600" />
                    )}
                    <span className="font-semibold text-gray-900">Validation Results</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowValidationResult(false)
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <div className="p-4">
                  <ValidationErrorsDisplay
                    summary={validationResult.summary}
                    validationErrors={validationResult.validationErrors || []}
                    message={validationResult.message}
                  />
                </div>
              </div>
            )}

            {/* Format Information - Standard samples for validation */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-blue-900 mb-2">Supported formats &amp; standard structure</p>
              <p className="text-xs text-blue-800 mb-3">Data must match one of these formats. Use &quot;Validate Data&quot; to check before upload (JSON is validated in-browser; XML/PHP/CSV/Excel are validated on upload).</p>
              <div className="flex flex-wrap gap-1 mb-3">
                {(['json', 'xml', 'csv', 'php', 'excel'] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setFormatSampleTab(tab)}
                    className={`px-2 py-1 rounded text-xs font-medium uppercase ${formatSampleTab === tab ? 'bg-blue-600 text-white' : 'bg-white text-blue-800 border border-blue-200 hover:bg-blue-100'}`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              <div className="space-y-2 text-xs text-blue-800">
                {formatSampleTab === 'json' && (
                  <div>
                    <strong>JSON</strong> — <code>CompanyCode</code> + <code>Branches</code> array, or OTA <code>OTA_VehLocSearchRS</code> / <code>gloria</code>:
                    <pre className="mt-1 bg-white p-2 rounded border border-blue-100 overflow-x-auto text-gray-800 font-mono whitespace-pre">
{`{
  "CompanyCode": "CMP00023",
  "Branches": [
    {
      "Branchcode": "BR001",
      "Name": "Airport Branch",
      "AtAirport": "true",
      "LocationType": "AIRPORT",
      "CollectionType": "AIRPORT",
      "Latitude": 53.3656,
      "Longitude": -2.2729,
      "Address": {
        "AddressLine": "123 Main St",
        "CityName": "Manchester",
        "PostalCode": "M1 1AA",
        "CountryName": { "value": "United Kingdom", "attr": { "Code": "GB" } }
      },
      "Telephone": { "attr": { "PhoneNumber": "+441234567890" } },
      "EmailAddress": "branch@example.com"
    }
  ]
}`}
                    </pre>
                  </div>
                )}
                {formatSampleTab === 'xml' && (
                  <div>
                    <strong>OTA XML</strong> — <code>OTA_VehLocSearchRS</code> with <code>VehMatchedLocs</code> / <code>LocationDetail</code>:
                    <pre className="mt-1 bg-white p-2 rounded border border-blue-100 overflow-x-auto text-gray-800 font-mono whitespace-pre text-[11px]">
{`<OTA_VehLocSearchRS>
  <VehMatchedLocs>
    <VehMatchedLoc>
      <LocationDetail Code="BR001" Name="Airport Branch" AtAirport="true"
        Latitude="53.3656" Longitude="-2.2729" LocationType="AIRPORT">
        <Address>
          <AddressLine>123 Main St</AddressLine>
          <CityName>Manchester</CityName>
          <PostalCode>M1 1AA</PostalCode>
          <CountryName Code="GB">United Kingdom</CountryName>
        </Address>
        <Telephone PhoneNumber="+441234567890"/>
      </LocationDetail>
    </VehMatchedLoc>
  </VehMatchedLocs>
</OTA_VehLocSearchRS>`}
                    </pre>
                  </div>
                )}
                {formatSampleTab === 'csv' && (
                  <div>
                    <strong>CSV</strong> — First row = headers (case-insensitive). Use <strong>Default country code</strong> above if column is missing:
                    <pre className="mt-1 bg-white p-2 rounded border border-blue-100 overflow-x-auto text-gray-800 font-mono whitespace-pre">
{`Branchcode,Name,CountryCode,Country,City,AddressLine,PostalCode,Latitude,Longitude,AtAirport,LocationType,Phone,Email
BR001,Airport Branch,GB,United Kingdom,Manchester,123 Main St,M1 1AA,53.3656,-2.2729,true,AIRPORT,+441234567890,branch@example.com
BR002,City Branch,GB,United Kingdom,London,456 High St,SW1A 1AA,51.5074,-0.1278,false,CITY,+442071234567,city@example.com`}
                    </pre>
                    <p className="mt-1 text-blue-700">Accepted column aliases: Code/Branchcode, CityName/City, AddressLine/Address, Phone/Telephone, Email/EmailAddress, Lat/Latitude, Lon/Longitude.</p>
                  </div>
                )}
                {formatSampleTab === 'php' && (
                  <div>
                    <strong>PHP var_dump</strong> — Same structure as OTA (OTA_VehLocSearchRS, VehMatchedLocs, LocationDetail). Often from endpoint, not file:
                    <pre className="mt-1 bg-white p-2 rounded border border-blue-100 overflow-x-auto text-gray-800 font-mono whitespace-pre text-[11px]">
{`array(1) {
  ["OTA_VehLocSearchRS"]=> array(1) {
    ["VehMatchedLocs"]=> array(1) {
      [0]=> array(1) {
        ["VehMatchedLoc"]=> array(1) {
          ["LocationDetail"]=> array(2) {
            ["attr"]=> array(6) {
              ["Code"]=> string(5) "BR001"
              ["Name"]=> string(14) "Airport Branch"
              ["AtAirport"]=> string(4) "true"
              ["Latitude"]=> string(7) "53.3656"
              ["Longitude"]=> string(8) "-2.2729"
            }
            ["Address"]=> array(3) { ... }
          }
        }
      }
    }
  }
}`}
                    </pre>
                  </div>
                )}
                {formatSampleTab === 'excel' && (
                  <div>
                    <strong>Excel (.xlsx / .xls)</strong> — Same columns as CSV. First row = headers, one branch per row:
                    <pre className="mt-1 bg-white p-2 rounded border border-blue-100 overflow-x-auto text-gray-800 font-mono">
{`| Branchcode | Name           | CountryCode | City      | Latitude | Longitude | AtAirport | Phone          | Email             |
|------------|----------------|-------------|-----------|----------|-----------|-----------|----------------|-------------------|
| BR001      | Airport Branch | GB          | Manchester| 53.3656  | -2.2729   | true      | +441234567890  | branch@example.com|
| BR002      | City Branch    | GB          | London    | 51.5074  | -0.1278   | false     | +442071234567  | city@example.com  |`}
                    </pre>
                    <p className="mt-1 text-blue-700">Use the same column names as CSV (Branchcode, Name, CountryCode, City, etc.). Upload as file; paste not supported for Excel.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
        {/* Action Buttons - Fixed at bottom */}
        <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <Button
              variant="secondary"
              onClick={handleValidate}
              disabled={isValidating || isUploading || (uploadMode === 'file' && !selectedFile) || (uploadMode === 'paste' && !pastedData.trim())}
              loading={isValidating}
              className="flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              Validate Data
            </Button>
            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                onClick={onClose}
                disabled={isUploading || isValidating}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleUpload}
                loading={isUploading}
                disabled={
                  isUploading || 
                  isValidating ||
                  (uploadMode === 'file' && !selectedFile) || 
                  (uploadMode === 'paste' && !pastedData.trim())
                }
                className="flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Upload Branches
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
