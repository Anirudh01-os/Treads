import { NextRequest, NextResponse } from 'next/server'
import path from 'node:path'
import { extractDominantColorsFromImage } from '@/lib/colors'

export const runtime = 'nodejs'

function guessTypeFromFilename(filename: string) {
	const lower = filename.toLowerCase()
	if (/(shirt|tee|t-shirt)/.test(lower)) return 'top-shirt'
	if (/(hoodie|sweatshirt)/.test(lower)) return 'top-hoodie'
	if (/(jean|pant|trouser)/.test(lower)) return 'bottom-pants'
	if (/(skirt)/.test(lower)) return 'bottom-skirt'
	if (/(dress)/.test(lower)) return 'onepiece-dress'
	if (/(shoe|sneaker|boot)/.test(lower)) return 'shoes'
	return 'unknown'
}

function guessMaterialFromColors(hexes: string[]) {
	// Very rough heuristic
	if (hexes.some(h => /^#f{3,6}$/i.test(h))) return 'cotton-like'
	if (hexes.some(h => /^#000000$/i.test(h))) return 'denim/synthetic'
	return 'synthetic/mixed'
}

export async function POST(req: NextRequest) {
	const body = await req.json().catch(() => null) as { path?: string, name?: string } | null
	if (!body?.path) return NextResponse.json({ error: 'Missing path' }, { status: 400 })
	const filename = body.name || path.basename(body.path)
	const abs = path.join(process.cwd(), 'public', body.path.replace(/^\//, ''))
	const colors = await extractDominantColorsFromImage(abs).catch(() => [])
	const colorHexes = colors.slice(0, 5).map(c => c.hex)
	const type = guessTypeFromFilename(filename)
	const material = guessMaterialFromColors(colorHexes)
	return NextResponse.json({ type, colors, material })
}