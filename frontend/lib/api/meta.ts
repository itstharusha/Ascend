/**
 * Meta/config endpoints (remove hardcoded UI datasets)
 */

import { apiGet } from "./client"

export type BusinessStageOption = { value: string; label: string }
export type TimezoneOption = { value: string; label: string }

export type ConsultationPlan = {
  id: "basic" | "premium" | "ultra"
  name: string
  price_usd: number
  description: string
  features: string[]
  popular: boolean
}

export async function fetchIndustries(): Promise<string[]> {
  const res = await apiGet<{ industries: string[] }>("/api/meta/industries")
  return res.industries
}

export async function fetchBusinessStages(): Promise<BusinessStageOption[]> {
  const res = await apiGet<{ stages: BusinessStageOption[] }>("/api/meta/business-stages")
  return res.stages
}

export async function fetchSuggestedGoals(): Promise<string[]> {
  const res = await apiGet<{ goals: string[] }>("/api/meta/suggested-goals")
  return res.goals
}

export async function fetchConsultationPlans(): Promise<ConsultationPlan[]> {
  const res = await apiGet<{ plans: ConsultationPlan[] }>("/api/meta/consultation-plans")
  return res.plans
}

export async function fetchTimezones(): Promise<TimezoneOption[]> {
  const res = await apiGet<{ timezones: TimezoneOption[] }>("/api/meta/timezones")
  return res.timezones
}

