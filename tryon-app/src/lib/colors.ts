import sharp from 'sharp'

function rgbToHex(r: number, g: number, b: number) {
	return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')
}

export async function extractDominantColorsFromImage(imagePath: string) {
	const image = sharp(imagePath)
	// Downscale for speed and get raw pixels
	const { data, info } = await image
		.resize(64, 64, { fit: 'inside' })
		.raw()
		.toBuffer({ resolveWithObject: true })

	const counts = new Map<string, number>()
	for (let i = 0; i < data.length; i += info.channels) {
		const r = data[i]
		const g = data[i + 1]
		const b = data[i + 2]
		// Quantize to reduce unique colors
		const qr = Math.round(r / 16) * 16
		const qg = Math.round(g / 16) * 16
		const qb = Math.round(b / 16) * 16
		const hex = rgbToHex(qr, qg, qb)
		counts.set(hex, (counts.get(hex) || 0) + 1)
	}
	const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6)
	return sorted.map(([hex, population], idx) => ({ name: `c${idx + 1}`, hex, population }))
}