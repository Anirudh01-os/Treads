"use client"
import * as React from 'react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/lib/store'

export default function StylistPage() {
  const userId = useAppStore((s) => s.userId)
  const [output, setOutput] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(false)

  async function getRecs() {
    if (!userId) {
      alert('No user. Create a profile first.')
      return
    }
    setLoading(true)
    try {
      const res = await api.getRecommendations(userId)
      setOutput(res.recommendations)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="mx-auto max-w-3xl p-6 space-y-6">
      <h1 className="text-2xl font-semibold">AI Stylist</h1>
      <Button onClick={getRecs} disabled={loading}>{loading ? 'Thinking…' : 'Get recommendations'}</Button>
      {output && (
        <div className="space-y-3">
          <div>
            <h2 className="font-medium">Style tips</h2>
            <ul className="list-disc pl-6 text-sm text-gray-700">
              {(output.style_tips ?? []).map((x: string, i: number) => <li key={i}>{x}</li>)}
            </ul>
          </div>
          <div>
            <h2 className="font-medium">Suggested palette</h2>
            <div className="flex gap-2">
              {(output.color_palette ?? []).map((c: string, i: number) => (
                <span key={i} className="inline-block px-3 py-1 rounded-md border" style={{ background: c, color: '#000' }}>{c}</span>
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
