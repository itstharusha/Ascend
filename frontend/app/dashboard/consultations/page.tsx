"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ConsultationCard } from "@/components/dashboard/consultation-card"
import { useConsultationStore } from "@/lib/stores/consultation-store"
import { PlusCircle, Search, Filter } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"
import type { ConsultationStatus, ConsultationPlan } from "@/types/consultation"

export default function ConsultationsPage() {
  const searchParams = useSearchParams()
  const { consultations, fetchConsultations, isLoading } = useConsultationStore()
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "")
  const [statusFilter, setStatusFilter] = useState<ConsultationStatus | "all">("all")
  const [planFilter, setPlanFilter] = useState<ConsultationPlan | "all">("all")

  useEffect(() => {
    fetchConsultations()
  }, [fetchConsultations])

  // Update search query from URL params
  useEffect(() => {
    const urlSearch = searchParams.get("search")
    if (urlSearch) {
      setSearchQuery(urlSearch)
    }
  }, [searchParams])

  const filteredConsultations = consultations.filter((c) => {
    const matchesSearch =
      c.business.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.goal.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || c.status === statusFilter
    const matchesPlan = planFilter === "all" || c.plan === planFilter
    return matchesSearch && matchesStatus && matchesPlan
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Consultations</h1>
          <p className="text-muted-foreground mt-1">Manage and review all your business consultations</p>
        </div>
        <Button asChild className="gradient-primary text-primary-foreground">
          <Link href="/dashboard/new-consultation">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Consultation
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search consultations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ConsultationStatus | "all")}>
            <SelectTrigger className="w-36">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={planFilter} onValueChange={(v) => setPlanFilter(v as ConsultationPlan | "all")}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Plan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Plans</SelectItem>
              <SelectItem value="basic">Basic</SelectItem>
              <SelectItem value="premium">Premium</SelectItem>
              <SelectItem value="ultra">Ultra</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Consultations Grid */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="glass-card">
              <CardContent className="p-6">
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredConsultations.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredConsultations.map((consultation) => (
            <ConsultationCard key={consultation.id} consultation={consultation} />
          ))}
        </div>
      ) : (
        <Card className="glass-card">
          <CardContent className="py-12 text-center">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold mb-2">No consultations found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {searchQuery || statusFilter !== "all" || planFilter !== "all"
                ? "Try adjusting your filters"
                : "Start your first consultation to get strategic insights"}
            </p>
            <Button asChild className="gradient-primary text-primary-foreground">
              <Link href="/dashboard/new-consultation">
                <PlusCircle className="mr-2 h-4 w-4" />
                Start Consultation
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
