import { create } from 'zustand'
import type { UserProfile } from '@/lib/types'

type AppState = {
  userId: string | null
  profile: UserProfile | null
  setUserId: (id: string) => void
  setProfile: (p: UserProfile) => void
}

export const useAppStore = create<AppState>((set) => ({
  userId: null,
  profile: null,
  setUserId: (id) => set({ userId: id }),
  setProfile: (p) => set({ profile: p }),
}))
