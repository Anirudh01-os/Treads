"use client"

import { useEffect, useRef, useState } from 'react'

type ClothesResult = {
	path?: string
	resultPath?: string | null
	attributes?: { type: string; material: string; colors: { name: string; hex: string; population: number }[] }
}

type BodyResult = {
	meshPath?: string | null
	note?: string
}

export default function UploadPage() {
	const clothesInputRef = useRef<HTMLInputElement | null>(null)
	const bodyInputRef = useRef<HTMLInputElement | null>(null)
	const [message, setMessage] = useState<string | null>(null)
	const [clothes, setClothes] = useState<ClothesResult | null>(null)
	const [body, setBody] = useState<BodyResult | null>(null)

	useEffect(() => {
		if (clothes?.resultPath || clothes?.path) {
			const img = clothes.resultPath ?? clothes.path!
			localStorage.setItem('tryon:lastClothesImage', img)
		}
	}, [clothes])

	useEffect(() => {
		if (body?.meshPath) {
			if (body.meshPath) localStorage.setItem('tryon:lastBodyMesh', body.meshPath)
		}
	}, [body])

	async function uploadTo(endpoint: string, file: File) {
		const form = new FormData()
		form.append('file', file)
		const res = await fetch(endpoint, { method: 'POST', body: form })
		if (!res.ok) throw new Error(await res.text())
		return res.json()
	}

	return (
		<div className="space-y-8">
			<h1 className="text-2xl font-semibold">Upload</h1>
			{message && <p className="text-sm text-white/70">{message}</p>}

			<section className="space-y-3">
				<h2 className="font-medium">Clothes</h2>
				<input ref={clothesInputRef} type="file" accept="image/*" />
				<div className="flex gap-2">
					<button
						className="px-3 py-1.5 rounded bg-white/10"
						onClick={async () => {
							const file = clothesInputRef.current?.files?.[0]
							if (!file) return
							setMessage('Uploading and processing clothes...')
							try {
								const uploaded = await uploadTo('/api/upload?kind=clothes', file)
								const bg = await uploadTo('/api/bg-remove', file)
								const imagePath: string = bg.result ?? bg.original ?? uploaded?.file?.path
								const attrRes = await fetch('/api/attributes', {
									method: 'POST',
									headers: { 'Content-Type': 'application/json' },
									body: JSON.stringify({ path: imagePath, name: uploaded?.file?.name })
								})
								const attributes = attrRes.ok ? await attrRes.json() : null
								setClothes({ path: uploaded?.file?.path, resultPath: bg.result ?? null, attributes: attributes ?? undefined })
								setMessage('Clothes ready.')
							} catch (e: any) {
								setMessage(e.message || 'Clothes upload failed')
							}
						}}
					>
						Upload & Process
					</button>
				</div>
				{clothes && (
					<div className="text-sm text-white/80 space-y-1">
						{clothes.resultPath && <div>BG-Removed: <a className="underline" href={clothes.resultPath} target="_blank">{clothes.resultPath}</a></div>}
						{clothes.path && <div>Original: <a className="underline" href={clothes.path} target="_blank">{clothes.path}</a></div>}
						{clothes.attributes && (
							<div className="space-y-1">
								<div>Type: <span className="text-white/60">{clothes.attributes.type}</span></div>
								<div>Material: <span className="text-white/60">{clothes.attributes.material}</span></div>
								<div className="flex items-center gap-2">
									<span>Colors:</span>
									{clothes.attributes.colors?.slice(0, 5).map(c => (
										<span key={c.hex} className="inline-flex items-center gap-1">
											<span className="inline-block w-3 h-3 rounded" style={{ backgroundColor: c.hex }} />
											<span className="text-white/60">{c.hex}</span>
										</span>
									))}
								</div>
							</div>
						)}
					</div>
				)}
			</section>

			<section className="space-y-3">
				<h2 className="font-medium">Body Photo</h2>
				<input ref={bodyInputRef} type="file" accept="image/*" />
				<div className="flex gap-2">
					<button
						className="px-3 py-1.5 rounded bg-white/10"
						onClick={async () => {
							const file = bodyInputRef.current?.files?.[0]
							if (!file) return
							setMessage('Uploading and reconstructing body...')
							try {
								await uploadTo('/api/upload?kind=body', file)
								const recon = await uploadTo('/api/body-recon', file)
								setBody({ meshPath: recon.mesh ?? null, note: recon.note })
								setMessage(recon.mesh ? 'Body mesh generated.' : (recon.note || 'Body uploaded.'))
							} catch (e: any) {
								setMessage(e.message || 'Body upload failed')
							}
						}}
					>
						Upload & Reconstruct
					</button>
					<a className="px-3 py-1.5 rounded border border-white/20 hover:bg-white/10" href="/try-on">Open Viewer</a>
				</div>
				{body && (
					<div className="text-sm text-white/80 space-y-1">
						{body.meshPath && <div>Mesh: <a className="underline" href={body.meshPath} target="_blank">{body.meshPath}</a></div>}
						{body.note && <div className="text-white/60">{body.note}</div>}
					</div>
				)}
			</section>
		</div>
	)
}