export default function Page() {
	return (
		<div className="space-y-6">
			<h1 className="text-3xl font-semibold">Virtual Try-On</h1>
			<p className="text-white/70 max-w-2xl">
				Upload your clothes and a body photo to generate a 3D avatar and try
				outfits in real time. Backgrounds are removed automatically and clothes are
				analyzed for type, color, and material.
			</p>
			<div className="flex gap-3">
				<a className="px-4 py-2 rounded bg-white/10 hover:bg-white/20" href="/upload">Get Started</a>
				<a className="px-4 py-2 rounded border border-white/20 hover:bg-white/10" href="/try-on">Open Viewer</a>
			</div>
		</div>
	)
}