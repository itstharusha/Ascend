"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  MessageSquare,
  PlusCircle,
  CreditCard,
  Settings,
  Sparkles,
  ChevronLeft,
  LogOut,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useUserStore } from "@/lib/stores/user-store"
import { useBillingStore } from "@/lib/stores/billing-store"
import { useEffect } from "react"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Consultations", href: "/dashboard/consultations", icon: MessageSquare },
  { name: "New Consultation", href: "/dashboard/new-consultation", icon: PlusCircle },
  { name: "Billing", href: "/dashboard/billing", icon: CreditCard },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
]

interface SidebarProps {
  isCollapsed: boolean
  onToggle: () => void
}

export function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const pathname = usePathname()
  const { user, logout } = useUserStore()
  const { plansData, fetchPlans } = useBillingStore()

  useEffect(() => {
    if (!plansData) fetchPlans()
  }, [plansData, fetchPlans])

  const planInfo = user ? plansData?.plans.find((p) => p.id === user.subscription) : null

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-50 flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300",
        isCollapsed ? "w-16" : "w-64",
      )}
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-sidebar-border">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center shrink-0">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          {!isCollapsed && <span className="font-bold text-lg gradient-text">Ascend</span>}
        </Link>
        <Button variant="ghost" size="icon" className="ml-auto" onClick={onToggle}>
          <ChevronLeft className={cn("h-4 w-4 transition-transform", isCollapsed && "rotate-180")} />
          <span className="sr-only">Toggle sidebar</span>
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                isCollapsed && "justify-center px-2",
              )}
            >
              <item.icon className={cn("h-5 w-5 shrink-0", isActive && "text-primary")} />
              {!isCollapsed && <span>{item.name}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Plan Status */}
      {!isCollapsed && planInfo && (
        <div className="mx-3 mb-4 p-3 rounded-lg bg-primary/10 border border-primary/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-primary">{planInfo.name} Plan</span>
            {user?.subscription !== "enterprise" && (
              <Link href="/dashboard/billing" className="text-xs text-primary hover:underline">
                Upgrade
              </Link>
            )}
          </div>
          {user && user.consultationsLimit > 0 && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Consultations</span>
                <span>
                  {user.consultationsUsed}/{user.consultationsLimit}
                </span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full gradient-primary rounded-full transition-all"
                  style={{ width: `${(user.consultationsUsed / user.consultationsLimit) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* User */}
      <div className="p-2 border-t border-sidebar-border">
        <div className={cn("flex items-center gap-3 p-2 rounded-lg", isCollapsed && "justify-center")}>
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarImage src={user?.image || "/professional-headshot.png"} alt={user?.name} />
            <AvatarFallback>
              {user?.name
                ?.split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          )}
          {!isCollapsed && (
            <Button variant="ghost" size="icon" className="shrink-0" onClick={logout}>
              <LogOut className="h-4 w-4" />
              <span className="sr-only">Log out</span>
            </Button>
          )}
        </div>
      </div>
    </aside>
  )
}
