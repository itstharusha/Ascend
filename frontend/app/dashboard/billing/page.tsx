"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useUserStore } from "@/lib/stores/user-store"
import { Check, Loader2, Sparkles, X, Zap, Crown, Rocket, Building } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import type { SubscriptionPlan } from "@/types/consultation"
import { useBillingStore } from "@/lib/stores/billing-store"

const planIcons = {
  free: Zap,
  starter: Crown,
  pro: Rocket,
  enterprise: Building,
}

export default function BillingPage() {
  const { user, upgradePlan, isLoading } = useUserStore()
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null)
  const { plansData, fetchPlans, isLoading: plansLoading, error: plansError } = useBillingStore()

  useEffect(() => {
    if (!plansData) fetchPlans()
  }, [plansData, fetchPlans])

  const currentPlan = user?.subscription || "free"
  const currentPlanInfo = useMemo(() => plansData?.plans.find((p) => p.id === currentPlan), [plansData, currentPlan])

  const handleUpgrade = async (plan: SubscriptionPlan) => {
    if (plan === currentPlan) return
    setSelectedPlan(plan)
    try {
      await upgradePlan(plan)
      const planName = plansData?.plans.find((p) => p.id === plan)?.name || plan
      toast.success(`Successfully upgraded to ${planName} plan!`)
    } catch (error) {
      toast.error("Failed to upgrade plan")
    } finally {
      setSelectedPlan(null)
    }
  }

  if (plansLoading || !currentPlanInfo) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Billing & Plans</h1>
          <p className="text-muted-foreground mt-1">Manage your subscription</p>
        </div>
        <Card className="glass-card">
          <CardContent className="py-16 flex flex-col items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading plans…</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (plansError) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Billing & Plans</h1>
          <p className="text-muted-foreground mt-1">Manage your subscription</p>
        </div>
        <Card className="glass-card">
          <CardContent className="py-12 text-center space-y-4">
            <p className="text-sm text-destructive">{plansError}</p>
            <Button variant="outline" className="bg-transparent" onClick={fetchPlans}>
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Billing & Plans</h1>
        <p className="text-muted-foreground mt-1">Manage your subscription</p>
      </div>

      {/* Current Plan */}
      <Card className="glass-card border-primary/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-xl gradient-primary flex items-center justify-center">
                <Sparkles className="h-7 w-7 text-primary-foreground" />
              </div>
              <div>
                <CardTitle className="text-xl">Current Plan: {currentPlanInfo.name}</CardTitle>
                <CardDescription>
                  ${currentPlanInfo.price_monthly_usd}/month •{" "}
                  {currentPlanInfo.consultations_per_month === -1
                    ? "Unlimited consultations"
                    : `${currentPlanInfo.consultations_per_month} consultations/month`}
                </CardDescription>
              </div>
            </div>
            {currentPlan !== "enterprise" && (
              <Badge variant="outline" className="bg-primary/10 text-primary">
                {currentPlan === "free" ? "Free tier" : "Active"}
              </Badge>
            )}
          </div>
        </CardHeader>
        {user && currentPlanInfo.consultations_per_month > 0 && (
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Consultations used this month</span>
                <span className="font-medium">
                  {user.consultationsUsed} / {user.consultationsLimit}
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full gradient-primary rounded-full transition-all duration-500"
                  style={{ width: `${(user.consultationsUsed / user.consultationsLimit) * 100}%` }}
                />
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Plans Comparison */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Available Plans</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {(plansData.plans as unknown as Array<(typeof plansData.plans)[number]>).map((plan) => {
            const planId = plan.id as SubscriptionPlan
            const Icon = planIcons[planId]
            const isCurrentPlan = currentPlan === planId
            const isUpgrade = plan.price_monthly_usd > currentPlanInfo.price_monthly_usd
            const isDowngrade = plan.price_monthly_usd < currentPlanInfo.price_monthly_usd

            return (
              <Card
                key={planId}
                className={cn(
                  "relative transition-all",
                  isCurrentPlan ? "border-primary ring-2 ring-primary/20" : "glass-card hover:border-primary/50",
                  planId === "pro" && !isCurrentPlan && "md:-mt-4 md:mb-4",
                )}
              >
                {plan.badge && !isCurrentPlan && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 gradient-primary text-primary-foreground">
                    {plan.badge}
                  </Badge>
                )}
                {isCurrentPlan && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-500 text-white">
                    Current Plan
                  </Badge>
                )}
                <CardHeader className="text-center pb-2">
                  <div
                    className={cn(
                      "mx-auto h-12 w-12 rounded-xl flex items-center justify-center mb-2",
                      isCurrentPlan ? "gradient-primary" : "bg-primary/10",
                    )}
                  >
                    <Icon className={cn("h-6 w-6", isCurrentPlan ? "text-primary-foreground" : "text-primary")} />
                  </div>
                  <CardTitle>{plan.name}</CardTitle>
                  <div className="mt-2">
                    <span className="text-3xl font-bold">${plan.price_monthly_usd}</span>
                    <span className="text-muted-foreground">/mo</span>
                  </div>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-sm text-muted-foreground mb-4">
                    {plan.consultations_per_month === -1
                      ? "Unlimited consultations"
                      : `${plan.consultations_per_month} consultations/month`}
                  </p>
                  <ul className="space-y-2 text-sm text-left">
                    {plan.features.slice(0, 4).map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                    {plan.features.length > 4 && (
                      <li className="text-xs text-muted-foreground">+{plan.features.length - 4} more features</li>
                    )}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button
                    className={cn(
                      "w-full",
                      isCurrentPlan
                        ? "bg-muted text-muted-foreground cursor-default"
                        : isUpgrade
                          ? "gradient-primary text-primary-foreground"
                          : "bg-transparent",
                    )}
                    variant={isDowngrade ? "outline" : "default"}
                    disabled={isCurrentPlan || isLoading}
                    onClick={() => handleUpgrade(planId)}
                  >
                    {selectedPlan === planId && isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : isCurrentPlan ? (
                      "Current Plan"
                    ) : isUpgrade ? (
                      "Upgrade"
                    ) : (
                      "Downgrade"
                    )}
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Feature Comparison Table */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Feature Comparison</CardTitle>
          <CardDescription>Compare all features across plans</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px]">Feature</TableHead>
                  <TableHead className="text-center">Free</TableHead>
                  <TableHead className="text-center">Starter</TableHead>
                  <TableHead className="text-center">Pro</TableHead>
                  <TableHead className="text-center">Enterprise</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plansData.feature_matrix.map((row) => (
                  <TableRow key={row.key}>
                    <TableCell className="font-medium">{row.label}</TableCell>
                    {(["free", "starter", "pro", "enterprise"] as const).map((pid) => {
                      if (row.key === "consultations_per_month") {
                        const p = plansData.plans.find((x) => x.id === pid)!
                        return (
                          <TableCell key={pid} className="text-center">
                            {p.consultations_per_month === -1 ? "Unlimited" : p.consultations_per_month}
                          </TableCell>
                        )
                      }
                      if (row.key === "max_refinements") {
                        const p = plansData.plans.find((x) => x.id === pid)!
                        return (
                          <TableCell key={pid} className="text-center">
                            {p.max_refinements === -1 ? "Unlimited" : p.max_refinements}
                          </TableCell>
                        )
                      }
                      const enabled = plansData.feature_matrix_values[pid][row.key as keyof typeof plansData.feature_matrix_values["free"]]
                      return (
                        <TableCell key={pid} className="text-center">
                          {enabled ? (
                            <Check className="h-4 w-4 text-primary mx-auto" />
                          ) : (
                            <X className="h-4 w-4 text-muted-foreground mx-auto" />
                          )}
                        </TableCell>
                      )
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
