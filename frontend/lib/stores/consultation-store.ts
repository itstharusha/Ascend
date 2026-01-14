import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { Consultation, NewConsultationFormData } from "@/types/consultation"
import {
  fetchConsultations as apiFetchConsultations,
  fetchConsultationById as apiFetchConsultationById,
  createConsultation as apiCreateConsultation,
  updateConsultation as apiUpdateConsultation,
  deleteConsultation as apiDeleteConsultation,
  submitFeedback as apiSubmitFeedback,
} from "@/lib/api/consultations"
import { ApiClientError } from "@/lib/api/client"
import { toast } from "sonner"

interface ConsultationStore {
  consultations: Consultation[]
  isLoading: boolean
  currentConsultation: Consultation | null
  error: string | null

  // Actions
  fetchConsultations: () => Promise<void>
  fetchConsultationById: (id: string) => Promise<Consultation | null>
  createConsultation: (data: NewConsultationFormData) => Promise<string>
  updateConsultation: (id: string, data: Partial<Consultation>) => Promise<void>
  deleteConsultation: (id: string) => Promise<void>
  submitFeedback: (id: string, rating: 1 | 2 | 3 | 4 | 5, comment: string) => Promise<void>
  clearError: () => void
}

export const useConsultationStore = create<ConsultationStore>()(
  persist(
    (set, get) => ({
      consultations: [],
      isLoading: false,
      currentConsultation: null,
      error: null,

      fetchConsultations: async () => {
        set({ isLoading: true, error: null })
        try {
          const consultations = await apiFetchConsultations()
          set({ consultations, isLoading: false })
        } catch (error) {
          const errorMessage =
            error instanceof ApiClientError
              ? error.detail
              : error instanceof Error
                ? error.message
                : "Failed to fetch consultations"
          set({ error: errorMessage, isLoading: false })
          console.error("Failed to fetch consultations:", error)
          // Don't show toast here - let components handle it if needed
        }
      },

      fetchConsultationById: async (id: string) => {
        set({ isLoading: true, error: null })
        try {
          const consultation = await apiFetchConsultationById(id)
          if (consultation) {
            set({ currentConsultation: consultation, isLoading: false })
            // Also update in consultations list if it exists
            set((state) => ({
              consultations: state.consultations.map((c) => (c.id === id ? consultation : c)),
            }))
          } else {
            set({ currentConsultation: null, isLoading: false })
          }
          return consultation
        } catch (error) {
          const errorMessage =
            error instanceof ApiClientError
              ? error.detail
              : error instanceof Error
                ? error.message
                : "Failed to fetch consultation"
          set({ error: errorMessage, isLoading: false, currentConsultation: null })
          console.error("Failed to fetch consultation:", error)
          return null
        }
      },

      createConsultation: async (data: NewConsultationFormData) => {
        set({ isLoading: true, error: null })
        try {
          const consultation = await apiCreateConsultation(data)
          set((state) => ({
            consultations: [consultation, ...state.consultations],
            currentConsultation: consultation,
            isLoading: false,
          }))
          return consultation.id
        } catch (error) {
          const errorMessage =
            error instanceof ApiClientError
              ? error.detail
              : error instanceof Error
                ? error.message
                : "Failed to create consultation"
          set({ error: errorMessage, isLoading: false })
          toast.error(errorMessage)
          throw error
        }
      },

      updateConsultation: async (id: string, data: Partial<Consultation>) => {
        set({ isLoading: true, error: null })
        try {
          const updated = await apiUpdateConsultation(id, data)
          set((state) => ({
            consultations: state.consultations.map((c) => (c.id === id ? updated : c)),
            currentConsultation: state.currentConsultation?.id === id ? updated : state.currentConsultation,
            isLoading: false,
          }))
        } catch (error) {
          const errorMessage =
            error instanceof ApiClientError
              ? error.detail
              : error instanceof Error
                ? error.message
                : "Failed to update consultation"
          set({ error: errorMessage, isLoading: false })
          toast.error(errorMessage)
        }
      },

      deleteConsultation: async (id: string) => {
        set({ isLoading: true, error: null })
        try {
          await apiDeleteConsultation(id)
          set((state) => ({
            consultations: state.consultations.filter((c) => c.id !== id),
            currentConsultation: state.currentConsultation?.id === id ? null : state.currentConsultation,
            isLoading: false,
          }))
          toast.success("Consultation deleted successfully")
        } catch (error) {
          const errorMessage =
            error instanceof ApiClientError
              ? error.detail
              : error instanceof Error
                ? error.message
                : "Failed to delete consultation"
          set({ error: errorMessage, isLoading: false })
          toast.error(errorMessage)
        }
      },

      submitFeedback: async (id: string, rating: 1 | 2 | 3 | 4 | 5, comment: string) => {
        set({ error: null })
        try {
          await apiSubmitFeedback(id, rating, comment)
          // Refresh the consultation to get updated feedback
          const consultation = await apiFetchConsultationById(id)
          if (consultation) {
            set((state) => ({
              consultations: state.consultations.map((c) => (c.id === id ? consultation : c)),
              currentConsultation: state.currentConsultation?.id === id ? consultation : state.currentConsultation,
            }))
          }
        } catch (error) {
          const errorMessage =
            error instanceof ApiClientError
              ? error.detail
              : error instanceof Error
                ? error.message
                : "Failed to submit feedback"
          set({ error: errorMessage })
          toast.error(errorMessage)
          throw error
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: "ascend-consultations",
      partialize: (state) => ({ consultations: state.consultations }),
    },
  ),
)
