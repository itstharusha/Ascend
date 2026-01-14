export type BusinessStage = "idea" | "startup" | "growth" | "established" | "enterprise"
export type BusinessType = "saas" | "ecommerce" | "service" | "marketplace" | "other"
export type ConsultationStatus = "processing" | "completed" | "failed"
export type ConsultationPlan = "basic" | "premium" | "ultra"
export type SubscriptionPlan = "free" | "starter" | "pro" | "enterprise"

export interface BusinessInfo {
  name: string
  type: BusinessType
  stage: BusinessStage
  location: string
  teamSize: number
  industry: string
}

export interface FinancialSnapshot {
  monthlyRevenue: number
  monthlyExpenses: number
  mainGoal: string
  otherGoals: string[]
  targetRevenue?: number
}

export interface ConsultationFeedback {
  rating: 1 | 2 | 3 | 4 | 5
  comment: string
  createdAt: Date
}

export interface Consultation {
  id: string
  userId: string
  createdAt: Date
  updatedAt: Date
  business: BusinessInfo
  financial: FinancialSnapshot
  goal: string
  status: ConsultationStatus
  plan: ConsultationPlan
  refinedStrategy: string
  visualizationData?: VisualizationData
  refinementCount: number
  processingTime?: number
  modelUsed?: string
  feedback?: ConsultationFeedback
}

export interface VisualizationData {
  revenueProjection: { month: string; projected: number; current: number }[]
  cashflowData: { month: string; inflow: number; outflow: number; net: number }[]
  breakEvenTimeline: { month: string; cumulative: number; breakEvenPoint: number }[]
  marketAnalysis?: { segment: string; value: number }[]
}

export interface User {
  id: string
  email: string
  name: string
  image?: string
  subscription: SubscriptionPlan
  consultationsUsed: number
  consultationsLimit: number
  trialEndsAt?: Date
  timezone?: string
  notificationPreferences?: {
    emailNotifications: boolean
    marketingEmails: boolean
    consultationUpdates: boolean
    weeklyDigest: boolean
  }
  createdAt: Date
}

export interface NewConsultationFormData {
  // Step 1: Business Info
  businessName: string
  businessType: BusinessType
  businessStage: BusinessStage
  location: string
  teamSize: number
  industry: string
  // Step 2: Financial Snapshot
  monthlyRevenue: number
  monthlyExpenses: number
  mainGoal: string
  otherGoals: string[]
  targetRevenue: number
  // Step 3: Plan Selection
  plan: ConsultationPlan
}
