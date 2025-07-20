"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import {
  Upload,
  FileSpreadsheet,
  FileText,
  CheckCircle,
  AlertTriangle,
  Loader2,
  X,
  BarChart3
} from "lucide-react"
import { parseXLSX } from "@/lib/xlsx-parser"
import { parseCSV } from "@/lib/field-detector"
import { analyzeFileStructure, FileAnalysisResult, validateAnalysisResult } from "@/lib/field-analyzer"
import { FieldAnalysisDisplay } from "@/components/field-analysis-display"

interface FileAnalyzerUploadProps {
  onAnalysisComplete?: (result: FileAnalysisResult) => void
  onFileProcessed?: (data: { headers: string[]; data: string[][] }) => void
  maxFileSize?: number // in MB
  acceptedFileTypes?: string[]
}

export function FileAnalyzerUpload({
  onAnalysisComplete,
  onFileProcessed,
  maxFileSize = 10,
  acceptedFileTypes = ['.xlsx', '.xls', '.csv']
}: FileAnalyzerUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<FileAnalysisResult | null>(null)
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean
    errors: string[]
    warnings: string[]
  } | null>(null)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [parseError, setParseError] = useState<string | null>(null)

  const { toast } = useToast()

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxFileSize * 1024 * 1024) {
      return `File size exceeds ${maxFileSize}MB limit`
    }

    // Check file type
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
    if (!acceptedFileTypes.includes(fileExtension)) {
      return `File type not supported. Accepted types: ${acceptedFileTypes.join(', ')}`
    }

    return null
  }

  const processFile = async (file: File) => {
    setIsProcessing(true)
    setUploadProgress(0)
    setParseError(null)
    setAnalysisResult(null)
    setValidationResult(null)

    try {
      setUploadProgress(25)

      let headers: string[] = []
      let data: string[][] = []

      const fileExtension = file.name.split('.').pop()?.toLowerCase()

      if (fileExtension === 'csv') {
        // Parse CSV
        const text = await file.text()
        setUploadProgress(50)
        const csvResult = parseCSV(text)
        headers = csvResult.headers
        data = csvResult.data
      } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        // Parse Excel
        setUploadProgress(50)
        const xlsxResult = await parseXLSX(file)
        headers = xlsxResult.headers
        data = xlsxResult.data
      } else {
        throw new Error('Unsupported file format')
      }

      setUploadProgress(75)

      // Analyze file structure
      const analysis = analyzeFileStructure(headers, data, file.name, file.size)
      setAnalysisResult(analysis)

      // Validate analysis
      const validation = validateAnalysisResult(analysis)
      setValidationResult(validation)

      setUploadProgress(100)

      // Call callbacks
      onFileProcessed?.({ headers, data })
      onAnalysisComplete?.(analysis)

      // Show success toast
      toast({
        title: "File analyzed successfully",
        description: `Processed ${analysis.summary.totalRecords} records with ${analysis.metadata.confidence}% confidence`,
      })

    } catch (error) {
      console.error('File processing error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to process file'
      setParseError(errorMessage)
      toast({
        title: "Processing failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleFileSelect = async (file: File) => {
    const validationError = validateFile(file)
    if (validationError) {
      setParseError(validationError)
      toast({
        title: "Invalid file",
        description: validationError,
        variant: "destructive",
      })
      return
    }

    setUploadedFile(file)
    await processFile(file)
  }

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      await handleFileSelect(files[0])
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      await handleFileSelect(files[0])
    }
  }

  const resetUpload = () => {
    setUploadedFile(null)
    setAnalysisResult(null)
    setValidationResult(null)
    setParseError(null)
    setUploadProgress(0)
    setIsProcessing(false)
  }

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase()
    if (extension === 'csv') return <FileText className="w-8 h-8 text-green-500" />
    if (extension === 'xlsx' || extension === 'xls') return <FileSpreadsheet className="w-8 h-8 text-blue-500" />
    return <FileSpreadsheet className="w-8 h-8 text-gray-500" />
  }

  // If analysis is complete, show the analysis display
  if (analysisResult) {
    return (
      <div className="space-y-4">
        {/* Quick Summary Card */}
        <Card className="border-0 shadow-sm bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-6 h-6 text-green-500" />
                <div>
                  <h3 className="font-semibold text-green-900">Analysis Complete</h3>
                  <p className="text-sm text-green-700">
                    {uploadedFile?.name} processed successfully
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Badge variant="outline" className="bg-white">
                  {analysisResult.metadata.confidence}% confidence
                </Badge>
                <Button variant="outline" size="sm" onClick={resetUpload}>
                  <X className="w-4 h-4 mr-2" />
                  Upload New File
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Validation Warnings/Errors */}
        {validationResult && (
          <div className="space-y-2">
            {validationResult.errors.length > 0 && (
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-semibold text-red-800 mb-1">Critical Issues:</div>
                  <ul className="text-red-700 text-sm space-y-1">
                    {validationResult.errors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
            {validationResult.warnings.length > 0 && (
              <Alert className="border-yellow-200 bg-yellow-50">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-semibold text-yellow-800 mb-1">Warnings:</div>
                  <ul className="text-yellow-700 text-sm space-y-1">
                    {validationResult.warnings.map((warning, index) => (
                      <li key={index}>• {warning}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Full Analysis Display */}
        <FieldAnalysisDisplay
          analysisResult={analysisResult}
          onClose={resetUpload}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card
        className={`border-2 border-dashed rounded-2xl transition-all duration-200 ${isDragging
            ? 'border-blue-400 bg-blue-50 scale-105'
            : 'border-gray-300 hover:border-gray-400'
          }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <CardContent className="p-8">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center mb-4">
              <Upload className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Upload Student Data File
            </h3>
            <p className="text-gray-600 mb-6">
              Drag and drop your Excel or CSV file here, or click to browse
            </p>
            <div className="space-y-4">
              <Button
                className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
                onClick={() => document.getElementById('file-input')?.click()}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Analyze File Structure
                  </>
                )}
              </Button>
              <input
                id="file-input"
                type="file"
                accept={acceptedFileTypes.join(',')}
                onChange={handleFileInputChange}
                className="hidden"
                title="Upload file for analysis"
                aria-label="Upload Excel or CSV file for student data analysis"
              />
            </div>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                Excel (.xlsx, .xls)
              </Badge>
              <Badge variant="outline" className="bg-green-50 text-green-700">
                CSV (.csv)
              </Badge>
              <Badge variant="outline" className="bg-gray-50 text-gray-700">
                Max {maxFileSize}MB
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Processing Progress */}
      {isProcessing && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                <span className="font-medium">Analyzing file structure...</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
              <div className="flex justify-between text-sm text-gray-500">
                <span>Processing {uploadedFile?.name}</span>
                <span>{uploadProgress}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Uploaded File Info */}
      {uploadedFile && !isProcessing && !analysisResult && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              {getFileIcon(uploadedFile.name)}
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{uploadedFile.name}</h4>
                <p className="text-sm text-gray-500">
                  {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={resetUpload}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {parseError && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="font-semibold text-red-800 mb-1">Processing Error</div>
            <div className="text-red-700 text-sm">{parseError}</div>
          </AlertDescription>
        </Alert>
      )}

      {/* Instructions */}
      <Card className="bg-gray-50 border-0">
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <FileSpreadsheet className="w-5 h-5 mr-2" />
            Expected File Structure
          </CardTitle>
          <CardDescription>
            The analyzer will automatically detect these field types:
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-700">Required Fields:</div>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• <strong>nama/name:</strong> Student name (unique)</li>
                <li>• <strong>hp_mahasiswa/phone:</strong> Phone number</li>
                <li>• <strong>pilihan1:</strong> First program choice</li>
              </ul>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-700">Optional Fields:</div>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• <strong>pilihan2:</strong> Second program choice</li>
                <li>• <strong>pilihan3:</strong> Third program choice</li>
                <li>• <strong>prodi_lulus:</strong> Previous major</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
