/**
 * Centralized API client for FastAPI backend
 * Handles base URL, error handling, and request formatting
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export interface ApiError {
  detail: string
  status?: number
}

export class ApiClientError extends Error {
  status: number
  detail: string

  constructor(message: string, status: number, detail?: string) {
    super(message)
    this.name = "ApiClientError"
    this.status = status
    this.detail = detail || message
  }
}

/**
 * Base fetch wrapper with error handling
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`
  
  const defaultHeaders: HeadersInit = {
    "Content-Type": "application/json",
  }

  const config: RequestInit = {
    ...options,
    // Cookie-based auth (FastAPI session cookie)
    credentials: "include",
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  }

  try {
    const response = await fetch(url, config)

    if (!response.ok) {
      let errorDetail = `HTTP ${response.status}: ${response.statusText}`
      try {
        const errorData = await response.json()
        errorDetail = errorData.detail || errorData.message || errorDetail
      } catch {
        // If response is not JSON, use status text
      }
      throw new ApiClientError(errorDetail, response.status, errorDetail)
    }

    // Handle empty responses
    const contentType = response.headers.get("content-type")
    if (contentType && contentType.includes("application/json")) {
      return await response.json()
    }
    
    // Return empty object for 204 No Content or other non-JSON responses
    return {} as T
  } catch (error) {
    if (error instanceof ApiClientError) {
      throw error
    }
    // Network errors or other issues
    throw new ApiClientError(
      error instanceof Error ? error.message : "Network error",
      0,
      "Failed to connect to the API. Please ensure the backend is running."
    )
  }
}

/**
 * GET request helper
 */
export async function apiGet<T>(endpoint: string): Promise<T> {
  return apiRequest<T>(endpoint, { method: "GET" })
}

/**
 * POST request helper
 */
export async function apiPost<T>(endpoint: string, data?: unknown): Promise<T> {
  return apiRequest<T>(endpoint, {
    method: "POST",
    body: data ? JSON.stringify(data) : undefined,
  })
}

/**
 * PUT request helper
 */
export async function apiPut<T>(endpoint: string, data?: unknown): Promise<T> {
  return apiRequest<T>(endpoint, {
    method: "PUT",
    body: data ? JSON.stringify(data) : undefined,
  })
}

/**
 * DELETE request helper
 */
export async function apiDelete<T>(endpoint: string): Promise<T> {
  return apiRequest<T>(endpoint, { method: "DELETE" })
}

/**
 * PATCH request helper
 */
export async function apiPatch<T>(endpoint: string, data?: unknown): Promise<T> {
  return apiRequest<T>(endpoint, {
    method: "PATCH",
    body: data ? JSON.stringify(data) : undefined,
  })
}

export { API_BASE_URL }
