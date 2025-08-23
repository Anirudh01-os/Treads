# Try-On App

Virtual try-on prototype with background removal, clothing attributes detection, and a Three.js viewer.

## Stack
- Next.js 14 (App Router) + TypeScript
- TailwindCSS
- Three.js via @react-three/fiber and drei
- Optional: Replicate API for background removal and body reconstruction

## Setup

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Environment
Create `.env.local` with:

```
REPLICATE_API_TOKEN=your_token_here
```

This enables:
- `/api/bg-remove` to actually remove backgrounds
- `/api/body-recon` to run PIFuHD-like 3D reconstruction

Without the token, both routes will return passthrough placeholders.

## Folders
- `src/app` — App routes
- `src/app/api` — API routes
- `public/uploads` — Uploaded files (gitignored)

## API
- `POST /api/upload?kind=clothes|body` — store an uploaded image
- `POST /api/bg-remove` — form-data `file` → returns `result` path if removed
- `POST /api/attributes` — JSON `{ path, name? }` → clothing metadata
- `POST /api/body-recon` — form-data `file` → returns `mesh` path (if available)

## Roadmap
- Clothes segmentation to mesh/simulation
- Real-time garment fitting on avatar
- AR mode via WebXR (quick toggle)
- Accessories & makeup (phase 2)