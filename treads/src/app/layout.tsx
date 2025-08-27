import type { Metadata } from 'next'
import './globals.css'
import { Navbar } from '@/components/nav/Navbar'

export const metadata: Metadata = {
  title: 'TREADS – AI E‑Wardrobe',
  description: 'Futuristic AI-powered e-wardrobe with neon vibes and 3D hero.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-beige-gradient text-foreground antialiased">
        <Navbar />
        {children}
      </body>
    </html>
  )
}

