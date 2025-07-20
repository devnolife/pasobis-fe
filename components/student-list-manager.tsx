"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import {
  FileSpreadsheet,
  Upload,
  Users,
  Send,
  Download,
  Trash2,
  CheckCircle,
  AlertCircle,
  Loader2,
  Filter,
  Search,
  Brain,
  Zap
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { parseFile } from "@/lib/xlsx-parser"
import { detectFields, transformData, validateTransformedData, FieldMapping } from "@/lib/field-detector"
import { FieldMappingPreview } from "@/components/field-mapping-preview"

interface Student {
  id: string
  nama: string
  number: string
  pilihan1: string
  pilihan2: string
  pilihan3: string
  prodi_lulus?: string
  selected: boolean
}

export function StudentListManager() {
  const [students, setStudents] = useState<Student[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCount, setSelectedCount] = useState(0)
  const [showPreview, setShowPreview] = useState(false)
  const [detectionResult, setDetectionResult] = useState<any>(null)
  const [rawData, setRawData] = useState<string[][]>([])
  const [fieldMappings, setFieldMappings] = useState<FieldMapping[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Check file format
    const fileName = file.name.toLowerCase()
    if (!fileName.endsWith('.csv') && !fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
      toast({
        title: "Format File Salah",
        description: "Silakan upload file dengan format CSV (.csv) atau Excel (.xlsx/.xls)",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)

    try {
      // Parse file using the universal parser
      const { headers, data, fileType } = await parseFile(file)

      // Detect fields automatically
      const detection = detectFields(headers, data)

      // Store raw data for processing
      setRawData(data)
      setDetectionResult(detection)
      setFieldMappings(detection.mappings)

      // Show preview if we have good detection results
      if (detection.mappings.length > 0) {
        setShowPreview(true)
        toast({
          title: "File Berhasil Dianalisis! 🧠",
          description: `${detection.mappings.length} field berhasil dideteksi dari ${fileType.toUpperCase()}`,
          className: "bg-blue-50 border-blue-200 text-blue-800",
        })
      } else {
        toast({
          title: "Field Tidak Terdeteksi",
          description: "Tidak ada field yang cocok ditemukan. Periksa format file Anda.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error Upload File",
        description: error instanceof Error ? error.message : "Terjadi kesalahan saat membaca file",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleSelectStudent = (studentId: string, checked: boolean) => {
    setStudents(prev =>
      prev.map(student =>
        student.id === studentId
          ? { ...student, selected: checked }
          : student
      )
    )
    setSelectedCount(prev => checked ? prev + 1 : prev - 1)
  }

  const handleSelectAll = (checked: boolean) => {
    const filteredStudents = getFilteredStudents()
    setStudents(prev =>
      prev.map(student =>
        filteredStudents.some(fs => fs.id === student.id)
          ? { ...student, selected: checked }
          : student
      )
    )
    setSelectedCount(checked ? filteredStudents.length : 0)
  }

  const handleSendSelected = async () => {
    const selectedStudents = students.filter(s => s.selected)

    if (selectedStudents.length === 0) {
      toast({
        title: "Tidak Ada Mahasiswa Dipilih",
        description: "Silakan pilih minimal satu mahasiswa untuk dikirim",
        variant: "destructive",
      })
      return
    }

    setIsSending(true)

    try {
      const promises = selectedStudents.map(student =>
        fetch("https://passobis.if.unismuh.ac.id/sobis/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            number: student.number,
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
          }),
        })
      )

      const results = await Promise.allSettled(promises)
      const successful = results.filter(r => r.status === 'fulfilled').length
      const failed = results.filter(r => r.status === 'rejected').length

      if (successful > 0) {
        toast({
          title: "Pengiriman Berhasil! 🎉",
          description: `${successful} mahasiswa berhasil dikirim${failed > 0 ? `, ${failed} gagal` : ''}`,
          className: "bg-green-50 border-green-200 text-green-800",
        })

        // Remove sent students from list
        setStudents(prev => prev.filter(s => !s.selected))
        setSelectedCount(0)
      } else {
        toast({
          title: "Pengiriman Gagal",
          description: "Semua pengiriman gagal. Silakan coba lagi.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error Pengiriman",
        description: "Terjadi kesalahan saat mengirim data",
        variant: "destructive",
      })
    } finally {
      setIsSending(false)
    }
  }

  const handleClearList = () => {
    setStudents([])
    setSelectedCount(0)
    toast({
      title: "List Dikosongkan",
      description: "Semua data mahasiswa telah dihapus",
    })
  }

  const getFilteredStudents = () => {
    return students.filter(student =>
      student.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.number.includes(searchTerm)
    )
  }

  const handlePreviewConfirm = () => {
    try {
      // Transform data using field mappings
      const transformedData = transformData(rawData, detectionResult.mappings.map((m: FieldMapping) => m.sourceColumn), fieldMappings)

      // Validate transformed data
      const { valid, invalid } = validateTransformedData(transformedData)

      if (invalid.length > 0) {
        toast({
          title: "Data Tidak Valid",
          description: `${invalid.length} baris data memiliki error. Periksa format data Anda.`,
          variant: "destructive",
        })
        return
      }

      // Convert to Student objects
      const parsedStudents: Student[] = valid.map((row, index) => ({
        id: `student_${index + 1}`,
        nama: row.nama || '',
        number: row.number || '',
        pilihan1: row.pilihan1 || '',
        pilihan2: row.pilihan2 || '',
        pilihan3: row.pilihan3 || '',
        prodi_lulus: row.prodi_lulus || '',
        selected: false
      }))

      setStudents(parsedStudents)
      setSelectedCount(0)
      setShowPreview(false)

      toast({
        title: "Data Berhasil Diproses! 🎉",
        description: `${parsedStudents.length} mahasiswa berhasil dimuat dan siap dikirim`,
        className: "bg-green-50 border-green-200 text-green-800",
      })
    } catch (error) {
      toast({
        title: "Error Pemrosesan Data",
        description: "Terjadi kesalahan saat memproses data",
        variant: "destructive",
      })
    }
  }

  const handlePreviewCancel = () => {
    setShowPreview(false)
    setDetectionResult(null)
    setRawData([])
    setFieldMappings([])
  }

  const handleMappingChange = (mappings: FieldMapping[]) => {
    setFieldMappings(mappings)
  }

  const downloadTemplate = () => {
    const csvContent = `nama,hp_mahasiswa,pilihan1,pilihan2,pilihan3,prodi_lulus
"John Doe","085123456789","Teknik Informatika","Sistem Informasi","Teknik Elektro","Teknik Informatika"
"Jane Smith","081234567890","Agribisnis","Teknik Elektro","Sistem Informasi","Agribisnis"
"Ahmad Rahman","087654321098","Sistem Informasi","Teknik Informatika","Agribisnis","Sistem Informasi"`

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'template_mahasiswa.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const filteredStudents = getFilteredStudents()

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Field Mapping Preview */}
      {showPreview && detectionResult && (
        <FieldMappingPreview
          detectionResult={detectionResult}
          sampleData={rawData}
          onMappingChange={handleMappingChange}
          onConfirm={handlePreviewConfirm}
          onCancel={handlePreviewCancel}
        />
      )}

      {!showPreview && (
        <>
          {/* Upload Section */}
          <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md bg-gradient-to-br from-white to-gray-50/50 rounded-2xl overflow-hidden">
            <CardHeader className="pb-4 bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg">
                  <FileSpreadsheet className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-gray-900">Upload File CSV/Excel</CardTitle>
                  <CardDescription className="text-gray-600">
                    Upload file CSV atau Excel berisi data mahasiswa untuk diproses
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <Label htmlFor="csv-file" className="text-sm font-semibold text-gray-700 mb-2 block">
                      Pilih File CSV/Excel
                    </Label>
                    <Input
                      id="csv-file"
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      disabled={isUploading}
                      className="file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={downloadTemplate}
                      className="h-10 px-4 border-2 border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 text-gray-700 rounded-xl transition-all duration-200"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Template
                    </Button>
                  </div>
                </div>

                {isUploading && (
                  <Alert className="bg-blue-50 border-blue-200 text-blue-800 rounded-xl">
                    <Brain className="h-4 w-4 animate-pulse" />
                    <AlertDescription>
                      <div className="flex items-center space-x-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Menganalisis file dan mendeteksi field secara otomatis...</span>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Student List Section */}
          {students.length > 0 && (
            <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md bg-gradient-to-br from-white to-gray-50/50 rounded-2xl overflow-hidden">
              <CardHeader className="pb-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold text-gray-900">
                        Daftar Mahasiswa ({students.length})
                      </CardTitle>
                      <CardDescription className="text-gray-600">
                        Pilih mahasiswa yang akan dikirim ke sistem
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      {selectedCount} dipilih
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Search and Controls */}
                  <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <div className="relative flex-1 max-w-md">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Cari nama atau nomor..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 rounded-xl border-2 border-gray-200 focus:border-blue-400"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleSelectAll(true)}
                        className="h-10 px-4 border-2 border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 text-gray-700 rounded-xl transition-all duration-200"
                      >
                        Pilih Semua
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleSelectAll(false)}
                        className="h-10 px-4 border-2 border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 text-gray-700 rounded-xl transition-all duration-200"
                      >
                        Batal Pilih
                      </Button>
                    </div>
                  </div>

                  {/* Student List */}
                  <div className="grid gap-4 max-h-96 overflow-y-auto">
                    {filteredStudents.map((student) => (
                      <Card key={student.id} className="border-2 border-gray-200 hover:border-blue-300 transition-all duration-200">
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-4">
                            <Checkbox
                              checked={student.selected}
                              onCheckedChange={(checked) => handleSelectStudent(student.id, checked as boolean)}
                              className="w-5 h-5"
                            />
                            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <p className="font-semibold text-gray-900">{student.nama}</p>
                                <p className="text-sm text-gray-600">{student.number}</p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-xs text-gray-500">Pilihan Program Studi:</p>
                                <div className="flex flex-wrap gap-1">
                                  <Badge variant="outline" className="text-xs">{student.pilihan1}</Badge>
                                  <Badge variant="outline" className="text-xs">{student.pilihan2}</Badge>
                                  <Badge variant="outline" className="text-xs">{student.pilihan3}</Badge>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4 justify-end pt-4 border-t border-gray-200">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleClearList}
                      className="flex-1 sm:flex-none h-12 px-6 border-2 border-red-300 hover:border-red-400 bg-white hover:bg-red-50 text-red-700 rounded-xl transition-all duration-200"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Hapus Semua
                    </Button>
                    <Button
                      type="button"
                      onClick={handleSendSelected}
                      disabled={selectedCount === 0 || isSending}
                      className="flex-1 sm:flex-none h-12 px-8 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 hover:from-green-600 hover:via-emerald-600 hover:to-teal-600 text-white font-bold rounded-xl transition-all duration-200 transform hover:scale-105 disabled:transform-none shadow-lg hover:shadow-xl"
                    >
                      {isSending ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Mengirim...
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5 mr-2" />
                          Kirim {selectedCount > 0 ? `(${selectedCount})` : ''}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Empty State */}
          {students.length === 0 && (
            <Card className="border-2 border-dashed border-gray-300 rounded-2xl">
              <CardContent className="p-12 text-center">
                <FileSpreadsheet className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Belum Ada Data Mahasiswa</h3>
                <p className="text-gray-600 mb-6">Upload file CSV/Excel untuk mulai mengelola data mahasiswa</p>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                >
                  <Upload className="w-5 h-5 mr-2" />
                  Upload File
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
} 
