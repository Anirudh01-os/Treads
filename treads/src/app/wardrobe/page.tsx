"use client"
import * as React from 'react'
import { api } from '@/lib/api'
import type { ClothingItem } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/lib/store'

export default function WardrobePage() {
  const userId = useAppStore((s) => s.userId)
  const [items, setItems] = React.useState<ClothingItem[]>([])
  const [uploading, setUploading] = React.useState(false)

  const refresh = React.useCallback(async () => {
    const res = await api.listClothing()
    setItems(res.items)
  }, [])

  React.useEffect(() => {
    refresh().catch(console.error)
  }, [refresh])

  async function onUploadChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.[0]) return
    setUploading(true)
    try {
      await api.uploadClothing(e.target.files[0])
      await refresh()
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  async function addToWardrobe(id: string) {
    if (!userId) {
      alert('No user. Create a profile first.')
      return
    }
    await api.addToWardrobe(userId, id)
    alert('Added to wardrobe')
  }

  return (
    <main className="mx-auto max-w-5xl p-6 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">E‑Wardrobe</h1>
        <label className="inline-flex items-center gap-2 cursor-pointer">
          <input type="file" accept="image/*" className="hidden" onChange={onUploadChange} />
          <Button disabled={uploading}>{uploading ? 'Uploading…' : 'Upload Clothing'}</Button>
        </label>
      </header>
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((it) => (
          <article key={it.file_id} className="border rounded-lg p-3 flex flex-col gap-3">
            <div className="text-sm text-gray-600">#{it.file_id.slice(0, 8)}</div>
            <div className="flex-1 text-sm">
              <div>Processed: {String(it.has_processed)}</div>
              <div>Uploaded: {new Date(it.created_at).toLocaleString()}</div>
            </div>
            <Button onClick={() => addToWardrobe(it.file_id)}>Add to wardrobe</Button>
          </article>
        ))}
        {items.length === 0 && <p className="text-gray-600">No items yet. Upload to begin.</p>}
      </section>
    </main>
  )
}
