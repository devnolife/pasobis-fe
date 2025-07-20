"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  FileSpreadsheet,
  BarChart3,
  Eye,
  ChevronDown,
  ChevronRight,
  Phone,
  Mail,
  Hash,
  Calendar,
  Tags,
  Type,
  Download,
  Copy
} from "lucide-react"
import { FileAnalysisResult, FieldAnalysis } from "@/lib/field-analyzer"

interface FieldAnalysisDisplayProps {
  analysisResult: FileAnalysisResult
  onClose?: () => void
  onProceed?: () => void
}

export function FieldAnalysisDisplay({
  analysisResult,
  onClose,
  onProceed
}: FieldAnalysisDisplayProps) {
  const [expandedFields, setExpandedFields] = useState<Set<string>>(new Set())
  const [showRawJson, setShowRawJson] = useState(false)

  const toggleFieldExpansion = (fieldKey: string) => {
    const newExpanded = new Set(expandedFields)
    if (newExpanded.has(fieldKey)) {
      newExpanded.delete(fieldKey)
    } else {
      newExpanded.add(fieldKey)
    }
    setExpandedFields(newExpanded)
  }

  const getFieldTypeIcon = (type: FieldAnalysis['type']) => {
    switch (type) {
      case 'phone': return <Phone className="w-4 h-4" />
      case 'email': return <Mail className="w-4 h-4" />
      case 'numeric': return <Hash className="w-4 h-4" />
      case 'date': return <Calendar className="w-4 h-4" />
      case 'categorical': return <Tags className="w-4 h-4" />
      default: return <Type className="w-4 h-4" />
    }
  }

  const getFieldTypeColor = (type: FieldAnalysis['type']) => {
    switch (type) {
      case 'phone': return 'bg-green-100 text-green-800 border-green-200'
      case 'email': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'numeric': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'date': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'categorical': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getFillRateColor = (fillRate: string) => {
    const percentage = parseInt(fillRate.replace('%', ''))
    if (percentage >= 90) return 'text-green-600'
    if (percentage >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const downloadJson = () => {
    const blob = new Blob([JSON.stringify(analysisResult, null, 2)], {
      type: 'application/json'
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `field-analysis-${analysisResult.summary.fileName}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-gray-900">
                  Field Structure Analysis
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Detailed analysis of {analysisResult.summary.fileName}
                </CardDescription>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={downloadJson}
                className="bg-white"
              >
                <Download className="w-4 h-4 mr-2" />
                Export JSON
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowRawJson(!showRawJson)}
                className="bg-white"
              >
                <Eye className="w-4 h-4 mr-2" />
                {showRawJson ? 'Hide' : 'Show'} Raw
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-3">
            <Badge variant="outline" className="bg-white">
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              {analysisResult.summary.totalRecords} records
            </Badge>
            <Badge variant="outline" className="bg-white">
              {analysisResult.summary.totalFields} fields
            </Badge>
            <Badge variant="outline" className="bg-white">
              {analysisResult.metadata.confidence}% confidence
            </Badge>
            {analysisResult.summary.fileSize && (
              <Badge variant="outline" className="bg-white">
                {analysisResult.summary.fileSize}
              </Badge>
            )}
            <Badge variant="outline" className="bg-white">
              {analysisResult.metadata.processingTime}ms
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Issues and Recommendations */}
      {(analysisResult.issues.length > 0 || analysisResult.recommendations.length > 0) && (
        <div className="grid md:grid-cols-2 gap-4">
          {analysisResult.issues.length > 0 && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="font-semibold text-red-800 mb-2">Issues Found:</div>
                <ul className="space-y-1 text-red-700">
                  {analysisResult.issues.map((issue, index) => (
                    <li key={index} className="text-sm">• {issue}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {analysisResult.recommendations.length > 0 && (
            <Alert className="border-blue-200 bg-blue-50">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="font-semibold text-blue-800 mb-2">Recommendations:</div>
                <ul className="space-y-1 text-blue-700">
                  {analysisResult.recommendations.map((rec, index) => (
                    <li key={index} className="text-sm">• {rec}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      <Tabs defaultValue="analysis" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="analysis">Field Analysis</TabsTrigger>
          <TabsTrigger value="raw">Raw JSON</TabsTrigger>
        </TabsList>

        <TabsContent value="analysis" className="space-y-4">
          {/* Field Details */}
          <div className="space-y-4">
            {Object.entries(analysisResult.fields).map(([fieldKey, analysis]) => (
              <Card key={fieldKey} className="border border-gray-200 rounded-xl shadow-sm">
                <Collapsible>
                  <CollapsibleTrigger
                    onClick={() => toggleFieldExpansion(fieldKey)}
                    className="w-full"
                  >
                    <CardHeader className="pb-3 hover:bg-gray-50 transition-colors rounded-t-xl">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-2">
                            {expandedFields.has(fieldKey) ?
                              <ChevronDown className="w-4 h-4" /> :
                              <ChevronRight className="w-4 h-4" />
                            }
                            {getFieldTypeIcon(analysis.type)}
                          </div>
                          <div className="text-left">
                            <CardTitle className="text-lg font-semibold text-gray-900">
                              {fieldKey}
                            </CardTitle>
                            <CardDescription className="flex items-center space-x-2">
                              <Badge className={getFieldTypeColor(analysis.type)} variant="outline">
                                {analysis.type}
                              </Badge>
                              {analysis.required && (
                                <Badge variant="destructive" className="text-xs">
                                  Required
                                </Badge>
                              )}
                              {analysis.unique && (
                                <Badge variant="secondary" className="text-xs">
                                  Unique
                                </Badge>
                              )}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-lg font-bold ${getFillRateColor(analysis.fillRate)}`}>
                            {analysis.fillRate}
                          </div>
                          <div className="text-sm text-gray-500">fill rate</div>
                        </div>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <CardContent className="pt-0">
                      <div className="space-y-4">
                        {/* Fill Rate Progress */}
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span>Data Completeness</span>
                            <span>{analysis.fillRate}</span>
                          </div>
                          <Progress
                            value={parseInt(analysis.fillRate.replace('%', ''))}
                            className="h-2"
                          />
                          <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>{analysis.totalRecords - analysis.emptyCount} filled</span>
                            <span>{analysis.emptyCount} empty</span>
                          </div>
                        </div>

                        {/* Statistics Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <div className="text-2xl font-bold text-gray-900">
                              {analysis.totalRecords}
                            </div>
                            <div className="text-sm text-gray-600">Total Records</div>
                          </div>
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <div className="text-2xl font-bold text-gray-900">
                              {analysis.uniqueCount || 0}
                            </div>
                            <div className="text-sm text-gray-600">Unique Values</div>
                          </div>
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <div className="text-2xl font-bold text-gray-900">
                              {analysis.emptyCount}
                            </div>
                            <div className="text-sm text-gray-600">Empty Values</div>
                          </div>
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <div className="text-2xl font-bold text-gray-900">
                              {analysis.samples.length}
                            </div>
                            <div className="text-sm text-gray-600">Samples</div>
                          </div>
                        </div>

                        {/* Type-specific Information */}
                        {analysis.pattern && (
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2">Pattern</h4>
                            <Badge variant="outline" className="bg-blue-50 text-blue-800">
                              {analysis.pattern}
                            </Badge>
                          </div>
                        )}

                        {/* Sample Values */}
                        {analysis.samples.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2">Sample Values</h4>
                            <div className="flex flex-wrap gap-2">
                              {analysis.samples.map((sample, index) => (
                                <Badge
                                  key={index}
                                  variant="outline"
                                  className="bg-gray-50 text-gray-700 max-w-48 truncate"
                                  title={sample}
                                >
                                  {sample}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Categorical Values */}
                        {analysis.values && analysis.values.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2">
                              Categorical Values ({analysis.values.length})
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {analysis.values.map((value, index) => (
                                <Badge
                                  key={index}
                                  variant="secondary"
                                  className="max-w-48 truncate"
                                  title={value}
                                >
                                  {value}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Field Issues */}
                        {analysis.issues && analysis.issues.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-red-700 mb-2 flex items-center">
                              <XCircle className="w-4 h-4 mr-2" />
                              Field Issues
                            </h4>
                            <ul className="space-y-1">
                              {analysis.issues.map((issue, index) => (
                                <li key={index} className="text-sm text-red-600 flex items-center">
                                  <span className="w-2 h-2 bg-red-400 rounded-full mr-2"></span>
                                  {issue}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="raw" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Raw JSON Output</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(JSON.stringify(analysisResult, null, 2))}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-100 p-4 rounded-lg overflow-auto text-sm">
                <code>{JSON.stringify(analysisResult, null, 2)}</code>
              </pre>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      {(onClose || onProceed) && (
        <div className="flex justify-end space-x-3 pt-4 border-t">
          {onClose && (
            <Button variant="outline" onClick={onClose}>
              Close Analysis
            </Button>
          )}
          {onProceed && (
            <Button onClick={onProceed} className="bg-gradient-to-r from-blue-500 to-indigo-500">
              Proceed with Data
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
