export type ClothingItem = {
  file_id: string
  has_original: boolean
  has_processed: boolean
  created_at: string
}

export type ClothingUploadResponse = {
  file_id: string
  original_filename: string
  original_path: string
  processed_path?: string
  background_removed?: boolean
  analysis?: unknown
  upload_time: string
}

export type UserProfile = {
  user_id: string
  name: string
  email: string
  age?: number | null
  gender?: string | null
  height?: number | null
  weight?: number | null
  style_preferences: string[]
  created_at: string
  updated_at: string
}

export type WardrobeData = {
  wardrobe: Array<{
    clothing_id: string
    added_at: string
    wear_count: number
    favorite: boolean
  }>
  total_items: number
  updated_at?: string
}

export type BodyModelInfo = {
  model_id: string
  body_type?: string
  estimated_height?: number | null
  created_at: string
  modified_at: string
  file_size: number
}

export type TryonCreateResult = {
  session_id: string
  tryon_result: unknown
  fit_analysis: unknown
  recommendations: unknown
}
