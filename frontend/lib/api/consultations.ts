/**
 * Consultation API endpoints
 * Maps frontend types to backend API calls
 */

import { apiGet, apiPost, apiPatch, ApiClientError } from "./client"
import type {
  Consultation,
  NewConsultationFormData,
  ConsultationFeedback,
  ConsultationStatus,
} from "@/types/consultation"

// Backend response types (may differ from frontend types)

interface BackendConsultationCreateRequest {
  business_name?: string | null
  business_type: string
  business_stage: string
  industry?: string | null
  location?: string | null
  team_size?: number | null
  monthly_revenue_usd?: number | null
  monthly_expenses_usd?: number | null
  main_goal: string
  other_goals: string[]
  target_revenue_usd?: number | null
  plan: string
}

interface BackendConsultationResponse {
  id: string
  status: ConsultationStatus
  created_at: string
  updated_at?: string
  business: {
    business_type: string
    business_stage: string
    location: string | null
    team_size: number | null
    monthly_revenue: number | null
    monthly_expenses: number | null
    main_goal: string
    other_goals: string[]
  }
  plan_used: string
  refined_strategy: string
  visualization_code?: string
  refinement_count: number
  business_name?: string | null
  industry?: string | null
  target_revenue_usd?: number | null
  visualization_data?: {
    revenue_projection?: Array<{ month: string; projected: number; current: number }>
    cashflow_data?: Array<{ month: string; inflow: number; outflow: number; net: number }>
    break_even_timeline?: Array<{ month: string; cumulative: number; break_even_point: number }>
    market_analysis?: Array<{ segment: string; value: number }>
  }
  processing_time?: number
  model_used?: string
  feedback?: {
    rating: number
    comment: string
    created_at: string
  }
}

interface BackendFeedbackRequest {
  rating: number
  comment: string
}

/**
 * Transform backend response to frontend Consultation type
 */
function transformBackendConsultation(backend: BackendConsultationResponse): Consultation {
  // Transform visualization data if present
  let visualizationData = undefined
  if (backend.visualization_data) {
    visualizationData = {
      revenueProjection: backend.visualization_data.revenue_projection || [],
      cashflowData: backend.visualization_data.cashflow_data || [],
      breakEvenTimeline: backend.visualization_data.break_even_timeline || [],
      marketAnalysis: backend.visualization_data.market_analysis,
    }
  }

  // Normalize business_type to match frontend union type
  const normalizeBusinessType = (type: string): Consultation["business"]["type"] => {
    const normalized = type.toLowerCase().trim()
    if (["saas", "ecommerce", "service", "marketplace", "other"].includes(normalized)) {
      return normalized as Consultation["business"]["type"]
    }
    // Map common variations
    if (normalized.includes("saas") || normalized.includes("software")) return "saas"
    if (normalized.includes("ecommerce") || normalized.includes("e-commerce") || normalized.includes("retail")) return "ecommerce"
    if (normalized.includes("service") || normalized.includes("consulting")) return "service"
    if (normalized.includes("marketplace") || normalized.includes("platform")) return "marketplace"
    return "other"
  }

  // Normalize business_stage to match frontend union type
  const normalizeBusinessStage = (stage: string): Consultation["business"]["stage"] => {
    const normalized = stage.toLowerCase().trim()
    if (["idea", "startup", "growth", "established", "enterprise"].includes(normalized)) {
      return normalized as Consultation["business"]["stage"]
    }
    // Map "mature" to "established" for compatibility
    if (normalized === "mature") return "established"
    // Default to startup if unknown
    return "startup"
  }

  // Normalize plan to match frontend union type
  const normalizePlan = (plan: string): Consultation["plan"] => {
    const normalized = plan.toLowerCase().trim()
    if (["basic", "premium", "ultra"].includes(normalized)) {
      return normalized as Consultation["plan"]
    }
    return "basic"
  }

  return {
    id: backend.id,
    userId: "user-001", // TODO: Get from auth context when implemented
    createdAt: new Date(backend.created_at),
    updatedAt: new Date(backend.updated_at || backend.created_at),
    business: {
      name: backend.business_name || "Unnamed Business",
      type: normalizeBusinessType(backend.business.business_type),
      stage: normalizeBusinessStage(backend.business.business_stage),
      location: backend.business.location || "",
      teamSize: backend.business.team_size || 0,
      industry: backend.industry || "",
    },
    financial: {
      monthlyRevenue: backend.business.monthly_revenue || 0,
      monthlyExpenses: backend.business.monthly_expenses || 0,
      mainGoal: backend.business.main_goal,
      otherGoals: backend.business.other_goals || [],
      targetRevenue: backend.target_revenue_usd || undefined,
    },
    goal: backend.business.main_goal,
    status: backend.status,
    plan: normalizePlan(backend.plan_used),
    refinedStrategy: backend.refined_strategy || "",
    visualizationData,
    refinementCount: backend.refinement_count || 0,
    processingTime: backend.processing_time,
    modelUsed: backend.model_used,
    feedback: backend.feedback
      ? {
          rating: backend.feedback.rating as 1 | 2 | 3 | 4 | 5,
          comment: backend.feedback.comment,
          createdAt: new Date(backend.feedback.created_at),
        }
      : undefined,
  }
}

