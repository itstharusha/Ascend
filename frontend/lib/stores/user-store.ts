import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { User, SubscriptionPlan } from "@/types/consultation"
import { fetchUser as apiFetchUser, updateUser as apiUpdateUser, upgradePlan as apiUpgradePlan } from "@/lib/api/user"
import { login as apiLogin, signup as apiSignup, logout as apiLogout } from "@/lib/api/auth"
import { ApiClientError } from "@/lib/api/client"
import { toast } from "sonner"

interface UserStore {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  error: string | null

  // Actions
  login: (email: string, password: string) => Promise<boolean>
  signup: (email: string, password: string, name?: string) => Promise<boolean>
  logout: () => void
  fetchUser: () => Promise<void>
  updateUser: (data: Partial<User>) => Promise<void>
  upgradePlan: (plan: SubscriptionPlan) => Promise<void>
  clearError: () => void
}

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null })
        try {
          await apiLogin(email, password)
          const user = await apiFetchUser()
          set({ user, isAuthenticated: true, isLoading: false })
          return true
        } catch (error) {
          const errorMessage =
            error instanceof ApiClientError
              ? error.detail
              : error instanceof Error
                ? error.message
                : "Login failed"
          set({ error: errorMessage, isAuthenticated: false, user: null, isLoading: false })
          return false
        }
      },

      signup: async (email: string, password: string, name?: string) => {
        set({ isLoading: true, error: null })
        try {
          await apiSignup(email, password, name)
          await apiLogin(email, password)
          const user = await apiFetchUser()
          set({ user, isAuthenticated: true, isLoading: false })
          return true
        } catch (error) {
          const errorMessage =
            error instanceof ApiClientError
              ? error.detail
              : error instanceof Error
                ? error.message
                : "Signup failed"
          set({ error: errorMessage, isAuthenticated: false, user: null, isLoading: false })
          return false
        }
      },

      logout: () => {
        // Fire and forget server logout; still clear local state.
        apiLogout().catch(() => undefined)
        set({ user: null, isAuthenticated: false, error: null })
      },

      fetchUser: async () => {
        set({ isLoading: true, error: null })
        try {
          const user = await apiFetchUser()
          set({ user, isAuthenticated: true, isLoading: false })
        } catch (error) {
          const errorMessage =
            error instanceof ApiClientError
              ? error.detail
              : error instanceof Error
                ? error.message
                : "Failed to fetch user"
          set({ user: null, isAuthenticated: false, isLoading: false, error: errorMessage })
        }
      },

      updateUser: async (data: Partial<User>) => {
        set({ isLoading: true, error: null })
        try {
          const updated = await apiUpdateUser(data)
          set({ user: updated, isLoading: false })
          toast.success("Profile updated successfully!")
        } catch (error) {
          const errorMessage =
            error instanceof ApiClientError
              ? error.detail
              : error instanceof Error
                ? error.message
                : "Failed to update profile"
          set({ error: errorMessage, isLoading: false })
          toast.error(errorMessage)
        }
      },

      upgradePlan: async (plan: SubscriptionPlan) => {
        set({ isLoading: true, error: null })
        try {
          const updated = await apiUpgradePlan(plan)
          set({ user: updated, isLoading: false })
          toast.success(`Successfully upgraded to ${plan} plan!`)
        } catch (error) {
          const errorMessage =
            error instanceof ApiClientError
              ? error.detail
              : error instanceof Error
                ? error.message
                : "Failed to upgrade plan"
          set({ error: errorMessage, isLoading: false })
          toast.error(errorMessage)
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: "ascend-user",
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    },
  ),
)
