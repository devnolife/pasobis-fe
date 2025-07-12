"use client"

import { GraduationCap, UserPlus, MessageCircle, Home, Settings } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { useDashboard } from "@/hooks/use-dashboard"

const menuItems = [
  {
    id: "registrasi",
    title: "Registrasi Mahasiswa",
    description: "Daftarkan mahasiswa baru dengan pilihan program studi",
    icon: UserPlus,
  },
  {
    id: "sapaan",
    title: "Generator Sapaan",
    description: "Buat sapaan personal untuk mahasiswa yang terdaftar",
    icon: MessageCircle,
  },
]

const otherMenuItems = [
  {
    id: "dashboard",
    title: "Dashboard Utama",
    icon: Home,
  },
  {
    id: "pengaturan",
    title: "Pengaturan",
    icon: Settings,
  },
]

export function AppSidebar() {
  const { activeMenu, setActiveMenu } = useDashboard()

  return (
    <Sidebar variant="sidebar" collapsible="icon" className="border-r border-gray-200/60 bg-white shadow-sm">
      {/* Sidebar Header */}
      <SidebarHeader className="border-b border-gray-100 p-4 bg-gradient-to-r from-blue-50/50 to-teal-50/50">
        <div className="flex items-center space-x-3 group-data-[collapsible=icon]:justify-center">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-teal-500 rounded-xl flex items-center justify-center shadow-md">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div className="group-data-[collapsible=icon]:hidden">
            <h2 className="text-lg font-bold text-gray-900">Dashboard</h2>
            <p className="text-sm text-gray-600">Registrasi Universitas</p>
          </div>
        </div>
      </SidebarHeader>

      {/* Sidebar Content */}
      <SidebarContent className="px-3 py-4 bg-gradient-to-b from-white to-gray-50/30">
        {/* Menu Utama */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 py-2 group-data-[collapsible=icon]:hidden">
            Menu Utama
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    onClick={() => setActiveMenu(item.id)}
                    isActive={activeMenu === item.id}
                    tooltip={item.title}
                    className={`
                      w-full justify-start p-3 rounded-xl transition-all duration-300 ease-in-out
                      hover:bg-blue-50 hover:text-blue-700 hover:shadow-sm hover:scale-[1.02]
                      data-[active=true]:bg-gradient-to-r data-[active=true]:from-blue-500 data-[active=true]:to-teal-500 
                      data-[active=true]:text-white data-[active=true]:shadow-lg data-[active=true]:shadow-blue-200/30
                      group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-3
                      group-data-[collapsible=icon]:w-12 group-data-[collapsible=icon]:h-12
                    `}
                  >
                    <item.icon className="w-5 h-5 mr-3 group-data-[collapsible=icon]:mr-0 flex-shrink-0" />
                    <div className="text-left group-data-[collapsible=icon]:hidden flex-1 min-w-0">
                      <div className="font-medium text-sm leading-tight">{item.title}</div>
                      <div className="text-xs opacity-80 mt-1 line-clamp-2 leading-relaxed">{item.description}</div>
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Menu Lainnya */}
        <SidebarGroup className="mt-8">
          <SidebarGroupLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 py-2 group-data-[collapsible=icon]:hidden">
            Lainnya
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {otherMenuItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    tooltip={item.title}
                    className="w-full justify-start p-3 rounded-xl transition-all duration-300 ease-in-out hover:bg-gray-50 hover:text-gray-700 hover:shadow-sm group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:w-12 group-data-[collapsible=icon]:h-12"
                  >
                    <item.icon className="w-5 h-5 mr-3 group-data-[collapsible=icon]:mr-0 flex-shrink-0 text-gray-500" />
                    <span className="text-sm font-medium group-data-[collapsible=icon]:hidden text-gray-700">
                      {item.title}
                    </span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Sidebar Footer */}
      <SidebarFooter className="border-t border-gray-100 p-4 bg-gradient-to-r from-blue-50/30 to-teal-50/30">
        <div className="flex items-center space-x-3 group-data-[collapsible=icon]:justify-center">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-teal-500 rounded-lg flex items-center justify-center shadow-sm">
            <span className="text-white text-sm font-semibold">A</span>
          </div>
          <div className="group-data-[collapsible=icon]:hidden">
            <p className="text-sm font-medium text-gray-900">Admin</p>
            <p className="text-xs text-gray-500">admin@universitas.ac.id</p>
          </div>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
