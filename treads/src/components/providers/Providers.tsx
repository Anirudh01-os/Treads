"use client"
import * as React from 'react'
import { useAppStore } from '@/lib/store'

export default function Providers({ children }: { children: React.ReactNode }) {
  // Placeholder provider hook; could add QueryClientProvider, ThemeProvider, etc.
  const setUserId = useAppStore((s) => s.setUserId)
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const existing = localStorage.getItem('treads_user_id')
      if (existing) setUserId(existing)
    }
  }, [setUserId])
  return <>{children}</>
}
