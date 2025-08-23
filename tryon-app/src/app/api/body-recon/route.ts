import { NextRequest, NextResponse } from 'next/server'
import fs from 'node:fs'
import path from 'node:path'

export const runtime = 'nodejs'

async function reconstructWithReplicate(inputPath: string, outputPath: string) {
	const replicateApiToken = process.env.REPLICATE_API_TOKEN
	if (!replicateApiToken) return false
	const Replicate = (await import('replicate')).default
	const replicate = new Replicate({ auth: replicateApiToken })
	const imageUrl = `file://${inputPath}`
	const outputAny = await replicate.run(
		"zxhyt/pifuhd:8df03b9f5d5e32415b9b6c3d3225cb8c526457f1b1c6b4f804cbb3f663ec3b1d",
		{ input: { image: imageUrl } } as any
	) as any
	const output = String(outputAny)
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
	const inputPath = path.join(uploadsDir, `${ts}.bodyraw.${safe}`)
	const outputPath = path.join(uploadsDir, `${ts}.bodymesh.${safe.replace(/\.(png|jpg|jpeg|webp)$/i, '.obj')}`)
	fs.writeFileSync(inputPath, Buffer.from(await file.arrayBuffer()))

	let ok = false
	try {
		ok = await reconstructWithReplicate(inputPath, outputPath)
	} catch {}

	if (!ok) {
		return NextResponse.json({ ok: true, mesh: null, note: '3D reconstruction not performed (no API token).' })
	}

	return NextResponse.json({ ok: true, mesh: `/uploads/${path.basename(outputPath)}` })
}