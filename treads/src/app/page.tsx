"use client";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Suspense } from "react";

function NeonHologram() {
  return (
    <mesh>
      <torusKnotGeometry args={[1.1, 0.35, 128, 16]} />
      <meshStandardMaterial color="#38e8ff" emissive="#9a66ff" emissiveIntensity={0.85} metalness={0.4} roughness={0.2} />
    </mesh>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-beige-gradient">
      <section className="relative w-full h-[60vh] neon-glow rounded-b-2xl border border-beige-200/70">
        <Canvas camera={{ position: [2.8, 2.2, 2.8], fov: 55 }}>
          <color attach="background" args={["#fffaf2"]} />
          <ambientLight intensity={1.1} />
          <directionalLight position={[3, 5, 2]} intensity={1.4} color="#ff4dff" />
          <Suspense fallback={null}>
            <NeonHologram />
          </Suspense>
          <OrbitControls enablePan={false} enableZoom={false} autoRotate autoRotateSpeed={0.6} />
        </Canvas>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-beige-100/70 to-transparent" />
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center">
          <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight" style={{ textShadow: "0 0 20px var(--neon-cyan)" }}>TREADS</h1>
          <p className="mt-3 text-sm sm:text-base text-neutral-600">Your AI-powered e-wardrobe with neon-futurist vibes</p>
        </div>
      </section>
      <main className="mx-auto max-w-5xl px-6 py-12 grid gap-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <a className="rounded-xl border p-5 bg-white hover:shadow-md transition" href="#wardrobe">E-Wardrobe</a>
          <a className="rounded-xl border p-5 bg-white hover:shadow-md transition" href="#style">AI Styling</a>
          <a className="rounded-xl border p-5 bg-white hover:shadow-md transition" href="#ar">AR Try-On</a>
        </div>
      </main>
    </div>
  );
}
