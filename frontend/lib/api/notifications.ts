/**
 * Notifications API
 */

import { apiGet, apiPost } from "./client"

export type Notification = {
  id: string
  type: string
  title: string
  body?: string
  created_at: string
  read_at?: string | null
}

export async function fetchUnreadCount(): Promise<number> {
  const res = await apiGet<{ unread: number }>("/api/notifications/unread-count")
  return res.unread
}

export async function fetchNotifications(): Promise<Notification[]> {
  const res = await apiGet<{ notifications: Notification[] }>("/api/notifications")
  return res.notifications
}

export async function markRead(notificationId: string): Promise<void> {
  await apiPost(`/api/notifications/${notificationId}/read`)
}

