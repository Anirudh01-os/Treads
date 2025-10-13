"use client"
import * as React from 'react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'

export default function TryOnPage() {
  const [bodyModelId, setBodyModelId] = React.useState('demo-model')
  const [clothingIds, setClothingIds] = React.useState('')
  const [result, setResult] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(false)

  async function createSession() {
    const ids = clothingIds.split(',').map((s) => s.trim()).filter(Boolean)
    if (!ids.length) return alert('Enter clothing ids, comma-separated')
    setLoading(true)
    try {
      const res = await api.createTryon({ body_model_id: bodyModelId, clothing_ids: ids })
      setResult(res)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="mx-auto max-w-3xl p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Virtual Try‑On</h1>
      <div className="grid gap-2">
        <input className="border rounded p-2" placeholder="Body model id" value={bodyModelId} onChange={(e) => setBodyModelId(e.target.value)} />
        <input className="border rounded p-2" placeholder="clothing ids (comma-separated)" value={clothingIds} onChange={(e) => setClothingIds(e.target.value)} />
        <Button onClick={createSession} disabled={loading}>{loading ? 'Generating…' : 'Create try‑on'}</Button>
      </div>
      {result && (
        <pre className="text-xs bg-gray-50 p-3 rounded border overflow-auto">{JSON.stringify(result, null, 2)}</pre>
      )}
    </main>
  )
}
