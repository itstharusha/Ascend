"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "./sidebar"
import { TopNav } from "./top-nav"
import { useUserStore } from "@/lib/stores/user-store"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

interface DashboardShellProps {
  children: React.ReactNode
}

export function DashboardShell({ children }: DashboardShellProps) {
  const router = useRouter()
  const { isAuthenticated, fetchUser, isLoading } = useUserStore()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (!isAuthenticated) {
      fetchUser()
    }
  }, [isAuthenticated, fetchUser])

  useEffect(() => {
    if (mounted && !isLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [mounted, isLoading, isAuthenticated, router])

  if (!mounted || isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar isCollapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <TopNav onMenuClick={() => setSidebarCollapsed(!sidebarCollapsed)} isSidebarCollapsed={sidebarCollapsed} />
      <main className={cn("pt-16 min-h-screen transition-all duration-300", sidebarCollapsed ? "pl-16" : "pl-64")}>
        <div className="p-6 md:p-8">{children}</div>
      </main>
    </div>
  )
}
