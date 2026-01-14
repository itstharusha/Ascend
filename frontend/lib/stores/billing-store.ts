import { create } from "zustand"
import type { BillingPlansResponse } from "@/lib/api/billing"
import { fetchBillingPlans } from "@/lib/api/billing"
import { ApiClientError } from "@/lib/api/client"

type BillingStore = {
  plansData: BillingPlansResponse | null
  isLoading: boolean
  error: string | null
  fetchPlans: () => Promise<void>
}

export const useBillingStore = create<BillingStore>((set) => ({
  plansData: null,
  isLoading: false,
  error: null,
  fetchPlans: async () => {
    set({ isLoading: true, error: null })
    try {
      const data = await fetchBillingPlans()
      set({ plansData: data, isLoading: false })
    } catch (e) {
      const msg =
        e instanceof ApiClientError ? e.detail : e instanceof Error ? e.message : "Failed to load plans"
      set({ error: msg, isLoading: false })
    }
  },
}))