/**
 * Transform frontend form data to backend request format
 */
function transformToBackendRequest(data: NewConsultationFormData): BackendConsultationCreateRequest {
  return {
    business_name: data.businessName?.trim() || null,
    business_type: data.businessType,
    business_stage: data.businessStage,
    industry: data.industry?.trim() || null,
    location: data.location?.trim() || null,
    // Send null for 0 values to match Streamlit behavior (0 means "not provided")
    team_size: data.teamSize && data.teamSize > 0 ? data.teamSize : null,
    monthly_revenue_usd: data.monthlyRevenue && data.monthlyRevenue > 0 ? data.monthlyRevenue : null,
    monthly_expenses_usd: data.monthlyExpenses && data.monthlyExpenses > 0 ? data.monthlyExpenses : null,
    main_goal: data.mainGoal.trim(),
    other_goals: data.otherGoals || [],
    target_revenue_usd: data.targetRevenue && data.targetRevenue > 0 ? data.targetRevenue : null,
    plan: data.plan,
  }
}

/**
 * Fetch all consultations
 */
export async function fetchConsultations(): Promise<Consultation[]> {
  try {
    const response = await apiGet<BackendConsultationResponse[] | { consultations: BackendConsultationResponse[] }>(
      "/api/consultations"
    )
    
    // Handle both array and object responses
    const consultations = Array.isArray(response) 
      ? response 
      : "consultations" in response 
        ? response.consultations 
        : []
    
    return consultations.map(transformBackendConsultation)
  } catch (error) {
    if (error instanceof ApiClientError && error.status === 404) {
      // Endpoint might not exist yet, return empty array
      return []
    }
    throw error
  }
}

/**
 * Fetch a single consultation by ID
 */
export async function fetchConsultationById(id: string): Promise<Consultation | null> {
  try {
    const response = await apiGet<BackendConsultationResponse>(`/api/consultations/${id}`)
    return transformBackendConsultation(response)
  } catch (error) {
    if (error instanceof ApiClientError && error.status === 404) {
      return null
    }
    throw error
  }
}

/**
 * Create a new consultation
 */
export async function createConsultation(data: NewConsultationFormData): Promise<Consultation> {
  const requestData = transformToBackendRequest(data)
  const response = await apiPost<BackendConsultationResponse>("/api/consultations", requestData)
  return transformBackendConsultation(response)
}

/**
 * Submit feedback for a consultation
 */
export async function submitFeedback(
  consultationId: string,
  rating: 1 | 2 | 3 | 4 | 5,
  comment: string
): Promise<void> {
  const requestData: BackendFeedbackRequest = {
    rating,
    comment,
  }
  await apiPost(`/api/consultations/${consultationId}/feedback`, requestData)
}

/**
 * Update a consultation (for future use)
 */
export async function updateConsultation(
  id: string,
  data: Partial<Consultation>
): Promise<Consultation> {
  // Map frontend Consultation to backend format
  const updateData: {
    business_name?: string | null
    industry?: string | null
    target_revenue_usd?: number | null
  } = {}
  
  if (data.business?.name !== undefined) {
    updateData.business_name = data.business.name || null
  }
  if (data.business?.industry !== undefined) {
    updateData.industry = data.business.industry || null
  }
  if (data.financial?.targetRevenue !== undefined) {
    updateData.target_revenue_usd = data.financial.targetRevenue || null
  }
  
  const response = await apiPatch<BackendConsultationResponse>(`/api/consultations/${id}`, updateData)
  return transformBackendConsultation(response)
}

/**
 * Delete a consultation
 */
export async function deleteConsultation(id: string): Promise<void> {
  await apiDelete(`/api/consultations/${id}`)
}
