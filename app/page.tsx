"use client"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { DashboardContent } from "@/components/dashboard-content"
import { DashboardProvider } from "@/hooks/use-dashboard"
import { Toaster } from "@/components/ui/toaster"

export default function UniversityDashboard() {
  return (
    <DashboardProvider>
      <SidebarProvider defaultOpen={true}>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <DashboardContent />
        </div>
        <Toaster />
      </SidebarProvider>
    </DashboardProvider>
  )
}
