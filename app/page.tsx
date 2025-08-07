"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Toaster } from "@/components/ui/toaster"
import { StudentRegistrationForm } from "@/components/student-registration-form"
import { GreetingGeneratorForm } from "@/components/greeting-generator-form"
import { WhatsappBroadcastManager } from "@/components/whatsapp-broadcast-manager"
import { SobisMessageSender } from "@/components/sobis-message-sender"
import {
  GraduationCap,
  UserPlus,
  MessageCircle,
  Menu,
  X,
  Search,
  Bell,
  User,
  Home,
  Settings,
  FileSpreadsheet,
  MessageSquare,
  Send
} from "lucide-react"

export default function UniversityDashboard() {
  const [activeMenu, setActiveMenu] = useState("sobis-sender")
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const menuItems = [
    {
      id: "sobis-sender",
      title: "Kirim Pesan Individual",
      description: "Kirim Pesan Individual individual ke calon mahasiswa",
      icon: Send,
    },
    {
      id: "whatsapp-broadcast",
      title: "Broadcast WhatsApp",
      description: "Upload file dan kirim pesan WhatsApp ke mahasiswa secara otomatis",
      icon: MessageSquare,
    },
  ]

  const currentMenu = menuItems.find(item => item.id === activeMenu) || menuItems[0]
  const IconComponent = currentMenu.icon

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-4 left-4 z-50 w-72 h-[calc(100vh-2rem)] bg-white shadow-lg rounded-2xl transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-teal-500 rounded-xl flex items-center justify-center shadow-sm">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900">Dashboard</h1>
                  <p className="text-sm text-gray-600">Registrasi Universitas</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden rounded-lg hover:bg-gray-100"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">
                  Menu Utama
                </h3>
                <div className="space-y-2">
                  {menuItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveMenu(item.id)
                        setSidebarOpen(false)
                      }}
                      className={`
                        w-full flex items-start space-x-3 p-4 rounded-xl transition-all duration-200 text-left
                        ${activeMenu === item.id
                          ? 'bg-gradient-to-r from-blue-50 to-teal-50 text-blue-700 shadow-sm border border-blue-100'
                          : 'hover:bg-gray-50 text-gray-700 hover:shadow-sm'
                        }
                      `}
                    >
                      <item.icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="font-medium text-sm">{item.title}</div>
                        <div className="text-xs text-gray-500 mt-1">{item.description}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-100">
            <div className="flex items-center space-x-3 p-3 rounded-xl bg-gray-50">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-teal-500 rounded-xl flex items-center justify-center shadow-sm">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Admin</p>
                <p className="text-xs text-gray-500">admin@universitas.ac.id</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="md:ml-80">
        {/* Header */}
        <header className="bg-white shadow-sm border border-gray-200 rounded-2xl mb-6 sticky top-4 z-30">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden rounded-lg hover:bg-gray-100"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </Button>

              <div className="flex items-center space-x-2 text-sm">
                <span className="text-gray-500">Dashboard</span>
                <span className="text-gray-300">/</span>
                <span className="text-gray-900 font-medium">{currentMenu.title}</span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="hidden sm:block">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Cari mahasiswa..."
                    className="pl-10 w-64 bg-gray-50 border-gray-200 focus:bg-white rounded-xl"
                  />
                </div>
              </div>

              <Button variant="ghost" size="sm" className="rounded-xl hover:bg-gray-100">
                <Bell className="w-4 h-4" />
              </Button>

              <div className="flex items-center space-x-3">
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-medium text-gray-900">Selamat datang, Admin</p>
                  <p className="text-xs text-gray-500">Dashboard Registrasi</p>
                </div>
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-teal-500 rounded-xl flex items-center justify-center shadow-sm">
                  <User className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="pb-6">
          <div className="max-w mx-auto">
            <Card className="shadow-lg border border-gray-200 bg-white rounded-2xl overflow-hidden">
              <CardHeader className="text-center pb-6 bg-gradient-to-r from-blue-50 to-teal-50">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <IconComponent className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-2xl font-bold text-gray-900">
                  {currentMenu.title}
                </CardTitle>
                <CardDescription className="text-gray-600 max-w-md mx-auto">
                  {currentMenu.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                {activeMenu === "sobis-sender" && <SobisMessageSender />}
                {activeMenu === "registrasi" && <StudentRegistrationForm />}
                {activeMenu === "sapaan" && <GreetingGeneratorForm />}
                {activeMenu === "whatsapp-broadcast" && <WhatsappBroadcastManager />}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Toaster />
    </div>
  )
}
