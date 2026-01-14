"use client"

import { useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { StatCard } from "@/components/dashboard/stat-card"
import { ConsultationCard } from "@/components/dashboard/consultation-card"
import { useConsultationStore } from "@/lib/stores/consultation-store"
import { useUserStore } from "@/lib/stores/user-store"
import { useBillingStore } from "@/lib/stores/billing-store"
import { Activity, FileText, Calendar, Sparkles, PlusCircle, ArrowRight, TrendingUp } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { format } from "date-fns"

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-16" />
                </div>
                <Skeleton className="h-12 w-12 rounded-xl" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="glass-card">
            <CardContent className="p-6">
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { consultations, fetchConsultations, isLoading } = useConsultationStore()
  const { user } = useUserStore()
  const { plansData, fetchPlans } = useBillingStore()

  useEffect(() => {
    fetchConsultations()
  }, [fetchConsultations])

  useEffect(() => {
    if (!plansData) fetchPlans()
  }, [plansData, fetchPlans])

  const planInfo = user ? plansData?.plans.find((p) => p.id === user.subscription) : null
  const activeConsultations = consultations.filter((c) => c.status === "processing").length
  const completedConsultations = consultations.filter((c) => c.status === "completed").length
  const lastConsultation = consultations[0]

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Welcome back! Here&apos;s an overview of your consultations.</p>
          </div>
        </div>
        <DashboardSkeleton />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, {user?.name?.split(" ")[0]}! Here&apos;s your overview.
          </p>
        </div>
        <Button asChild className="gradient-primary text-primary-foreground">
          <Link href="/dashboard/new-consultation">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Consultation
          </Link>
        </Button>
      </div>

      {/* Trial/Upgrade Banner */}
      {user?.subscription === "free" && (
        <Card className="bg-gradient-to-r from-primary/10 via-chart-2/10 to-primary/10 border-primary/20">
          <CardContent className="py-4 px-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full gradient-primary flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold">Upgrade to unlock full potential</h3>
                  <p className="text-sm text-muted-foreground">
                    Get more consultations, refinements, and advanced visualizations
                  </p>
                </div>
              </div>
              <Button
                asChild
                variant="outline"
                className="border-primary text-primary hover:bg-primary/10 bg-transparent"
              >
                <Link href="/dashboard/billing">
                  View Plans
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Active Consultations"
          value={activeConsultations}
          description="Currently processing"
          icon={Activity}
          trend={activeConsultations > 0 ? { value: 100, isPositive: true } : undefined}
        />
        <StatCard
          title="Total Consultations"
          value={consultations.length}
          description="All time"
          icon={FileText}
          trend={undefined}
        />
        <StatCard
          title="Current Plan"
          value={planInfo?.name || "Free"}
          description={`$${planInfo?.price_monthly_usd || 0}/mo`}
          icon={TrendingUp}
        />
        <StatCard
          title="Last Consultation"
          value={lastConsultation ? format(new Date(lastConsultation.createdAt), "MMM d") : "N/A"}
          description={lastConsultation?.business.name || "No consultations yet"}
          icon={Calendar}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Consultations */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Recent Consultations</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/consultations">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          {consultations.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {consultations.slice(0, 4).map((consultation) => (
                <ConsultationCard key={consultation.id} consultation={consultation} />
              ))}
            </div>
          ) : (
            <Card className="glass-card">
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold mb-2">No consultations yet</h3>
                <p className="text-sm text-muted-foreground mb-4">Start your first AI-powered business consultation</p>
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

        {/* Quick Actions & Tips */}
        <div className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
              <CardDescription>Common tasks to help you get started</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start bg-transparent" asChild>
                <Link href="/dashboard/new-consultation">
                  <PlusCircle className="mr-2 h-4 w-4 text-primary" />
                  Start New Consultation
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start bg-transparent" asChild>
                <Link href="/dashboard/consultations">
                  <FileText className="mr-2 h-4 w-4 text-primary" />
                  View All Consultations
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start bg-transparent" asChild>
                <Link href="/dashboard/billing">
                  <TrendingUp className="mr-2 h-4 w-4 text-primary" />
                  Upgrade Plan
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg">Pro Tips</CardTitle>
              <CardDescription>Get the most out of Ascend</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm">
                <li className="flex gap-2">
                  <span className="h-5 w-5 rounded-full gradient-primary text-primary-foreground flex items-center justify-center text-xs shrink-0">
                    1
                  </span>
                  <span className="text-muted-foreground">
                    Provide detailed financial data for more accurate projections
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="h-5 w-5 rounded-full gradient-primary text-primary-foreground flex items-center justify-center text-xs shrink-0">
                    2
                  </span>
                  <span className="text-muted-foreground">Use refinements to dive deeper into specific strategies</span>
                </li>
                <li className="flex gap-2">
                  <span className="h-5 w-5 rounded-full gradient-primary text-primary-foreground flex items-center justify-center text-xs shrink-0">
                    3
                  </span>
                  <span className="text-muted-foreground">Export your strategies as PDF to share with your team</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Usage Stats */}
          {user && planInfo && user.consultationsLimit > 0 && (
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg">Monthly Usage</CardTitle>
                <CardDescription>
                  {user.consultationsUsed} of {user.consultationsLimit} consultations used
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full gradient-primary rounded-full transition-all duration-500"
                      style={{ width: `${(user.consultationsUsed / user.consultationsLimit) * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{user.consultationsLimit - user.consultationsUsed} remaining</span>
                    <span>Resets monthly</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
