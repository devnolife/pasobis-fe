"use client"

import { useState, useCallback, useRef, useEffect } from "react"
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
import { parseXLSX, parseCSVFile, ParsedFileData } from "@/lib/xlsx-parser"
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
  error?: string
}

interface BroadcastSettings {
  delayBetweenMessages: number // in seconds
  batchSize: number // how many numbers to send at once
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
  })

  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  // Sync filteredStudents with students state and search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredStudents(students)
    } else {
      const filtered = students.filter(student =>
        student.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.nomor_hp.includes(searchTerm) ||
        student.pilihan1.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredStudents(filtered)
    }
  }, [students, searchTerm])

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

      // Check file size (max 10MB to prevent memory issues)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('File terlalu besar. Maksimal 10MB.')
      }

      let headers: string[] = []
      let data: string[][] = []

      const fileExtension = file.name.split('.').pop()?.toLowerCase()
      console.log('File extension:', fileExtension)

      // Use centralized file parsing
      try {
        let parsedData: ParsedFileData

        if (fileExtension === 'csv') {
          console.log('Processing CSV file...')
          parsedData = await parseCSVFile(file)
        } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
          console.log('Processing Excel file...')
          parsedData = await parseXLSX(file)
        } else {
          throw new Error('Format file tidak didukung. Gunakan .csv, .xlsx, atau .xls')
        }

        headers = parsedData.headers
        data = parsedData.data

      } catch (parseError) {
        console.error('File parsing error:', parseError)
        throw new Error('Gagal memproses file: ' + (parseError instanceof Error ? parseError.message : 'Format tidak valid'))
      }

      if (!headers || headers.length === 0) {
        throw new Error('File tidak memiliki header yang valid')
      }

      if (!data || data.length === 0) {
        throw new Error('File tidak memiliki data')
      }

      // Limit data to prevent memory issues (reduced limit)
      if (data.length > 5000) {
        toast({
          title: "Peringatan",
          description: `File memiliki ${data.length} baris. Hanya 5.000 baris pertama yang akan diproses untuk menghindari crash.`,
        })
        data = data.slice(0, 5000)
      }

      console.log('Headers:', headers)
      console.log('Data rows:', data.length)

      // Add memory cleanup before heavy processing
      if (typeof window !== 'undefined' && window.gc) {
        window.gc()
      }

      // Analyze file structure with better error handling
      let analysis: FileAnalysisResult
      try {
        // Use setTimeout to prevent blocking UI
        analysis = await new Promise((resolve, reject) => {
          setTimeout(() => {
            try {
              const result = analyzeFileStructure(headers, data, file.name, file.size)
              resolve(result)
            } catch (error) {
              reject(error)
            }
          }, 100)
        })
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

      // Transform data to students format with better error handling and batching
      const studentsData: Student[] = []
      const batchSize = 100 // Process in smaller batches

      for (let batchStart = 0; batchStart < data.length; batchStart += batchSize) {
        const batchEnd = Math.min(batchStart + batchSize, data.length)

        for (let index = batchStart; index < batchEnd; index++) {
          try {
            const row = data[index]
            if (!row || row.length === 0) continue

            const nama = (row[detectedFields.nama] || '').toString().trim()
            const nomor_hp = (row[detectedFields.nomor_hp] || '').toString().trim()

            // More lenient validation
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
            // Continue processing other rows
          }
        }

        // Allow UI to breathe between batches
        if (batchEnd < data.length) {
          await new Promise(resolve => setTimeout(resolve, 10))
        }
      }

      if (studentsData.length === 0) {
        throw new Error('Tidak ada data mahasiswa yang valid ditemukan. Pastikan file memiliki data nama dan nomor HP.')
      }

      setStudents(studentsData)
      setFilteredStudents(studentsData)
      setSelectedCount(studentsData.length)
      setCurrentStep('preview')

      // Clear heavy objects from memory
      data.length = 0
      headers.length = 0

      toast({
        title: "File berhasil diupload",
        description: `${studentsData.length} data mahasiswa berhasil diproses`,
      })

    } catch (error) {
      console.error('Error processing file:', error)

      // Reset state on error and cleanup
      setStudents([])
      setFilteredStudents([])
      setSelectedCount(0)
      setAnalysisResult(null)
      setUploadedFile(null)

      // More detailed error messages
      let errorMessage = 'Gagal memproses file. Periksa format file Anda.'

      if (error instanceof Error) {
        if (error.message.includes('memory') || error.message.includes('heap')) {
          errorMessage = 'File terlalu besar untuk diproses. Coba dengan file yang lebih kecil (<5MB).'
        } else if (error.message.includes('format') || error.message.includes('parse')) {
          errorMessage = 'Format file tidak valid. Pastikan menggunakan file CSV atau Excel yang benar.'
        } else if (error.message.includes('column') || error.message.includes('header')) {
          errorMessage = 'Struktur file tidak sesuai. Pastikan file memiliki kolom nama dan nomor HP.'
        } else {
          errorMessage = error.message
        }
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)

      // Force garbage collection if available
      if (typeof window !== 'undefined' && window.gc) {
        setTimeout(() => {
          window.gc?.()
        }, 1000)
      }
    }
  }, [toast, isUploading])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      const file = files[0]

      // Enhanced validation
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

      // Reduced file size limit to prevent memory issues
      if (file.size > 5 * 1024 * 1024) { // 5MB
        toast({
          title: "File terlalu besar",
          description: "Maksimal ukuran file adalah 5MB untuk menghindari crash",
          variant: "destructive",
        })
        return
      }

      // Additional validation for empty files
      if (file.size === 0) {
        toast({
          title: "File kosong",
          description: "File yang diupload tidak memiliki konten",
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

      // Enhanced validation
      const validExtensions = ['csv', 'xlsx', 'xls']
      const fileExtension = file.name.split('.').pop()?.toLowerCase()

      if (!fileExtension || !validExtensions.includes(fileExtension)) {
        toast({
          title: "Format file tidak didukung",
          description: "Gunakan file .csv, .xlsx, atau .xls",
          variant: "destructive",
        })
        // Clear the input
        e.target.value = ''
        return
      }

      // Reduced file size limit
      if (file.size > 5 * 1024 * 1024) { // 5MB
        toast({
          title: "File terlalu besar",
          description: "Maksimal ukuran file adalah 5MB untuk menghindari crash",
          variant: "destructive",
        })
        e.target.value = ''
        return
      }

      if (file.size === 0) {
        toast({
          title: "File kosong",
          description: "File yang diupload tidak memiliki konten",
          variant: "destructive",
        })
        e.target.value = ''
        return
      }

      handleFileUpload(file)
    }
  }

  const toggleStudentSelection = useCallback((studentId: string) => {
    setStudents(prev => {
      const updated = prev.map(student =>
        student.id === studentId
          ? { ...student, selected: !student.selected }
          : student
      )
      const newSelectedCount = updated.filter(s => s.selected).length
      setSelectedCount(newSelectedCount)
      return updated
    })
  }, [])

  const toggleAllSelection = () => {
    const allFilteredSelected = filteredStudents.every(s => s.selected)
    const filteredIds = new Set(filteredStudents.map(s => s.id))

    setStudents(prev => {
      const updated = prev.map(student => {
        // Only toggle students that are currently filtered/visible
        if (filteredIds.has(student.id)) {
          return { ...student, selected: !allFilteredSelected }
        }
        return student
      })
      setSelectedCount(updated.filter(s => s.selected).length)
      return updated
    })
  }

  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term)
  }, [])

  const formatMessage = (student: Student): string => {
    // Function ini masih diperlukan untuk preview, tapi menggunakan template default
    return `Halo ${student.nama}, terima kasih telah mendaftar. Pilihan program studi Anda: ${student.pilihan1}, ${student.pilihan2}, ${student.pilihan3}.`
  }

  const sendWhatsAppMessage = async (student: Student): Promise<{ success: boolean; error?: string }> => {
    try {
      // Prepare payload untuk API eksternal sesuai format yang diminta
      const payload = {
        number: student.nomor_hp,
        nama: student.nama,
        pilihan1: student.pilihan1,
        pilihan2: student.pilihan2,
        pilihan3: student.pilihan3,
        programStudiDilulusi: student.prodi_lulus || student.pilihan1,
        bayarPendaftaran: "Y",
        biodata: "Y",
        uploadBerkas: "Y",
        validasi: "Y",
        daftarUlang: "N"
      }

      // Kirim langsung ke API eksternal
      const response = await fetch('https://passobis.if.unismuh.ac.id/sobis/send', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      // Parse response
      const responseText = await response.text()
      let data: any = null

      try {
        data = JSON.parse(responseText)
      } catch {
        // Jika response bukan JSON, anggap sebagai text response
        data = { message: responseText }
      }

      // Deteksi success berdasarkan HTTP status
      if (response.ok && response.status >= 200 && response.status < 300) {
        console.log(`Pesan berhasil dikirim ke ${student.nama}:`, data)
        return { success: true }
      } else {
        // Format error message
        let errorMessage = 'Unknown error'

        if (data?.message) {
          errorMessage = Array.isArray(data.message) ? data.message.join(', ') : data.message
        } else if (data?.error) {
          errorMessage = data.error
        } else {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`
        }

        console.error(`Gagal mengirim pesan ke ${student.nama}:`, {
          status: response.status,
          statusText: response.statusText,
          data: data
        })

        return {
          success: false,
          error: errorMessage
        }
      }
    } catch (error) {
      console.error('Error sending message to', student.nama, ':', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
      }
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

    let sentCount = 0
    let failedCount = 0

    // Kirim pesan satu per satu (sequential) untuk memastikan tidak ada rate limiting
    for (let i = 0; i < selectedStudents.length && !broadcastPaused; i++) {
      const student = selectedStudents[i]

      // Update status ke sending
      setStudents(prev => prev.map(s =>
        s.id === student.id ? { ...s, status: 'sending' } : s
      ))

      // Kirim pesan dan tunggu response
      const result = await sendWhatsAppMessage(student)

      // Update status berdasarkan response
      setStudents(prev => prev.map(s =>
        s.id === student.id ? {
          ...s,
          status: result.success ? 'sent' : 'failed',
          error: result.error
        } : s
      ))

      // Update counters
      if (result.success) {
        sentCount++
      } else {
        failedCount++
        console.error(`Gagal mengirim ke ${student.nama}: ${result.error}`)
      }

      // Update progress
      const progress = ((i + 1) / selectedStudents.length) * 100
      setBroadcastProgress(progress)

      // Delay antara pesan (kecuali pesan terakhir)
      if (i < selectedStudents.length - 1 && !broadcastPaused) {
        await new Promise(resolve => setTimeout(resolve, broadcastSettings.delayBetweenMessages * 1000))
      }

      // Check pause status setiap iterasi
      if (broadcastPaused) {
        // Tunggu sampai unpause
        while (broadcastPaused) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }
    }

    setIsBroadcasting(false)

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
                      Mendukung file .xlsx, .xls, dan .csv (maksimal 5MB)
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

        {/* Broadcast Settings - Template pesan dihapus */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Pengaturan Broadcast
            </CardTitle>
            <CardDescription>
              Template pesan sudah diatur otomatis oleh sistem
            </CardDescription>
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
                <p className="text-xs text-gray-500 mt-1">
                  Pesan akan dikirim satu per satu dengan delay ini
                </p>
              </div>
              <div>
                <Label htmlFor="batch">Batch size (tidak digunakan)</Label>
                <div className="flex items-center gap-2">
                  <Hash className="w-4 h-4 text-gray-400" />
                  <Input
                    id="batch"
                    type="number"
                    min="1"
                    max="50"
                    value={broadcastSettings.batchSize}
                    disabled
                    className="bg-gray-100"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Pesan dikirim secara berurutan untuk menghindari rate limiting
                </p>
              </div>
            </div>

            {/* Info tentang template pesan otomatis */}
            <Alert>
              <MessageCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Template Pesan Otomatis:</strong><br />
                Sistem akan mengirim pesan dengan format yang sudah ditentukan, termasuk nama mahasiswa dan pilihan program studi mereka.
              </AlertDescription>
            </Alert>
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
              <div className="flex items-center gap-2">
                <Checkbox
                  id="select-all"
                  checked={filteredStudents.length > 0 && filteredStudents.every(s => s.selected)}
                  onCheckedChange={toggleAllSelection}
                />
                <Label
                  htmlFor="select-all"
                  className="text-sm font-medium cursor-pointer"
                >
                  Pilih Semua
                </Label>
              </div>
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
                            {student.status === 'pending' && 'Menunggu'}
                            {student.status === 'sending' && 'Mengirim'}
                            {student.status === 'sent' && 'Berhasil'}
                            {student.status === 'failed' && 'Gagal'}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{student.nomor_hp}</p>
                      {student.error && (
                        <p className="text-xs text-red-600 mt-1">
                          Error: {student.error}
                        </p>
                      )}
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
                  <div className="flex-1">
                    <div className="font-medium">{student.nama}</div>
                    <div className="text-sm text-gray-600">{student.nomor_hp}</div>
                    {student.error && (
                      <div className="text-xs text-red-600 mt-1 max-w-xs truncate">
                        {student.error}
                      </div>
                    )}
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
