"use client"

import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { StudentRegistrationForm } from "@/components/student-registration-form"
import { GreetingGeneratorForm } from "@/components/greeting-generator-form"
import { useDashboard } from "@/hooks/use-dashboard"
import { UserPlus, MessageCircle, User, Bell, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const menuConfig = {
  registrasi: {
    title: "Registrasi Mahasiswa",
    description: "Daftarkan mahasiswa baru dengan pilihan program studi",
    icon: UserPlus,
    component: StudentRegistrationForm,
  },
  sapaan: {
    title: "Generator Sapaan",
    description: "Buat sapaan personal untuk mahasiswa yang terdaftar",
    icon: MessageCircle,
    component: GreetingGeneratorForm,
  },
}

export function DashboardContent() {
  const { activeMenu } = useDashboard()
  const currentMenu = menuConfig[activeMenu as keyof typeof menuConfig]
  const IconComponent = currentMenu?.icon || UserPlus
  const FormComponent = currentMenu?.component || StudentRegistrationForm

  return (
    <SidebarInset className="flex-1 flex flex-col min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Enhanced Header with proper spacing */}
      <header className="flex h-16 shrink-0 items-center gap-2 border-b border-gray-200/60 px-4 sm:px-6 bg-white/95 backdrop-blur-sm shadow-sm sticky top-0 z-10">
        <SidebarTrigger className="-ml-1 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200 p-2 rounded-lg" />
        <Separator orientation="vertical" className="mr-2 h-4" />

        {/* Search Bar - responsive */}
        <div className="flex-1 max-w-md hidden sm:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Cari mahasiswa atau menu..."
              className="pl-10 bg-gray-50/80 border-gray-200 focus:bg-white focus:border-blue-300 transition-all duration-200 h-9"
            />
          </div>
        </div>

        {/* Header Actions - responsive */}
        <div className="flex items-center space-x-2 ml-auto">
          <Button
            variant="ghost"
            size="sm"
            className="hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200 p-2 h-9 w-9 sm:h-auto sm:w-auto sm:px-3"
          >
            <Bell className="w-4 h-4" />
            <span className="sr-only sm:not-sr-only sm:ml-2 hidden sm:inline">Notifikasi</span>
          </Button>
          <Separator orientation="vertical" className="h-6 hidden sm:block" />
          <div className="flex items-center space-x-3 pl-2">
            <div className="text-right hidden md:block">
              <p className="text-sm font-medium text-gray-900">Selamat datang, Admin</p>
              <p className="text-xs text-gray-500">Dashboard Registrasi Universitas</p>
            </div>
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-teal-500 rounded-full flex items-center justify-center shadow-sm">
              <User className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>
      </header>

      {/* Enhanced Breadcrumb - responsive */}
      <div className="flex items-center gap-2 px-4 sm:px-6 py-3 bg-white/50 border-b border-gray-100">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink
                href="#"
                className="text-gray-600 hover:text-blue-600 transition-colors duration-200 text-sm"
              >
                Dashboard
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-gray-900 font-medium text-sm">
                {currentMenu?.title || "Registrasi Mahasiswa"}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Enhanced Main Content with proper responsive padding */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
        <div className="max-w-5xl mx-auto w-full">
          <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm overflow-hidden">
            <CardHeader className="text-center space-y-4 pb-6 bg-gradient-to-r from-blue-50 to-teal-50 border-b border-gray-100 px-4 sm:px-6 lg:px-8">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-teal-500 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                <IconComponent className="w-8 h-8 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
                  {currentMenu?.title || "Registrasi Mahasiswa"}
                </CardTitle>
                <CardDescription className="text-gray-600 mt-2 max-w-md mx-auto text-sm sm:text-base">
                  {currentMenu?.description || "Daftarkan mahasiswa baru dengan pilihan program studi"}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="pt-6 sm:pt-8 pb-6 sm:pb-8 px-4 sm:px-6 lg:px-8">
              <FormComponent />
            </CardContent>
          </Card>
        </div>
      </main>
    </SidebarInset>
  )
}
