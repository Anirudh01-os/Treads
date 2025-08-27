"use client"
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { motion } from 'framer-motion'

function NeonGlow() {
  return (
    <mesh>
      <sphereGeometry args={[1, 32, 32]} />
      <meshBasicMaterial color="#00e5ff" />
    </mesh>
  )
}

export default function HomePage() {
  return (
    <main className="relative min-h-[80vh] grid grid-cols-1 lg:grid-cols-2 gap-8 p-6 lg:p-12">
      <section className="flex flex-col justify-center">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-5xl lg:text-7xl font-semibold tracking-tight"
        >
          TREADS
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="mt-4 text-lg text-gray-600"
        >
          Your AI-powered e-wardrobe. Neon-futuristic, climate‑aware, and AR‑ready.
        </motion.p>
      </section>
      <section className="rounded-2xl overflow-hidden shadow-neon">
        <Canvas camera={{ position: [0, 0, 3] }}>
          <ambientLight intensity={0.6} />
          <pointLight position={[2, 2, 2]} color={'#9d4edd'} intensity={1.5} />
          <NeonGlow />
          <OrbitControls enablePan={false} />
        </Canvas>
      </section>
    </main>
  )
}

