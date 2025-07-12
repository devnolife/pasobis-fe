"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

type DashboardContextType = {
  activeMenu: string
  setActiveMenu: (menu: string) => void
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined)

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [activeMenu, setActiveMenu] = useState("registrasi")

  return <DashboardContext.Provider value={{ activeMenu, setActiveMenu }}>{children}</DashboardContext.Provider>
}

export function useDashboard() {
  const context = useContext(DashboardContext)
  if (context === undefined) {
    throw new Error("useDashboard must be used within a DashboardProvider")
  }
  return context
}
