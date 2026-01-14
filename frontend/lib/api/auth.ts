/**
 * Auth API endpoints (cookie-based sessions)
 */

import { apiPost } from "./client"

export async function signup(email: string, password: string, name?: string): Promise<void> {
  await apiPost("/api/auth/signup", { email, password, name })
}

export async function login(email: string, password: string): Promise<void> {
  await apiPost("/api/auth/login", { email, password })
}

export async function logout(): Promise<void> {
  await apiPost("/api/auth/logout")
}

