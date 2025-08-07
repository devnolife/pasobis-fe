/**
 * SOBIS Message Sender Component
 * 
 * This component provides a form interface for sending individual SOBIS messages
 * to prospective students via WhatsApp using GraphQL mutations.
 * 
 * 🔍 DEBUGGING:
 * - All process steps are logged to the browser console with emoji prefixes
 * - Check the browser Developer Tools > Console tab to see detailed logs
 * - In development mode, a "Clear Console" button is available
 * 
 * 📋 LOGGING LEGEND:
 * 🚀 = Process start
 * 📋 = Form data
 * 📤 = GraphQL request
 * 🔧 = Variables
 * 🔄 = Boolean to String conversion (true->Y, false->N)
 * 🌐 = Endpoint
 * 📦 = Request body
 * 📡 = HTTP response
 * 📨 = GraphQL response
 * ✅ = Success
 * ❌ = Error
 * 💥 = Exception
 * 🏁 = Process end
 * 🎯 = Component lifecycle
 * 📝 = Form changes
 * 🔄 = Reset action
 * 🧹 = Console clear
 */
"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { Loader2, User, Phone, BookOpen, CreditCard, FileText, Upload, CheckCircle, RotateCcw, Send, ArrowRight, MessageSquare, Volume2 } from "lucide-react"
import { programs } from "@/lib/programs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const formSchema = z.object({
  number: z.string().min(1, "Nomor WhatsApp wajib diisi").regex(/^[\d+\-\s()]+$/, "Format nomor tidak valid"),
  nama: z.string().min(1, "Nama wajib diisi").min(2, "Nama minimal 2 karakter"),
  pilihan1: z.string().min(1, "Pilihan program studi 1 wajib diisi"),
  pilihan2: z.string().min(1, "Pilihan program studi 2 wajib diisi"),
  pilihan3: z.string().min(1, "Pilihan program studi 3 wajib diisi"),
  programStudiDilulusi: z.string().optional(),
  bayarPendaftaran: z.boolean().optional(),
  biodata: z.boolean().optional(),
  uploadBerkas: z.boolean().optional(),
  validasi: z.boolean().optional(),
  daftarUlang: z.boolean().optional(),
  isSendGenAudio: z.boolean().optional(),
})

type FormData = z.infer<typeof formSchema>

const GRAPHQL_ENDPOINT = "https://passobis.if.unismuh.ac.id/graphql"

