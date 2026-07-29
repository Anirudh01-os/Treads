import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
	title: 'Try-On App',
	description: 'Virtual try-on with background removal and 3D preview',
}

export default function RootLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return (
		<html lang="en">
			<body>
				<header className="border-b border-white/10">
					<div className="container py-4 flex items-center justify-between">
						<a href="/" className="font-semibold">Try-On</a>
						<nav className="flex gap-4 text-sm">
							<a href="/upload" className="hover:underline">Upload</a>
							<a href="/gallery" className="hover:underline">Gallery</a>
							<a href="/try-on" className="hover:underline">Try-On</a>
						</nav>
					</div>
				</header>
				<main className="container py-6">{children}</main>
			</body>
		</html>
	)
}