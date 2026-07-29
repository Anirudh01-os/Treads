"use client"

import { Canvas, useLoader, useThree } from '@react-three/fiber'
import { OrbitControls, useTexture } from '@react-three/drei'
import { useEffect, useMemo, useState } from 'react'
import * as THREE from 'three'

function ClothesPlane({ imageUrl }: { imageUrl: string }) {
	const texture = useTexture(imageUrl)
	texture.colorSpace = THREE.SRGBColorSpace
	const aspect = texture.image ? texture.image.width / texture.image.height : 1
	const width = 1.0
	const height = width / aspect
	return (
		<mesh position={[0, 1.1, 0]}>
			<planeGeometry args={[width, height]} />
			<meshBasicMaterial map={texture} transparent />
		</mesh>
	)
}

function BodyAvatar() {
	return (
		<mesh position={[0, 1, 0]}>
			<boxGeometry args={[0.6, 1.8, 0.3]} />
			<meshStandardMaterial color="#7c83ff" />
		</mesh>
	)
}

function Scene({ clothesImage }: { clothesImage?: string | null }) {
	return (
		<>
			<ambientLight intensity={0.6} />
			<directionalLight position={[5, 5, 5]} intensity={1} />
			<BodyAvatar />
			{clothesImage ? <ClothesPlane imageUrl={clothesImage} /> : null}
			<gridHelper args={[10, 10, '#333', '#222']} position={[0, 0, 0]} />
		</>
	)
}

export default function TryOnPage() {
	const [clothesImage, setClothesImage] = useState<string | null>(null)
	useEffect(() => {
		setClothesImage(localStorage.getItem('tryon:lastClothesImage'))
	}, [])

	return (
		<div className="space-y-4">
			<h1 className="text-2xl font-semibold">Try-On Viewer</h1>
			<div className="rounded border border-white/10 overflow-hidden">
				<div className="h-[520px] bg-black">
					<Canvas camera={{ position: [3, 3, 3] }}>
						<color attach="background" args={[0x000000]} />
						<OrbitControls />
						<Scene clothesImage={clothesImage} />
					</Canvas>
				</div>
			</div>
		</div>
	)
}