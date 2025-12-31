import { useRef, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import type { Group } from 'three'

// Global mouse position (normalized -1 to 1)
let mouseX = 0
let mouseY = 0

// --- 1. Reusable Pixel & Eye Components ---

interface PixelProps {
  pos: [number, number, number]
  size: number
}

interface PixelPropsWithColor extends PixelProps {
  color?: string
}

const Pixel = ({ pos, size, color = "black" }: PixelPropsWithColor) => (
  <mesh position={pos}>
    <boxGeometry args={[size, size, size * 0.3]} />
    <meshStandardMaterial color={color} />
  </mesh>
)

interface EyeProps {
  position: [number, number, number]
  rotation: [number, number, number]
  scale?: number
  color?: string
}

const Eye = ({ position, rotation, scale = 1, color = "black" }: EyeProps) => {
  const size = 0.08 * scale
  return (
    <group position={position} rotation={rotation}>
      <Pixel pos={[0, 0, 0]} size={size} color={color} />
      <Pixel pos={[0, size, 0]} size={size} color={color} />
      <Pixel pos={[0, -size, 0]} size={size} color={color} />
      <Pixel pos={[size, 0, 0]} size={size} color={color} />
      <Pixel pos={[-size, 0, 0]} size={size} color={color} />
    </group>
  )
}

// --- 2. The Gecko Head Geometry ---

interface GeckoHeadProps {
  followMouse?: boolean
  skinColor?: string
  detailColor?: string
  eyeColor?: string
}

const GeckoHead = ({
  followMouse = true,
  skinColor = "#A8F15A",
  detailColor = "#96D651",
  eyeColor = "black"
}: GeckoHeadProps) => {
  const groupRef = useRef<Group>(null)

  useFrame(() => {
    if (groupRef.current && followMouse) {
      // Smoothly follow mouse with limited range
      const targetY = mouseX * 0.4
      const targetX = mouseY * 0.3

      groupRef.current.rotation.y += (targetY - groupRef.current.rotation.y) * 0.1
      groupRef.current.rotation.x += (targetX - groupRef.current.rotation.x) * 0.1
    }
  })

  return (
    // Base tilt - facing user frontally with slight curious tilt
    <group rotation={[7, 1.2, -Math.PI / 0.5]}>
      <group ref={groupRef}>

        {/* CRANIUM: Wide and flat (Geckos have triangular heads) */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[1.0, 0.45, 0.7]} />
          <meshStandardMaterial
            color={skinColor}
            flatShading={true}
            roughness={0.4}
          />
        </mesh>

        {/* SNOUT: Short and tapered */}
        <mesh position={[0, -0.05, 0.55]}>
          <boxGeometry args={[0.4, 0.15, 0.5]} />
          <meshStandardMaterial
            color={skinColor}
            flatShading={true}
            roughness={0.4}
          />
        </mesh>

        {/* EYE BULGES: Geckos have eyes that stick out laterally */}
        {/* Left Bulge */}
        <mesh position={[-0.5, 0.05, 0.1]}>
          <boxGeometry args={[0.3, 0.35, 0.4]} />
          <meshStandardMaterial color={detailColor} flatShading={true} />
        </mesh>
        {/* Right Bulge */}
        <mesh position={[0.5, 0.05, 0.1]}>
          <boxGeometry args={[0.1, 0.35, 0.4]} />
          <meshStandardMaterial color={detailColor} flatShading={true} />
        </mesh>

        {/* EYES: Placed on the bulges, rotated slightly outward */}
        <Eye
          position={[-0.66, 0.05, 0.1]}
          rotation={[0, -Math.PI / 2 - 0.3, 0]} // Angled slightly back
          scale={1.2} // Geckos have large eyes
          color={eyeColor}
        />
        <Eye
          position={[0.66, 0.05, 0.1]}
          rotation={[0, Math.PI / 2 + 0.2, 0]} // Angled slightly back
          scale={1.2}
          color={eyeColor}
        />

        {/* NOSTRILS: Small details on the snout */}
        <mesh position={[-0.1, 0.05, 0.8]}>
          <boxGeometry args={[0.04, 0.04, 0.02]} />
          <meshStandardMaterial color="#2a2a2a" />
        </mesh>
        <mesh position={[0.1, 0.05, 0.8]}>
          <boxGeometry args={[0.04, 0.04, 0.02]} />
          <meshStandardMaterial color="#2a2a2a" />
        </mesh>

        {/* NECK / BACK OF HEAD STUB */}
        <mesh position={[0, -0.05, -0.4]}>
          <boxGeometry args={[0.7, 0.3, 0.3]} />
          <meshStandardMaterial color={detailColor} flatShading={true} />
        </mesh>

      </group>
    </group>
  )
}

// --- 3. The Wrapper Component ---

interface LizardHead3DProps {
  size?: number
  followMouse?: boolean
  className?: string
  skinColor?: string
  detailColor?: string
  eyeColor?: string
}

export function LizardHead3D({
  size = 200,
  followMouse = true,
  className = '',
  skinColor = "#A8F15A",
  detailColor = "#96D651",
  eyeColor = "black"
}: LizardHead3DProps) {
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Normalize mouse position to -1 to 1
      mouseX = (e.clientX / window.innerWidth) * 2 - 1
      mouseY = (e.clientY / window.innerHeight) * 2 - 1
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <div className={className} style={{ width: size, height: size }}>
      <Canvas camera={{ position: [0, 0, -3.5], fov: 45 }} style={{ pointerEvents: 'none' }}>
        <ambientLight intensity={2} />
        <pointLight position={[3, 1, 10]} intensity={5} />
        <directionalLight position={[15, 5, 5]} intensity={1.0} />
        <GeckoHead followMouse={followMouse} skinColor={skinColor} detailColor={detailColor} eyeColor={eyeColor} />
      </Canvas>
    </div>
  )
}
