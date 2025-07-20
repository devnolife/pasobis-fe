"use client"

import { useState, useCallback, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import {
  Upload,
  FileSpreadsheet,
  Send,
  CheckCircle,
  AlertTriangle,
  Loader2,
  X,
  Users,
  MessageCircle,
  Settings,
  Play,
  Pause,
  Search,
  Download,
  Eye,
  Clock,
  Hash
} from "lucide-react"
import { parseXLSX, ParsedFileData } from "@/lib/xlsx-parser"
import { parseCSV } from "@/lib/field-detector"
import { analyzeFileStructure, FileAnalysisResult } from "@/lib/field-analyzer"

interface Student {
  id: string
  nama: string
  nomor_hp: string
  pilihan1: string
  pilihan2: string
  pilihan3: string
  prodi_lulus?: string
  selected: boolean
  status?: 'pending' | 'sending' | 'sent' | 'failed'
}

interface BroadcastSettings {
  delayBetweenMessages: number // in seconds
  batchSize: number // how many numbers to send at once
  message: string
}

export function WhatsappBroadcastManager() {
  const [students, setStudents] = useState<Student[]>([])
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [isBroadcasting, setIsBroadcasting] = useState(false)
  const [broadcastPaused, setBroadcastPaused] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCount, setSelectedCount] = useState(0)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [analysisResult, setAnalysisResult] = useState<FileAnalysisResult | null>(null)
  const [currentStep, setCurrentStep] = useState<'upload' | 'preview' | 'broadcast'>('upload')
  const [broadcastProgress, setBroadcastProgress] = useState(0)
  const [currentBatchIndex, setCurrentBatchIndex] = useState(0)

  const [isDragging, setIsDragging] = useState(false)
  const [broadcastSettings, setBroadcastSettings] = useState<BroadcastSettings>({
    delayBetweenMessages: 3,
    batchSize: 10,
    message: "Halo {nama}, terima kasih telah mendaftar. Pilihan program studi Anda: {pilihan1}, {pilihan2}, {pilihan3}."
  })

  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  // Cleanup function to prevent memory leaks
  const cleanup = useCallback(() => {
    setStudents([])
    setFilteredStudents([])
    setUploadedFile(null)
    setAnalysisResult(null)
    setSelectedCount(0)
    setSearchTerm("")
    setBroadcastProgress(0)
    setCurrentBatchIndex(0)
    setIsBroadcasting(false)
    setBroadcastPaused(false)
  }, [])

  const handleFileUpload = useCallback(async (file: File) => {
    // Prevent multiple simultaneous uploads
    if (isUploading) {
      return
    }

    setIsUploading(true)
    setUploadedFile(file)

    try {
      console.log('Processing file:', file.name, 'Size:', file.size)

      // Validate file before processing
      if (!file) {
        throw new Error('File tidak valid')
      }

      // Check file size (max 50MB to prevent memory issues)
      if (file.size > 50 * 1024 * 1024) {
        throw new Error('File terlalu besar. Maksimal 50MB.')
      }

      let headers: string[] = []
      let data: string[][] = []

      const fileExtension = file.name.split('.').pop()?.toLowerCase()
      console.log('File extension:', fileExtension)

      if (fileExtension === 'csv') {
        try {
          const text = await file.text()
          console.log('CSV text length:', text.length)

          if (!text || text.trim().length === 0) {
            throw new Error('File CSV kosong')
          }

          const csvResult = parseCSV(text)
          headers = csvResult.headers
          data = csvResult.data
        } catch (csvError) {
          console.error('CSV parsing error:', csvError)
          throw new Error('Gagal memproses file CSV: ' + (csvError instanceof Error ? csvError.message : 'Format tidak valid'))
        }
      } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        try {
          console.log('Processing Excel file...')
          const xlsxResult = await parseXLSX(file)
          headers = xlsxResult.headers
          data = xlsxResult.data
        } catch (xlsxError) {
          console.error('XLSX parsing error:', xlsxError)
          throw new Error('Gagal memproses file Excel: ' + (xlsxError instanceof Error ? xlsxError.message : 'Format tidak valid'))
        }
      } else {
        throw new Error('Format file tidak didukung. Gunakan .csv, .xlsx, atau .xls')
      }

      if (!headers || headers.length === 0) {
        throw new Error('File tidak memiliki header yang valid')
      }

      if (!data || data.length === 0) {
        throw new Error('File tidak memiliki data')
      }

      // Limit data to prevent memory issues
      if (data.length > 10000) {
        toast({
          title: "Peringatan",
          description: `File memiliki ${data.length} baris. Hanya 10.000 baris pertama yang akan diproses.`,
        })
        data = data.slice(0, 10000)
      }

      console.log('Headers:', headers)
      console.log('Data rows:', data.length)

      // Analyze file structure with error handling
      let analysis: FileAnalysisResult
      try {
        analysis = analyzeFileStructure(headers, data, file.name, file.size)
        setAnalysisResult(analysis)
      } catch (analysisError) {
        console.error('Analysis error:', analysisError)
        // Continue without analysis if it fails
        analysis = {
          summary: {
            totalRecords: data.length,
            totalFields: headers.length,
            fileName: file.name
          },
          fields: {},
          issues: [],
          recommendations: [],
          metadata: {
            processingTime: 0,
            confidence: 50
          }
        }
        setAnalysisResult(analysis)
      }

      // Create mapping for detected fields
      const detectedFields: Record<string, number> = {}

      // Simple field detection based on header names
      headers.forEach((header, index) => {
        const lowerHeader = header.toLowerCase().trim()
        if (lowerHeader.includes('nama') || lowerHeader.includes('name')) {
          detectedFields.nama = index
        } else if (lowerHeader.includes('hp') || lowerHeader.includes('phone') || lowerHeader.includes('nomor')) {
          detectedFields.nomor_hp = index
        } else if (lowerHeader.includes('pilihan1') || lowerHeader.includes('choice1')) {
          detectedFields.pilihan1 = index
        } else if (lowerHeader.includes('pilihan2') || lowerHeader.includes('choice2')) {
          detectedFields.pilihan2 = index
        } else if (lowerHeader.includes('pilihan3') || lowerHeader.includes('choice3')) {
          detectedFields.pilihan3 = index
        } else if (lowerHeader.includes('prodi') || lowerHeader.includes('program')) {
          detectedFields.prodi_lulus = index
        }
      })

      console.log('Detected fields:', detectedFields)

      // Validate required fields
      if (detectedFields.nama === undefined) {
        throw new Error('Kolom "nama" tidak ditemukan. Pastikan file memiliki kolom nama mahasiswa.')
      }

      if (detectedFields.nomor_hp === undefined) {
        throw new Error('Kolom "nomor_hp" tidak ditemukan. Pastikan file memiliki kolom nomor HP.')
      }

      // Transform data to students format with error handling
      const studentsData: Student[] = []

      for (let index = 0; index < data.length; index++) {
        try {
          const row = data[index]
          const nama = (row[detectedFields.nama] || '').toString().trim()
          const nomor_hp = (row[detectedFields.nomor_hp] || '').toString().trim()

          if (nama.length > 0 && nomor_hp.length > 0) {
            const prodi_lulus = row[detectedFields.prodi_lulus]
            studentsData.push({
              id: `student-${index}`,
              nama,
              nomor_hp,
              pilihan1: (row[detectedFields.pilihan1] || '').toString().trim(),
              pilihan2: (row[detectedFields.pilihan2] || '').toString().trim(),
              pilihan3: (row[detectedFields.pilihan3] || '').toString().trim(),
              prodi_lulus: prodi_lulus ? prodi_lulus.toString().trim() : undefined,
              selected: true,
              status: 'pending' as const
            })
          }
        } catch (rowError) {
          console.warn(`Error processing row ${index}:`, rowError)
        }
      }

      if (studentsData.length === 0) {
        throw new Error('Tidak ada data mahasiswa yang valid ditemukan. Pastikan file memiliki data nama dan nomor HP.')
      }

      console.log('Students data:', studentsData.length, 'valid students')

      setStudents(studentsData)
      setFilteredStudents(studentsData)
      setSelectedCount(studentsData.length)
      setCurrentStep('preview')

      toast({
        title: "File berhasil diupload",
        description: `${studentsData.length} data mahasiswa berhasil diproses`,
      })

    } catch (error) {
      console.error('Error processing file:', error)

      // Reset state on error
      setStudents([])
      setFilteredStudents([])
      setSelectedCount(0)
      setAnalysisResult(null)

      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Gagal memproses file. Periksa format file Anda.',
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }, [toast])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      const file = files[0]
      // Validate file
      const validExtensions = ['csv', 'xlsx', 'xls']
      const fileExtension = file.name.split('.').pop()?.toLowerCase()

      if (!fileExtension || !validExtensions.includes(fileExtension)) {
        toast({
          title: "Format file tidak didukung",
          description: "Gunakan file .csv, .xlsx, atau .xls",
          variant: "destructive",
        })
        return
      }

      if (file.size > 10 * 1024 * 1024) { // 10MB
        toast({
          title: "File terlalu besar",
          description: "Maksimal ukuran file adalah 10MB",
          variant: "destructive",
        })
        return
      }

      handleFileUpload(file)
    }
  }, [handleFileUpload, toast])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      const file = files[0]
      // Validate file
      const validExtensions = ['csv', 'xlsx', 'xls']
      const fileExtension = file.name.split('.').pop()?.toLowerCase()

      if (!fileExtension || !validExtensions.includes(fileExtension)) {
        toast({
          title: "Format file tidak didukung",
          description: "Gunakan file .csv, .xlsx, atau .xls",
          variant: "destructive",
        })
        return
      }

      if (file.size > 10 * 1024 * 1024) { // 10MB
        toast({
          title: "File terlalu besar",
          description: "Maksimal ukuran file adalah 10MB",
          variant: "destructive",
        })
        return
      }

      handleFileUpload(file)
    }
  }

  const toggleStudentSelection = (studentId: string) => {
    setStudents(prev => {
      const updated = prev.map(student =>
        student.id === studentId
          ? { ...student, selected: !student.selected }
          : student
      )
      setSelectedCount(updated.filter(s => s.selected).length)
      return updated
    })
  }

  const toggleAllSelection = () => {
    const allSelected = filteredStudents.every(s => s.selected)
    setStudents(prev => {
      const updated = prev.map(student => ({
        ...student,
        selected: !allSelected
      }))
      setSelectedCount(updated.filter(s => s.selected).length)
      return updated
    })
  }

  const handleSearch = (term: string) => {
    setSearchTerm(term)
    const filtered = students.filter(student =>
      student.nama.toLowerCase().includes(term.toLowerCase()) ||
      student.nomor_hp.includes(term) ||
      student.pilihan1.toLowerCase().includes(term.toLowerCase())
    )
    setFilteredStudents(filtered)
  }

  const formatMessage = (student: Student): string => {
    return broadcastSettings.message
      .replace('{nama}', student.nama)
      .replace('{pilihan1}', student.pilihan1)
      .replace('{pilihan2}', student.pilihan2)
      .replace('{pilihan3}', student.pilihan3)
      .replace('{prodi_lulus}', student.prodi_lulus || '')
  }

  const sendWhatsAppMessage = async (student: Student): Promise<boolean> => {
    try {
      const message = formatMessage(student)
      // Simulate API call - replace with actual WhatsApp API
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Simulate 90% success rate
      return Math.random() > 0.1
    } catch (error) {
      console.error('Error sending message:', error)
      return false
    }
  }

  const startBroadcast = async () => {
    const selectedStudents = students.filter(s => s.selected)
    if (selectedStudents.length === 0) {
      toast({
        title: "Tidak ada mahasiswa yang dipilih",
        description: "Pilih minimal satu mahasiswa untuk broadcast",
        variant: "destructive",
      })
      return
    }

    setIsBroadcasting(true)
    setBroadcastProgress(0)
    setCurrentBatchIndex(0)
    setCurrentStep('broadcast')

    const batches = []
    for (let i = 0; i < selectedStudents.length; i += broadcastSettings.batchSize) {
      batches.push(selectedStudents.slice(i, i + broadcastSettings.batchSize))
    }

    for (let batchIndex = 0; batchIndex < batches.length && !broadcastPaused; batchIndex++) {
      setCurrentBatchIndex(batchIndex + 1)
      const batch = batches[batchIndex]

      // Process batch
      const batchPromises = batch.map(async (student) => {
        setStudents(prev => prev.map(s =>
          s.id === student.id ? { ...s, status: 'sending' } : s
        ))

        const success = await sendWhatsAppMessage(student)

        setStudents(prev => prev.map(s =>
          s.id === student.id ? {
            ...s,
            status: success ? 'sent' : 'failed'
          } : s
        ))

        return success
      })

      await Promise.all(batchPromises)

      // Update progress
      const completedStudents = (batchIndex + 1) * broadcastSettings.batchSize
      const progress = Math.min((completedStudents / selectedStudents.length) * 100, 100)
      setBroadcastProgress(progress)

      // Wait between batches (except for the last batch)
      if (batchIndex < batches.length - 1 && !broadcastPaused) {
        await new Promise(resolve => setTimeout(resolve, broadcastSettings.delayBetweenMessages * 1000))
      }
    }

    setIsBroadcasting(false)

    const sentCount = students.filter(s => s.status === 'sent').length
    const failedCount = students.filter(s => s.status === 'failed').length

    toast({
      title: "Broadcast selesai",
      description: `${sentCount} pesan berhasil dikirim, ${failedCount} gagal`,
    })
  }

  const pauseBroadcast = () => {
    setBroadcastPaused(!broadcastPaused)
  }

  const resetBroadcast = () => {
    setStudents(prev => prev.map(s => ({ ...s, status: 'pending' })))
    setBroadcastProgress(0)
    setCurrentBatchIndex(0)
    setIsBroadcasting(false)
    setBroadcastPaused(false)
    setCurrentStep('preview')
  }

  if (currentStep === 'upload') {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Upload File Data Mahasiswa
            </CardTitle>
            <CardDescription>
              Upload file Excel (.xlsx) atau CSV yang berisi data mahasiswa untuk broadcast WhatsApp
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${isDragging
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
                }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
            >
              {isUploading ? (
                <div className="space-y-4">
                  <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto" />
                  <p className="text-gray-600">Memproses file...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <FileSpreadsheet className="w-12 h-12 text-gray-400 mx-auto" />
                  <div>
                    <p className="text-lg font-medium text-gray-900">
                      Drag & drop file atau klik untuk upload
                    </p>
                    <p className="text-gray-500">
                      Mendukung file .xlsx, .xls, dan .csv (maksimal 10MB)
                    </p>
                  </div>
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileSelect}
              className="hidden"
              aria-label="Upload file data mahasiswa"
            />

            {uploadedFile && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                  <span className="font-medium">{uploadedFile.name}</span>
                  <Badge variant="secondary">
                    {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                  </Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Format file yang diperlukan:</strong>
            <ul className="mt-2 space-y-1 text-sm list-disc list-inside">
              <li>Kolom "nama" atau "name" untuk nama mahasiswa</li>
              <li>Kolom "nomor_hp", "no_hp", "phone" untuk nomor WhatsApp</li>
              <li>Kolom "pilihan1", "pilihan2", "pilihan3" untuk pilihan program studi</li>
              <li>Nomor HP harus dalam format yang valid (contoh: 08123456789)</li>
            </ul>
            <div className="mt-3 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const link = document.createElement('a')
                  link.href = '/test-simple.csv'
                  link.download = 'test-simple.csv'
                  document.body.appendChild(link)
                  link.click()
                  document.body.removeChild(link)
                }}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Test CSV (3 data)
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const link = document.createElement('a')
                  link.href = '/sample-mahasiswa-data.csv'
                  link.download = 'sample-mahasiswa-data.csv'
                  document.body.appendChild(link)
                  link.click()
                  document.body.removeChild(link)
                }}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download Contoh File CSV
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (currentStep === 'preview') {
    return (
      <div className="space-y-6">
        {/* File Analysis Summary */}
        {analysisResult && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                Analisis File Berhasil
              </CardTitle>
              <CardDescription>
                File berhasil dianalisis dan field data terdeteksi otomatis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{students.length}</div>
                  <div className="text-sm text-gray-600">Total Data</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{selectedCount}</div>
                  <div className="text-sm text-gray-600">Dipilih</div>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">
                    {analysisResult.metadata.confidence}%
                  </div>
                  <div className="text-sm text-gray-600">Akurasi</div>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {Object.keys(analysisResult.fields).length}
                  </div>
                  <div className="text-sm text-gray-600">Field Terdeteksi</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Broadcast Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Pengaturan Broadcast
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="delay">Delay antar pesan (detik)</Label>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <Input
                    id="delay"
                    type="number"
                    min="1"
                    max="60"
                    value={broadcastSettings.delayBetweenMessages}
                    onChange={(e) => setBroadcastSettings(prev => ({
                      ...prev,
                      delayBetweenMessages: parseInt(e.target.value) || 3
                    }))}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="batch">Batch size (nomor per batch)</Label>
                <div className="flex items-center gap-2">
                  <Hash className="w-4 h-4 text-gray-400" />
                  <Input
                    id="batch"
                    type="number"
                    min="1"
                    max="50"
                    value={broadcastSettings.batchSize}
                    onChange={(e) => setBroadcastSettings(prev => ({
                      ...prev,
                      batchSize: parseInt(e.target.value) || 10
                    }))}
                  />
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="message">Template Pesan</Label>
              <Textarea
                id="message"
                rows={4}
                value={broadcastSettings.message}
                onChange={(e) => setBroadcastSettings(prev => ({
                  ...prev,
                  message: e.target.value
                }))}
                placeholder="Masukkan template pesan WhatsApp..."
              />
              <p className="text-sm text-gray-500 mt-1">
                Gunakan: {"{nama}"}, {"{pilihan1}"}, {"{pilihan2}"}, {"{pilihan3}"} sebagai placeholder
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Student List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Daftar Mahasiswa ({filteredStudents.length})
            </CardTitle>
            <CardDescription>
              Pilih mahasiswa yang akan menerima broadcast WhatsApp
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Search and Controls */}
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Cari nama, nomor HP, atau program studi..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                variant="outline"
                onClick={toggleAllSelection}
                className="flex items-center gap-2"
              >
                <Checkbox
                  checked={filteredStudents.length > 0 && filteredStudents.every(s => s.selected)}
                  onChange={toggleAllSelection}
                />
                Pilih Semua
              </Button>
            </div>

            {/* Student List */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredStudents.map((student) => (
                <div
                  key={student.id}
                  className={`p-4 border rounded-lg transition-colors ${student.selected
                      ? 'bg-blue-50 border-blue-200'
                      : 'bg-white border-gray-200'
                    }`}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={student.selected}
                      onCheckedChange={() => toggleStudentSelection(student.id)}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-gray-900">{student.nama}</h4>
                        {student.status && (
                          <Badge
                            variant={
                              student.status === 'sent' ? 'default' :
                                student.status === 'failed' ? 'destructive' :
                                  student.status === 'sending' ? 'secondary' : 'outline'
                            }
                          >
                            {student.status}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{student.nomor_hp}</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {student.pilihan1 && (
                          <Badge variant="outline" className="text-xs">
                            1. {student.pilihan1}
                          </Badge>
                        )}
                        {student.pilihan2 && (
                          <Badge variant="outline" className="text-xs">
                            2. {student.pilihan2}
                          </Badge>
                        )}
                        {student.pilihan3 && (
                          <Badge variant="outline" className="text-xs">
                            3. {student.pilihan3}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const preview = formatMessage(student)
                        toast({
                          title: "Preview Pesan",
                          description: preview,
                        })
                      }}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {filteredStudents.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                {searchTerm ? 'Tidak ada mahasiswa yang sesuai dengan pencarian' : 'Tidak ada data mahasiswa'}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={() => setCurrentStep('upload')}
          >
            Upload File Lain
          </Button>
          <Button
            onClick={startBroadcast}
            disabled={selectedCount === 0}
            className="flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            Mulai Broadcast ({selectedCount} mahasiswa)
          </Button>
        </div>
      </div>
    )
  }

  if (currentStep === 'broadcast') {
    return (
      <div className="space-y-6">
        {/* Broadcast Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Broadcast WhatsApp Sedang Berjalan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress Broadcast</span>
                <span>{Math.round(broadcastProgress)}%</span>
              </div>
              <Progress value={broadcastProgress} className="w-full" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-lg font-bold text-blue-600">{currentBatchIndex}</div>
                <div className="text-xs text-gray-600">Batch Saat Ini</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-lg font-bold text-green-600">
                  {students.filter(s => s.status === 'sent').length}
                </div>
                <div className="text-xs text-gray-600">Berhasil</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-lg font-bold text-red-600">
                  {students.filter(s => s.status === 'failed').length}
                </div>
                <div className="text-xs text-gray-600">Gagal</div>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <div className="text-lg font-bold text-yellow-600">
                  {students.filter(s => s.status === 'pending').length}
                </div>
                <div className="text-xs text-gray-600">Menunggu</div>
              </div>
            </div>

            <div className="flex gap-2">
              {isBroadcasting && (
                <Button
                  variant="outline"
                  onClick={pauseBroadcast}
                  className="flex items-center gap-2"
                >
                  {broadcastPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                  {broadcastPaused ? 'Lanjutkan' : 'Jeda'}
                </Button>
              )}
              <Button
                variant="destructive"
                onClick={resetBroadcast}
                className="flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Stop & Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Real-time Student Status */}
        <Card>
          <CardHeader>
            <CardTitle>Status Real-time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {students.filter(s => s.selected).map((student) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <div className="font-medium">{student.nama}</div>
                    <div className="text-sm text-gray-600">{student.nomor_hp}</div>
                  </div>
                  <Badge
                    variant={
                      student.status === 'sent' ? 'default' :
                        student.status === 'failed' ? 'destructive' :
                          student.status === 'sending' ? 'secondary' : 'outline'
                    }
                  >
                    {student.status === 'pending' && 'Menunggu'}
                    {student.status === 'sending' && (
                      <span className="flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Mengirim
                      </span>
                    )}
                    {student.status === 'sent' && 'Berhasil'}
                    {student.status === 'failed' && 'Gagal'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return null
}
