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
import { Loader2, User, BookOpen, Sparkles, RotateCcw, CheckCircle } from "lucide-react"
import { programs } from "@/lib/programs"
import { Alert, AlertDescription } from "@/components/ui/alert"

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
    <div className="space-y-6 max-w-4xl mx-auto">
      {showSuccess && (
        <Alert className="bg-green-50 border-green-200 text-green-800">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>Sapaan personal berhasil dibuat! Sapaan telah tersimpan dalam sistem.</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Nama Mahasiswa - full width */}
        <div className="space-y-2">
          <Label htmlFor="nama" className="text-sm font-medium text-gray-700 flex items-center space-x-2">
            <User className="w-4 h-4 text-blue-500" />
            <span>Nama Mahasiswa *</span>
          </Label>
          <Input
            id="nama"
            placeholder="Masukkan nama lengkap mahasiswa"
            className="transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-blue-300"
            {...register("nama")}
          />
          {errors.nama && (
            <p className="text-sm text-red-600 animate-in slide-in-from-left-1 flex items-center space-x-1">
              <span className="w-1 h-1 bg-red-600 rounded-full"></span>
              <span>{errors.nama.message}</span>
            </p>
          )}
        </div>

        {/* Pilihan Program Studi */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2 mb-4">
            <BookOpen className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-medium text-gray-700">Pilihan Program Studi *</span>
          </div>

          <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-3">
            {/* Pilihan 1 */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-600">Pilihan 1 *</Label>
              <Select onValueChange={(value) => setValue("pilihan1", value)}>
                <SelectTrigger className="transition-all duration-200 focus:ring-2 focus:ring-blue-500 hover:border-blue-300">
                  <SelectValue placeholder="Pilih program studi" />
                </SelectTrigger>
                <SelectContent>
                  {programs.map((program) => (
                    <SelectItem key={program} value={program} className="hover:bg-blue-50">
                      {program}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.pilihan1 && (
                <p className="text-sm text-red-600 animate-in slide-in-from-left-1 flex items-center space-x-1">
                  <span className="w-1 h-1 bg-red-600 rounded-full"></span>
                  <span>{errors.pilihan1.message}</span>
                </p>
              )}
            </div>

            {/* Pilihan 2 */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-600">Pilihan 2 *</Label>
              <Select onValueChange={(value) => setValue("pilihan2", value)}>
                <SelectTrigger className="transition-all duration-200 focus:ring-2 focus:ring-blue-500 hover:border-blue-300">
                  <SelectValue placeholder="Pilih program studi" />
                </SelectTrigger>
                <SelectContent>
                  {programs
                    .filter((program) => program !== watchedValues.pilihan1)
                    .map((program) => (
                      <SelectItem key={program} value={program} className="hover:bg-blue-50">
                        {program}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {errors.pilihan2 && (
                <p className="text-sm text-red-600 animate-in slide-in-from-left-1 flex items-center space-x-1">
                  <span className="w-1 h-1 bg-red-600 rounded-full"></span>
                  <span>{errors.pilihan2.message}</span>
                </p>
              )}
            </div>

            {/* Pilihan 3 */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-600">Pilihan 3 *</Label>
              <Select onValueChange={(value) => setValue("pilihan3", value)}>
                <SelectTrigger className="transition-all duration-200 focus:ring-2 focus:ring-blue-500 hover:border-blue-300">
                  <SelectValue placeholder="Pilih program studi" />
                </SelectTrigger>
                <SelectContent>
                  {programs
                    .filter((program) => program !== watchedValues.pilihan1 && program !== watchedValues.pilihan2)
                    .map((program) => (
                      <SelectItem key={program} value={program} className="hover:bg-blue-50">
                        {program}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {errors.pilihan3 && (
                <p className="text-sm text-red-600 animate-in slide-in-from-left-1 flex items-center space-x-1">
                  <span className="w-1 h-1 bg-red-600 rounded-full"></span>
                  <span>{errors.pilihan3.message}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Buttons - responsive */}
        <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-100">
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            className="flex-1 sm:flex-none border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 bg-transparent order-2 sm:order-1"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset Form
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            className="flex-1 bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600 text-white font-medium py-3 rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:transform-none shadow-lg hover:shadow-xl order-1 sm:order-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sedang memproses...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Buat Sapaan
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
