"use client"
import * as React from 'react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/lib/store'

export default function CreateProfilePage() {
  const setUserId = useAppStore((s) => s.setUserId)
  const [name, setName] = React.useState('Treads Tester')
  const [email, setEmail] = React.useState('tester@example.com')
  const [creating, setCreating] = React.useState(false)

  async function create() {
    setCreating(true)
    try {
      const res = await api.createProfile({ name, email, style_preferences: ['minimalist'] })
      localStorage.setItem('treads_user_id', res.user_id)
      setUserId(res.user_id)
      alert('Profile created! You can use Wardrobe and Stylist pages now.')
    } finally {
      setCreating(false)
    }
  }

  return (
    <main className="mx-auto max-w-lg p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Create Profile</h1>
      <input className="border rounded-md p-2 w-full" value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
      <input className="border rounded-md p-2 w-full" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
      <Button onClick={create} disabled={creating}>{creating ? 'Creating…' : 'Create profile'}</Button>
    </main>
  )
}
