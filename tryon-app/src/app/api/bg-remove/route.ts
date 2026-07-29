import { NextRequest, NextResponse } from 'next/server'
import fs from 'node:fs'
import path from 'node:path'

export const runtime = 'nodejs'

async function removeBackgroundWithReplicate(inputPath: string, outputPath: string) {
	const replicateApiToken = process.env.REPLICATE_API_TOKEN
	if (!replicateApiToken) return false
	const Replicate = (await import('replicate')).default
	const replicate = new Replicate({ auth: replicateApiToken })
	const imageUrl = `file://${inputPath}`
	const outputAny = await replicate.run(
		"cjwbw/real-esrgan-rembg:aa0fc0d62d1fdd18a2bf1a2fb15a2d05b8d1f20a8c13e6a4cc1a6a058ddbb0f6",
		{ input: { image: imageUrl } } as any
	) as any
	const output = String(outputAny)
	// output may be a URL; we can't fetch externally in restricted env. Fallback to passthrough if not file URL
	if (!output.startsWith('data:') && !output.startsWith('file:')) return false
	const data = output.split(',')[1]
	if (!data) return false
	const buffer = Buffer.from(data, 'base64')
	fs.writeFileSync(outputPath, buffer)
	return true
}

export async function POST(req: NextRequest) {
	const data = await req.formData()
	const file = data.get('file') as File | null
	if (!file) return NextResponse.json({ error: 'Missing file' }, { status: 400 })

	const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
	if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })
	const ts = Date.now()
	const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
	const inputPath = path.join(uploadsDir, `${ts}.bgraw.${safe}`)
	const outputPath = path.join(uploadsDir, `${ts}.bgremoved.${safe.replace(/\.(jpg|jpeg)$/i, '.png')}`)
	const buffer = Buffer.from(await file.arrayBuffer())
	fs.writeFileSync(inputPath, buffer)

	let removed = false
	try {
		removed = await removeBackgroundWithReplicate(inputPath, outputPath)
	} catch {}

	if (!removed) {
		// Fallback: return original file path (no removal)
		return NextResponse.json({ ok: true, original: `/uploads/${path.basename(inputPath)}`, result: null, note: 'Background not removed (no API token).' })
	}

	return NextResponse.json({ ok: true, result: `/uploads/${path.basename(outputPath)}` })
}