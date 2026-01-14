/**
 * Billing / plan catalog API
 */

import { apiGet } from "./client"

export type BillingPlanId = "free" | "starter" | "pro" | "enterprise"

export type BillingPlan = {
  id: BillingPlanId
  name: string
  price_monthly_usd: number
  consultations_per_month: number
  max_refinements: number
  features: string[]
  badge?: string
}

export type BillingPlansResponse = {
  plans: BillingPlan[]
  feature_matrix: { key: string; label: string }[]
  feature_matrix_values: Record<
    BillingPlanId,
    {
      advanced_visualizations: boolean
      priority_processing: boolean
      export_pdf: boolean
      custom_reports: boolean
      api_access: boolean
    }
  >
}

export async function fetchBillingPlans(): Promise<BillingPlansResponse> {
  return apiGet<BillingPlansResponse>("/api/billing/plans")
}

