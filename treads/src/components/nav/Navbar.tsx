"use client"
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 backdrop-blur bg-white/70 border-b">
      <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
        <Link href="/" className="font-semibold tracking-tight">TREADS</Link>
        <nav className="flex items-center gap-2">
          <Button variant="ghost" asChild>
            <Link href="/wardrobe">Wardrobe</Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/stylist">Stylist</Link>
          </Button>
          <Button variant="neon">Sign in</Button>
        </nav>
      </div>
    </header>
  )
}

