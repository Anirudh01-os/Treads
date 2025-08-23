import { NextRequest, NextResponse } from 'next/server'
import fs from 'node:fs'
import path from 'node:path'

export const runtime = 'nodejs'

function ensureUploadsDir() {
	const dir = path.join(process.cwd(), 'public', 'uploads')
	if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
	return dir
}

export async function POST(req: NextRequest) {
	const { searchParams } = new URL(req.url)
	const kind = searchParams.get('kind') || 'clothes'
	const data = await req.formData()
	const file = data.get('file') as File | null
	if (!file) return NextResponse.json({ error: 'Missing file' }, { status: 400 })

	const arrayBuffer = await file.arrayBuffer()
	const buffer = Buffer.from(arrayBuffer)
	const ext = (file.name.split('.').pop() || 'png').toLowerCase()
	const ts = Date.now()
	const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
	const filename = `${ts}.${kind}.${safeName}`
	const dir = ensureUploadsDir()
	const filepath = path.join(dir, filename)
	fs.writeFileSync(filepath, buffer)

	return NextResponse.json({
		ok: true,
		file: {
			name: filename,
			path: `/uploads/${filename}`,
			size: buffer.length,
			kind,
			ext,
		},
	})
}