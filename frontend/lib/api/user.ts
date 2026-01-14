/**
 * User API endpoints
 */

import { apiGet, apiPut, apiPost, ApiClientError } from "./client"
import type { User, SubscriptionPlan } from "@/types/consultation"

interface BackendUserResponse {
  id: string
  email: string
  name: string
  image?: string | null
  subscription: SubscriptionPlan
  consultations_used: number
  consultations_limit: number
  created_at?: string
  timezone?: string
  notification_preferences?: {
    email_notifications: boolean
    marketing_emails: boolean
    consultation_updates: boolean
    weekly_digest: boolean
  }
}

interface NotificationPreferences {
  email_notifications: boolean
  marketing_emails: boolean
  consultation_updates: boolean
  weekly_digest: boolean
}

function transformBackendUser(backend: BackendUserResponse): User {
  return {
    id: backend.id,
    email: backend.email,
    name: backend.name,
    image: backend.image || undefined,
    subscription: backend.subscription,
    consultationsUsed: backend.consultations_used,
    consultationsLimit: backend.consultations_limit,
    timezone: backend.timezone,
    notificationPreferences: backend.notification_preferences
      ? {
          emailNotifications: backend.notification_preferences.email_notifications,
          marketingEmails: backend.notification_preferences.marketing_emails,
          consultationUpdates: backend.notification_preferences.consultation_updates,
          weeklyDigest: backend.notification_preferences.weekly_digest,
        }
      : undefined,
    createdAt: backend.created_at ? new Date(backend.created_at) : new Date(),
  }
}

/**
 * Fetch current user
 */
export async function fetchUser(): Promise<User> {
  const response = await apiGet<BackendUserResponse>("/api/user")
  return transformBackendUser(response)
}

/**
 * Update user profile
 */
export async function updateUser(data: { name?: string; email?: string }): Promise<User> {
  const response = await apiPut<BackendUserResponse>("/api/user", data)
  return transformBackendUser(response)
}

/**
 * Update notification preferences
 */
export async function updateNotificationPreferences(prefs: NotificationPreferences): Promise<void> {
  await apiPut("/api/user/notifications", prefs)
}

/**
 * Change password
 */
export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  await apiPut("/api/user/password", {
    current_password: currentPassword,
    new_password: newPassword,
  })
}

/**
 * Upgrade subscription plan
 */
export async function upgradePlan(plan: SubscriptionPlan): Promise<User> {
  const response = await apiPost<{ user: BackendUserResponse }>("/api/billing/upgrade", { plan })
  return transformBackendUser(response.user)
}