export function SobisMessageSender() {
  const [isLoading, setIsLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      bayarPendaftaran: false,
      biodata: false,
      uploadBerkas: false,
      validasi: false,
      daftarUlang: false,
      isSendGenAudio: false,
    },
  })

  const watchedValues = watch()

  // Log component mount and form changes
  useEffect(() => {
    console.log("🎯 SOBIS Message Sender component mounted")
    console.log("📋 Initial form state:", watchedValues)

    return () => {
      console.log("🔌 SOBIS Message Sender component unmounted")
    }
  }, [])

  useEffect(() => {
    console.log("📝 Form values changed:", watchedValues)
  }, [watchedValues])

  const onSubmit = async (data: FormData) => {
    setIsLoading(true)
    setShowSuccess(false)

    console.log("🚀 Starting SOBIS message sending process...")
    console.log("📋 Form data received:", data)

    try {
      const mutation = `
        mutation SendSobis($input: SendSobisInput!) {
          sendSobis(input: $input) {
            success
            message
            waResponse
          }
        }
      `

      const variables = {
        input: {
          number: data.number,
          nama: data.nama,
          pilihan1: data.pilihan1,
          pilihan2: data.pilihan2,
          pilihan3: data.pilihan3,
          programStudiDilulusi: data.programStudiDilulusi || null,
          bayarPendaftaran: data.bayarPendaftaran ? "Y" : "N",
          biodata: data.biodata ? "Y" : "N",
          uploadBerkas: data.uploadBerkas ? "Y" : "N",
          validasi: data.validasi ? "Y" : "N",
          daftarUlang: data.daftarUlang ? "Y" : "N",
          isSendGenAudio: data.isSendGenAudio ? "Y" : "N",
        }
      }

      const requestBody = {
        query: mutation,
        variables,
      }

      const response = await fetch(GRAPHQL_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        console.error("❌ HTTP Error:", response.status, response.statusText)
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`)
      }

      const result = await response.json()

      // Check for GraphQL errors
      if (result.errors) {
        console.error("❌ GraphQL Errors:", result.errors)
        throw new Error(`GraphQL Error: ${result.errors.map((e: any) => e.message).join(', ')}`)
      }

      if (result.data?.sendSobis?.success) {
        console.log("✅ Message sent successfully!")

        setShowSuccess(true)
        toast({
          title: "Pesan Berhasil Dikirim! 📱",
          description: `Pesan SOBIS telah berhasil dikirim ke ${data.nama} (${data.number})`,
          className: "bg-green-50 border-green-200 text-green-800",
        })
        reset()
        setTimeout(() => setShowSuccess(false), 5000)
      } else {
        console.error("❌ Sending failed:", result.data?.sendSobis)
        const errorMessage = result.data?.sendSobis?.message || "Pengiriman pesan gagal"
        console.error("❌ Error message:", errorMessage)
        throw new Error(errorMessage)
      }
    } catch (error) {
      console.error("💥 Exception caught:", error)
      console.error("💥 Error stack:", error instanceof Error ? error.stack : 'No stack trace')

      toast({
        title: "Pengiriman Pesan Gagal",
        description: error instanceof Error ? error.message : "Terjadi kesalahan saat mengirim pesan. Silakan coba lagi.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      console.log("🏁 Process completed, loading state reset")
    }
  }

  const handleReset = () => {
    console.log("🔄 Resetting form...")
    reset()
    setShowSuccess(false)
    console.log("✨ Form reset completed")
    toast({
      title: "Form Direset",
      description: "Semua field telah dikosongkan",
    })
  }

  const handleClearConsole = () => {
    console.clear()
    console.log("🧹 Console cleared by user")
    toast({
      title: "Console Dibersihkan",
      description: "Log console telah dihapus",
    })
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {showSuccess && (
        <Alert className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 text-green-800 rounded-xl animate-slide-in shadow-lg">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <AlertDescription className="font-medium">
            Pesan SOBIS berhasil dikirim! Pesan telah terkirim melalui WhatsApp.
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Step 1: Informasi Kontak */}
        <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md bg-gradient-to-br from-white to-gray-50/50 rounded-2xl overflow-hidden">
          <CardHeader className="pb-4 bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-blue-100">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                <Phone className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-gray-900">Informasi Kontak</CardTitle>
                <CardDescription className="text-gray-600">
                  Masukkan nomor WhatsApp dan nama penerima
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2">
              {/* Nomor WhatsApp */}
              <div className="space-y-3">
                <Label htmlFor="number" className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-blue-500" />
                  <span>Nomor WhatsApp</span>
                  <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="number"
                    placeholder="contoh: +6281234567890 atau 081234567890"
                    className="pl-4 pr-4 py-4 bg-white border-2 border-gray-200 rounded-xl transition-all duration-200 focus:border-blue-400 focus:ring-4 focus:ring-blue-50 hover:border-blue-300 text-gray-900 placeholder:text-gray-500"
                    {...register("number")}
                  />
                </div>
                {errors.number && (
                  <div className="flex items-center space-x-2 text-red-600 animate-slide-in">
                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                    <span className="text-sm font-medium">{errors.number.message}</span>
                  </div>
                )}
              </div>

              {/* Nama */}
              <div className="space-y-3">
                <Label htmlFor="nama" className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                  <User className="w-4 h-4 text-blue-500" />
                  <span>Nama Lengkap</span>
                  <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="nama"
                    placeholder="Masukkan nama lengkap"
                    className="pl-4 pr-4 py-4 bg-white border-2 border-gray-200 rounded-xl transition-all duration-200 focus:border-blue-400 focus:ring-4 focus:ring-blue-50 hover:border-blue-300 text-gray-900 placeholder:text-gray-500"
                    {...register("nama")}
                  />
                </div>
                {errors.nama && (
                  <div className="flex items-center space-x-2 text-red-600 animate-slide-in">
                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                    <span className="text-sm font-medium">{errors.nama.message}</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step 2: Pilihan Program Studi */}
        <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md bg-gradient-to-br from-white to-gray-50/50 rounded-2xl overflow-hidden">
          <CardHeader className="pb-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-indigo-100">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-gray-900">Pilihan Program Studi</CardTitle>
                <CardDescription className="text-gray-600">
                  Pilih 3 program studi prioritas dan program studi yang diterima (jika ada)
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-3">
                {/* Pilihan 1 */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                    <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white text-xs font-bold">1</div>
                    <span>Pilihan Pertama</span>
                    <span className="text-red-500">*</span>
                  </Label>
                  <Select onValueChange={(value) => setValue("pilihan1", value)}>
                    <SelectTrigger className="h-12 bg-white border-2 border-gray-200 rounded-xl transition-all duration-200 focus:border-blue-400 focus:ring-4 focus:ring-blue-50 hover:border-blue-300">
                      <SelectValue placeholder="Pilih program studi prioritas utama" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-2 border-gray-100 shadow-xl">
                      {programs.map((program) => (
                        <SelectItem key={program} value={program} className="rounded-lg hover:bg-blue-50 focus:bg-blue-50 py-3">
                          {program}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.pilihan1 && (
                    <div className="flex items-center space-x-2 text-red-600 animate-slide-in">
                      <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                      <span className="text-sm font-medium">{errors.pilihan1.message}</span>
                    </div>
                  )}
                </div>

                {/* Pilihan 2 */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                    <div className="w-6 h-6 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full flex items-center justify-center text-white text-xs font-bold">2</div>
                    <span>Pilihan Kedua</span>
                    <span className="text-red-500">*</span>
                  </Label>
                  <Select onValueChange={(value) => setValue("pilihan2", value)}>
                    <SelectTrigger className="h-12 bg-white border-2 border-gray-200 rounded-xl transition-all duration-200 focus:border-teal-400 focus:ring-4 focus:ring-teal-50 hover:border-teal-300">
                      <SelectValue placeholder="Pilih program studi alternatif" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-2 border-gray-100 shadow-xl">
                      {programs
                        .filter((program) => program !== watchedValues.pilihan1)
                        .map((program) => (
                          <SelectItem key={program} value={program} className="rounded-lg hover:bg-teal-50 focus:bg-teal-50 py-3">
                            {program}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  {errors.pilihan2 && (
                    <div className="flex items-center space-x-2 text-red-600 animate-slide-in">
                      <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                      <span className="text-sm font-medium">{errors.pilihan2.message}</span>
                    </div>
                  )}
                </div>

                {/* Pilihan 3 */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                    <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-xs font-bold">3</div>
                    <span>Pilihan Ketiga</span>
                    <span className="text-red-500">*</span>
                  </Label>
                  <Select onValueChange={(value) => setValue("pilihan3", value)}>
                    <SelectTrigger className="h-12 bg-white border-2 border-gray-200 rounded-xl transition-all duration-200 focus:border-purple-400 focus:ring-4 focus:ring-purple-50 hover:border-purple-300">
                      <SelectValue placeholder="Pilih program studi cadangan" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-2 border-gray-100 shadow-xl">
                      {programs
                        .filter((program) => program !== watchedValues.pilihan1 && program !== watchedValues.pilihan2)
                        .map((program) => (
                          <SelectItem key={program} value={program} className="rounded-lg hover:bg-purple-50 focus:bg-purple-50 py-3">
                            {program}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  {errors.pilihan3 && (
                    <div className="flex items-center space-x-2 text-red-600 animate-slide-in">
                      <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                      <span className="text-sm font-medium">{errors.pilihan3.message}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Program Studi yang Diterima */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Program Studi yang Diterima</span>
                  <span className="text-gray-500 text-xs">(Opsional)</span>
                </Label>
                <Select onValueChange={(value) => setValue("programStudiDilulusi", value)}>
                  <SelectTrigger className="h-12 bg-white border-2 border-gray-200 rounded-xl transition-all duration-200 focus:border-green-400 focus:ring-4 focus:ring-green-50 hover:border-green-300">
                    <SelectValue placeholder="Pilih program studi yang diterima (jika sudah ada)" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-2 border-gray-100 shadow-xl">
                    {programs.map((program) => (
                      <SelectItem key={program} value={program} className="rounded-lg hover:bg-green-50 focus:bg-green-50 py-3">
                        {program}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step 3: Status Proses */}
        <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md bg-gradient-to-br from-white to-gray-50/50 rounded-2xl overflow-hidden">
          <CardHeader className="pb-4 bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-gray-900">Status Proses Pendaftaran</CardTitle>
                <CardDescription className="text-gray-600">
                  Tandai proses yang sudah diselesaikan oleh mahasiswa
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {/* Bayar Pendaftaran */}
              <div className="flex items-center justify-between p-4 bg-white border-2 border-gray-200 rounded-xl hover:border-emerald-300 transition-all">
                <div className="flex items-center space-x-3">
                  <CreditCard className="w-5 h-5 text-emerald-500" />
                  <div>
                    <Label className="text-sm font-semibold text-gray-700">Bayar Pendaftaran</Label>
                    <p className="text-xs text-gray-500">Pembayaran biaya pendaftaran</p>
                  </div>
                </div>
                <Switch
                  checked={watchedValues.bayarPendaftaran}
                  onCheckedChange={(checked) => setValue("bayarPendaftaran", checked)}
                />
              </div>

              {/* Biodata */}
              <div className="flex items-center justify-between p-4 bg-white border-2 border-gray-200 rounded-xl hover:border-emerald-300 transition-all">
                <div className="flex items-center space-x-3">
                  <FileText className="w-5 h-5 text-emerald-500" />
                  <div>
                    <Label className="text-sm font-semibold text-gray-700">Biodata</Label>
                    <p className="text-xs text-gray-500">Pengisian data pribadi</p>
                  </div>
                </div>
                <Switch
                  checked={watchedValues.biodata}
                  onCheckedChange={(checked) => setValue("biodata", checked)}
                />
              </div>

              {/* Upload Berkas */}
              <div className="flex items-center justify-between p-4 bg-white border-2 border-gray-200 rounded-xl hover:border-emerald-300 transition-all">
                <div className="flex items-center space-x-3">
                  <Upload className="w-5 h-5 text-emerald-500" />
                  <div>
                    <Label className="text-sm font-semibold text-gray-700">Upload Berkas</Label>
                    <p className="text-xs text-gray-500">Upload dokumen persyaratan</p>
                  </div>
                </div>
                <Switch
                  checked={watchedValues.uploadBerkas}
                  onCheckedChange={(checked) => setValue("uploadBerkas", checked)}
                />
              </div>

              {/* Validasi */}
              <div className="flex items-center justify-between p-4 bg-white border-2 border-gray-200 rounded-xl hover:border-emerald-300 transition-all">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                  <div>
                    <Label className="text-sm font-semibold text-gray-700">Validasi</Label>
                    <p className="text-xs text-gray-500">Verifikasi dokumen</p>
                  </div>
                </div>
                <Switch
                  checked={watchedValues.validasi}
                  onCheckedChange={(checked) => setValue("validasi", checked)}
                />
              </div>

              {/* Daftar Ulang */}
              <div className="flex items-center justify-between p-4 bg-white border-2 border-gray-200 rounded-xl hover:border-emerald-300 transition-all">
                <div className="flex items-center space-x-3">
                  <User className="w-5 h-5 text-emerald-500" />
                  <div>
                    <Label className="text-sm font-semibold text-gray-700">Daftar Ulang</Label>
                    <p className="text-xs text-gray-500">Konfirmasi pendaftaran</p>
                  </div>
                </div>
                <Switch
                  checked={watchedValues.daftarUlang}
                  onCheckedChange={(checked) => setValue("daftarUlang", checked)}
                />
              </div>

              {/* Kirim Audio */}
              <div className="flex items-center justify-between p-4 bg-white border-2 border-gray-200 rounded-xl hover:border-emerald-300 transition-all">
                <div className="flex items-center space-x-3">
                  <Volume2 className="w-5 h-5 text-emerald-500" />
                  <div>
                    <Label className="text-sm font-semibold text-gray-700">Kirim Audio</Label>
                    <p className="text-xs text-gray-500">Sertakan pesan suara</p>
                  </div>
                </div>
                <Switch
                  checked={watchedValues.isSendGenAudio}
                  onCheckedChange={(checked) => setValue("isSendGenAudio", checked)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <Card className="border-0 shadow-md bg-gradient-to-r from-gray-50 to-white rounded-2xl overflow-hidden">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-end">
              {/* Development Mode: Clear Console Button */}
              {process.env.NODE_ENV === 'development' && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClearConsole}
                  className="flex-1 sm:flex-none h-12 px-6 border-2 border-yellow-300 hover:border-yellow-400 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 rounded-xl transition-all duration-200 transform hover:scale-105 font-medium"
                >
                  🧹 Clear Console
                </Button>
              )}

              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                className="flex-1 sm:flex-none h-12 px-6 border-2 border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 text-gray-700 rounded-xl transition-all duration-200 transform hover:scale-105 font-medium"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset Form
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1 sm:flex-none h-12 px-8 bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 hover:from-blue-600 hover:via-cyan-600 hover:to-teal-600 text-white font-bold rounded-xl transition-all duration-200 transform hover:scale-105 disabled:transform-none shadow-lg hover:shadow-xl"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Mengirim Pesan...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5 mr-2" />
                    Kirim Pesan Individual
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
