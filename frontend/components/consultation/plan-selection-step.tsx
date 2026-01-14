"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, Zap, Crown, Rocket } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ConsultationPlan } from "@/lib/api/meta"

interface PlanSelectionStepProps {
  selectedPlan: string
  onChange: (plan: string) => void
  plans: ConsultationPlan[]
}

const planIcons: Record<ConsultationPlan["id"], typeof Zap> = {
  basic: Zap,
  premium: Crown,
  ultra: Rocket,
}

export function PlanSelectionStep({ selectedPlan, onChange, plans }: PlanSelectionStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <p className="text-muted-foreground">Choose the depth of analysis that fits your needs</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((plan) => {
          const Icon = planIcons[plan.id]
          const isSelected = selectedPlan === plan.id

          return (
            <Card
              key={plan.id}
              className={cn(
                "relative cursor-pointer transition-all hover:border-primary/50",
                isSelected ? "border-primary ring-2 ring-primary/20" : "glass-card",
                plan.popular && "md:-mt-4 md:mb-4",
              )}
              onClick={() => onChange(plan.id)}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 gradient-primary text-primary-foreground">
                  Most Popular
                </Badge>
              )}
              <CardHeader className="text-center pb-2">
                <div
                  className={cn(
                    "mx-auto h-12 w-12 rounded-xl flex items-center justify-center mb-2",
                    isSelected ? "gradient-primary" : "bg-primary/10",
                  )}
                >
                  <Icon className={cn("h-6 w-6", isSelected ? "text-primary-foreground" : "text-primary")} />
                </div>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <div className="mb-4">
                  <span className="text-3xl font-bold">${plan.price_usd}</span>
                  {plan.price_usd > 0 && <span className="text-muted-foreground">/consultation</span>}
                </div>
                <ul className="space-y-2 text-sm text-left">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {selectedPlan && (
        <div className="text-center p-4 rounded-lg bg-primary/5 border border-primary/20">
          <p className="text-sm">
            You selected the <span className="font-semibold text-primary capitalize">{selectedPlan}</span> plan
            {selectedPlan !== "basic" && (
              <span className="text-muted-foreground">
                {" "}
                - ${plans.find((p) => p.id === selectedPlan)?.price_usd} will be charged upon completion
              </span>
            )}
          </p>
        </div>
      )}
    </div>
  )
}
