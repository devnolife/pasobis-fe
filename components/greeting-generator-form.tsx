"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Loader2, User, BookOpen, Sparkles, RotateCcw, CheckCircle, MessageCircle, ArrowRight, Wand2 } from "lucide-react"
import { programs } from "@/lib/programs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const formSchema = z.object({
  nama: z.string().min(1, "Nama mahasiswa wajib diisi").min(2, "Nama minimal 2 karakter"),
  pilihan1: z.string().min(1, "Pilihan program studi 1 wajib diisi"),
  pilihan2: z.string().min(1, "Pilihan program studi 2 wajib diisi"),
  pilihan3: z.string().min(1, "Pilihan program studi 3 wajib diisi"),
})

type FormData = z.infer<typeof formSchema>

export function GreetingGeneratorForm() {
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
  })

  const watchedValues = watch()

  const onSubmit = async (data: FormData) => {
    setIsLoading(true)
    setShowSuccess(false)

    try {
      const response = await fetch("https://passobis.if.unismuh.ac.id/sapaan/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        setShowSuccess(true)
        toast({
          title: "Sapaan Berhasil Dibuat! ✨",
          description: `Sapaan personal untuk ${data.nama} telah berhasil dibuat.`,
          className: "bg-green-50 border-green-200 text-green-800",
        })
        reset()
        setTimeout(() => setShowSuccess(false), 5000)
      } else {
        throw new Error("Pembuatan sapaan gagal")
      }
    } catch (error) {
      toast({
        title: "Pembuatan Sapaan Gagal",
        description: "Terjadi kesalahan saat membuat sapaan. Silakan coba lagi.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    reset()
    setShowSuccess(false)
    toast({
      title: "Form Direset",
      description: "Semua field telah dikosongkan",
    })
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {showSuccess && (
        <Alert className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 text-green-800 rounded-xl animate-slide-in shadow-lg">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <AlertDescription className="font-medium">
            Sapaan personal berhasil dibuat! Sapaan telah tersimpan dalam sistem.
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Step 1: Informasi Mahasiswa */}
        <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md bg-gradient-to-br from-white to-gray-50/50 rounded-2xl overflow-hidden">
          <CardHeader className="pb-4 bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-gray-900">Informasi Mahasiswa</CardTitle>
                <CardDescription className="text-gray-600">
                  Masukkan nama mahasiswa untuk membuat sapaan personal
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              <Label htmlFor="nama" className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                <User className="w-4 h-4 text-purple-500" />
                <span>Nama Mahasiswa</span>
                <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="nama"
                  placeholder="Masukkan nama lengkap mahasiswa"
                  className="pl-4 pr-12 py-4 bg-white border-2 border-gray-200 rounded-xl transition-all duration-200 focus:border-purple-400 focus:ring-4 focus:ring-purple-50 hover:border-purple-300 text-gray-900 placeholder:text-gray-500 text-lg"
                  {...register("nama")}
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                  <MessageCircle className="w-5 h-5 text-gray-400" />
                </div>
              </div>
              {errors.nama && (
                <div className="flex items-center space-x-2 text-red-600 animate-slide-in">
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                  <span className="text-sm font-medium">{errors.nama.message}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Step 2: Pilihan Program Studi */}
        <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md bg-gradient-to-br from-white to-gray-50/50 rounded-2xl overflow-hidden">
          <CardHeader className="pb-4 bg-gradient-to-r from-indigo-50 to-blue-50 border-b border-indigo-100">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-gray-900">Pilihan Program Studi</CardTitle>
                <CardDescription className="text-gray-600">
                  Pilih 3 program studi yang akan disertakan dalam sapaan
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
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
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <Card className="border-0 shadow-md bg-gradient-to-r from-gray-50 to-white rounded-2xl overflow-hidden">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-end">
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
                className="flex-1 sm:flex-none h-12 px-8 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 hover:from-purple-600 hover:via-pink-600 hover:to-orange-600 text-white font-bold rounded-xl transition-all duration-200 transform hover:scale-105 disabled:transform-none shadow-lg hover:shadow-xl"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Membuat Sapaan...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-5 h-5 mr-2" />
                    Buat Sapaan
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
