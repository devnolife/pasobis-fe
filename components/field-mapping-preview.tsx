"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  ArrowRight,
  Settings,
  Eye,
  FileText,
  Zap
} from "lucide-react"
import { FieldMapping, DetectionResult, TARGET_FIELDS } from "@/lib/field-detector"

interface FieldMappingPreviewProps {
  detectionResult: DetectionResult
  sampleData: string[][]
  onMappingChange: (mappings: FieldMapping[]) => void
  onConfirm: () => void
  onCancel: () => void
}

export function FieldMappingPreview({
  detectionResult,
  sampleData,
  onMappingChange,
  onConfirm,
  onCancel
}: FieldMappingPreviewProps) {
  const [mappings, setMappings] = useState<FieldMapping[]>(detectionResult.mappings)
  const [showAdvanced, setShowAdvanced] = useState(false)

  const handleMappingChange = (sourceColumn: string, newTargetField: string) => {
    const newMappings = mappings.map(mapping => {
      if (mapping.sourceColumn === sourceColumn) {
        return {
          ...mapping,
          targetField: newTargetField,
          confidence: newTargetField === mapping.targetField ? mapping.confidence : 0.5
        }
      }
      return mapping
    })

    setMappings(newMappings)
    onMappingChange(newMappings)
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "bg-green-100 text-green-800 border-green-200"
    if (confidence >= 0.6) return "bg-yellow-100 text-yellow-800 border-yellow-200"
    return "bg-red-100 text-red-800 border-red-200"
  }

  const getConfidenceIcon = (confidence: number) => {
    if (confidence >= 0.8) return <CheckCircle className="w-4 h-4" />
    if (confidence >= 0.6) return <AlertTriangle className="w-4 h-4" />
    return <XCircle className="w-4 h-4" />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-0 shadow-md bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl">
        <CardHeader className="pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
              <Eye className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-gray-900">Preview Pemetaan Field</CardTitle>
              <CardDescription className="text-gray-600">
                Periksa dan sesuaikan pemetaan field sebelum memproses data
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-3">
            <Badge variant="outline" className="bg-white">
              {mappings.length} field dipetakan
            </Badge>
            <Badge variant="outline" className="bg-white">
              {sampleData.length} baris data
            </Badge>
            <Badge
              variant="outline"
              className={`${getConfidenceColor(detectionResult.confidence)} border`}
            >
              {Math.round(detectionResult.confidence * 100)}% akurasi
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Errors and Warnings */}
      {detectionResult.errors.length > 0 && (
        <Alert className="bg-red-50 border-red-200 text-red-800 rounded-xl">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="font-medium mb-2">Error yang ditemukan:</div>
            <ul className="list-disc list-inside space-y-1 text-sm">
              {detectionResult.errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {detectionResult.warnings.length > 0 && (
        <Alert className="bg-yellow-50 border-yellow-200 text-yellow-800 rounded-xl">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="font-medium mb-2">Peringatan:</div>
            <ul className="list-disc list-inside space-y-1 text-sm">
              {detectionResult.warnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Field Mappings */}
      <Card className="border-0 shadow-md bg-white rounded-2xl">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg">
                <ArrowRight className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-gray-900">Pemetaan Field</CardTitle>
                <CardDescription className="text-gray-600">
                  Field CSV/XLSX → Field Target
                </CardDescription>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="rounded-xl"
            >
              <Settings className="w-4 h-4 mr-2" />
              {showAdvanced ? 'Sembunyikan' : 'Lanjutan'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mappings.map((mapping, index) => (
              <div key={index} className="p-4 border-2 border-gray-200 rounded-xl hover:border-blue-300 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-gray-500" />
                      <span className="font-medium text-gray-900">{mapping.sourceColumn}</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                    <div className="flex items-center space-x-2">
                      <Zap className="w-4 h-4 text-blue-500" />
                      <span className="font-medium text-blue-700">{mapping.targetField}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getConfidenceIcon(mapping.confidence)}
                    <Badge className={getConfidenceColor(mapping.confidence)}>
                      {Math.round(mapping.confidence * 100)}%
                    </Badge>
                  </div>
                </div>

                {showAdvanced && (
                  <div className="space-y-3 pt-3 border-t border-gray-200">
                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-2 block">
                        Ubah Target Field
                      </Label>
                      <Select
                        value={mapping.targetField}
                        onValueChange={(value) => handleMappingChange(mapping.sourceColumn, value)}
                      >
                        <SelectTrigger className="w-full rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TARGET_FIELDS.map((field) => (
                            <SelectItem key={field.key} value={field.key}>
                              {field.key} {field.required && <span className="text-red-500">*</span>}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-2 block">
                        Contoh Data
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {mapping.sampleValues.slice(0, 3).map((value, idx) => (
                          <Badge key={idx} variant="outline" className="bg-gray-50">
                            {value || '(kosong)'}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Unmapped Columns */}
      {detectionResult.unmappedColumns.length > 0 && (
        <Card className="border-0 shadow-md bg-gray-50 rounded-2xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-bold text-gray-700">
              Kolom yang Tidak Dipetakan
            </CardTitle>
            <CardDescription className="text-gray-600">
              Kolom ini tidak akan diproses karena tidak cocok dengan field target
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {detectionResult.unmappedColumns.map((column, index) => (
                <Badge key={index} variant="outline" className="bg-white border-gray-300">
                  {column}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <Card className="border-0 shadow-md bg-gradient-to-r from-gray-50 to-white rounded-2xl">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-end">
            <Button
              variant="outline"
              onClick={onCancel}
              className="flex-1 sm:flex-none h-12 px-6 border-2 border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 text-gray-700 rounded-xl transition-all duration-200"
            >
              Batal
            </Button>
            <Button
              onClick={onConfirm}
              disabled={detectionResult.errors.length > 0}
              className="flex-1 sm:flex-none h-12 px-8 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 hover:from-blue-600 hover:via-indigo-600 hover:to-purple-600 text-white font-bold rounded-xl transition-all duration-200 transform hover:scale-105 disabled:transform-none shadow-lg hover:shadow-xl"
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              Konfirmasi & Proses
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 
