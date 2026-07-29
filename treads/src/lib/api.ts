import type {
  ClothingItem,
  ClothingUploadResponse,
  UserProfile,
  WardrobeData,
  TryonCreateResult,
} from '@/lib/types'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:8000'

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
  })
  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText)
    throw new Error(`API ${res.status} ${res.statusText}: ${msg}`)
  }
  return (await res.json()) as T
}

export const api = {
  // Clothing
  listClothing: () => http<{ items: ClothingItem[] }>(`/api/clothing/list`),

  uploadClothing: async (file: File, opts?: { removeBackground?: boolean; analyze?: boolean }) => {
    const form = new FormData()
    form.append('file', file)
    form.append('remove_background', String(opts?.removeBackground ?? true))
    form.append('analyze_clothing', String(opts?.analyze ?? true))
    return http<ClothingUploadResponse>(`/api/clothing/upload`, { method: 'POST', body: form })
  },

  // User
  createProfile: (data: { name: string; email: string; age?: number; gender?: string; height?: number; weight?: number; style_preferences?: string[] }) => {
    const form = new FormData()
    form.append('name', data.name)
    form.append('email', data.email)
    if (data.age !== undefined) form.append('age', String(data.age))
    if (data.gender) form.append('gender', data.gender)
    if (data.height !== undefined) form.append('height', String(data.height))
    if (data.weight !== undefined) form.append('weight', String(data.weight))
    if (data.style_preferences) form.append('style_preferences', JSON.stringify(data.style_preferences))
    return http<{ user_id: string; profile: UserProfile }>(`/api/user/profile`, { method: 'POST', body: form })
  },

  getProfile: (userId: string) => http<UserProfile>(`/api/user/${userId}/profile`),

  getWardrobe: (userId: string) => http<WardrobeData>(`/api/user/${userId}/wardrobe`),

  addToWardrobe: (userId: string, clothingId: string) => {
    const form = new FormData()
    form.append('clothing_id', clothingId)
    return http<{ message: string }>(`/api/user/${userId}/wardrobe/add`, { method: 'POST', body: form })
  },

  getRecommendations: (userId: string) => http<{ user_id: string; recommendations: any }>(`/api/user/${userId}/recommendations`),

  // Try-on
  createTryon: (data: { body_model_id: string; clothing_ids: string[]; pose_type?: string; lighting?: string }) => {
    const form = new FormData()
    form.append('body_model_id', data.body_model_id)
    data.clothing_ids.forEach((id) => form.append('clothing_ids', id))
    form.append('pose_type', data.pose_type ?? 'standing')
    form.append('lighting', data.lighting ?? 'natural')
    return http<TryonCreateResult>(`/api/tryons/create`, { method: 'POST', body: form })
  },
}

export type { ClothingItem, ClothingUploadResponse, UserProfile, WardrobeData, TryonCreateResult }
