"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useConsultationStore } from "@/lib/stores/consultation-store"
import type { NewConsultationFormData, BusinessType, BusinessStage, ConsultationPlan } from "@/types/consultation"
import { BusinessInfoStep } from "@/components/consultation/business-info-step"
import { FinancialStep } from "@/components/consultation/financial-step"
import { ArrowLeft, ArrowRight, Check, Loader2, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { fetchBusinessStages, fetchIndustries, fetchSuggestedGoals } from "@/lib/api/meta"
import type { BusinessStageOption } from "@/lib/api/meta"
import { useUserStore } from "@/lib/stores/user-store"

const steps = [
  { id: 1, name: "Business Info", description: "Tell us about your business" },
  { id: 2, name: "Financials", description: "Share your financial snapshot" },
]

function subscriptionToConsultationPlan(subscription?: string): ConsultationPlan {
  // Auto-pick the consultation depth from the user's subscription.
  // No plan-selection step in the UI.
  switch ((subscription || "free").toLowerCase()) {
    case "enterprise":
      return "ultra"
    case "pro":
      return "premium"
    case "starter":
    case "free":
    default:
      return "basic"
  }
}

const initialFormData: NewConsultationFormData = {
  businessName: "",
  businessType: "",
  businessStage: "startup",
  location: "",
  teamSize: 0,
  industry: "",
  monthlyRevenue: 0,
  monthlyExpenses: 0,
  mainGoal: "",
  otherGoals: [],
  targetRevenue: 0,
  plan: "basic",
}

export default function NewConsultationPage() {
  const router = useRouter()
  const { createConsultation, isLoading } = useConsultationStore()
  const { user } = useUserStore()
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<NewConsultationFormData>(initialFormData)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [metaLoading, setMetaLoading] = useState(true)
  const [metaError, setMetaError] = useState<string | null>(null)
  const [industries, setIndustries] = useState<string[]>([])
  const [businessStages, setBusinessStages] = useState<BusinessStageOption[]>([])
  const [suggestedGoals, setSuggestedGoals] = useState<string[]>([])

  useEffect(() => {
    // Keep consultation plan synced to subscription and never ask user to pick it.
    setFormData((prev) => ({ ...prev, plan: subscriptionToConsultationPlan(user?.subscription) }))
  }, [user?.subscription])

  useEffect(() => {
    let cancelled = false
    setMetaLoading(true)
    setMetaError(null)
    Promise.all([fetchIndustries(), fetchBusinessStages(), fetchSuggestedGoals()])
      .then(([inds, stages, goals]) => {
        if (cancelled) return
        setIndustries(inds)
        setBusinessStages(stages)
        setSuggestedGoals(goals)
        setMetaLoading(false)
      })
      .catch((e) => {
        if (cancelled) return
        setMetaError(e instanceof Error ? e.message : "Failed to load consultation setup data")
        setMetaLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const updateFormData = (data: Partial<NewConsultationFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }))
  }

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        // Only require business_type and business_stage (matching Streamlit requirements)
        return !!(formData.businessType && formData.businessStage)
      case 2:
        // Only require main_goal (matching Streamlit requirements)
        return !!(formData.mainGoal && formData.mainGoal.trim().length > 0)
      default:
        return false
    }
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 2))
    } else {
      toast.error("Please fill in all required fields")
    }
  }

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1))
  }

  const handleSubmit = async () => {
    if (!validateStep(2)) {
      toast.error("Please complete all steps")
      return
    }

    setIsSubmitting(true)
    try {
      const consultationId = await createConsultation({
        ...formData,
        plan: subscriptionToConsultationPlan(user?.subscription),
      })
      toast.success("Consultation created successfully!")
      router.push(`/dashboard/consultations/${consultationId}`)
    } catch (error) {
      toast.error("Failed to create consultation")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold">New Consultation</h1>
        <p className="text-muted-foreground mt-2">
          Let&apos;s gather information about your business to provide tailored strategic insights
        </p>
      </div>

      {/* Progress Steps */}
      <div className="relative">
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-muted">
          <div
            className="h-full gradient-primary transition-all duration-500"
            style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
          />
        </div>
        <div className="relative flex justify-between">
          {steps.map((step) => (
            <div key={step.id} className="flex flex-col items-center">
              <div
                className={cn(
                  "h-10 w-10 rounded-full flex items-center justify-center text-sm font-medium transition-all",
                  currentStep > step.id
                    ? "gradient-primary text-primary-foreground"
                    : currentStep === step.id
                      ? "border-2 border-primary bg-background text-primary"
                      : "border-2 border-muted bg-background text-muted-foreground",
                )}
              >
                {currentStep > step.id ? <Check className="h-5 w-5" /> : step.id}
              </div>
              <div className="mt-3 text-center">
                <p
                  className={cn(
                    "text-sm font-medium",
                    currentStep >= step.id ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {step.name}
                </p>
                <p className="text-xs text-muted-foreground hidden md:block">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Form Card */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>{steps[currentStep - 1].name}</CardTitle>
          <CardDescription>{steps[currentStep - 1].description}</CardDescription>
        </CardHeader>
        <CardContent className="min-h-[400px]">
          {metaLoading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading setup…</p>
            </div>
          ) : metaError ? (
            <div className="py-12 text-center space-y-4">
              <p className="text-sm text-destructive">{metaError}</p>
              <Button variant="outline" className="bg-transparent" onClick={() => window.location.reload()}>
                Retry
              </Button>
            </div>
          ) : (
            <>
              <div
                className={cn(
                  "transition-opacity duration-300",
                  currentStep === 1 ? "opacity-100" : "opacity-0 hidden",
                )}
              >
                <BusinessInfoStep
                  data={{
                    businessName: formData.businessName,
                    businessType: formData.businessType,
                    businessStage: formData.businessStage,
                    location: formData.location,
                    teamSize: formData.teamSize,
                    industry: formData.industry,
                  }}
                  industries={industries}
                  businessStages={businessStages}
                  onChange={(data) =>
                    updateFormData({
                      businessName: data.businessName,
                      businessType: data.businessType as BusinessType,
                      businessStage: data.businessStage as BusinessStage,
                      location: data.location,
                      teamSize: data.teamSize,
                      industry: data.industry,
                    })
                  }
                />
              </div>
              <div
                className={cn(
                  "transition-opacity duration-300",
                  currentStep === 2 ? "opacity-100" : "opacity-0 hidden",
                )}
              >
                <FinancialStep
                  data={{
                    monthlyRevenue: formData.monthlyRevenue,
                    monthlyExpenses: formData.monthlyExpenses,
                    mainGoal: formData.mainGoal,
                    otherGoals: formData.otherGoals,
                    targetRevenue: formData.targetRevenue,
                  }}
                  suggestedGoals={suggestedGoals}
                  onChange={(data) => updateFormData(data)}
                />
              </div>
              <div
                className={cn(
                  "transition-opacity duration-300",
                  "opacity-0 hidden",
                )}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={handleBack} disabled={currentStep === 1} className="bg-transparent">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        {currentStep < 2 ? (
          <Button onClick={handleNext} className="gradient-primary text-primary-foreground">
            Next
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || isLoading || metaLoading || !!metaError}
            className="gradient-primary text-primary-foreground"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Start Consultation
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  )
}
