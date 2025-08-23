import fs from 'node:fs'
import path from 'node:path'
import Image from 'next/image'

export default async function GalleryPage() {
	const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
	let files: string[] = []
	try {
		files = fs.readdirSync(uploadsDir)
	} catch {}
	const imageFiles = files.filter(f => /\.(png|jpg|jpeg|webp)$/i.test(f))
	return (
		<div className="space-y-4">
			<h1 className="text-2xl font-semibold">Gallery</h1>
			<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
				{imageFiles.map((file) => (
					<div key={file} className="rounded overflow-hidden border border-white/10">
						<Image src={`/uploads/${file}`} alt={file} width={400} height={400} className="w-full h-auto" />
						<div className="px-2 py-1 text-xs text-white/60 break-all">{file}</div>
					</div>
				))}
			</div>
		</div>
	)
}