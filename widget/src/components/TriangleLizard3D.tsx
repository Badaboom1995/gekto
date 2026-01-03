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
  color?: string
}

const Pixel = ({ pos, size, color = "black" }: PixelProps) => (
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

// --- 2. The Triangle Lizard Head Geometry ---

interface TriangleLizardHeadProps {
  followMouse?: boolean
  isSpinning?: boolean
  skinColor?: string
  detailColor?: string
  eyeColor?: string
  faceRight?: boolean
}

const TriangleLizardHead = ({
  followMouse = true,
  isSpinning = false,
  skinColor = "#A8F15A",
  detailColor = "#96D651",
  eyeColor = "black",
  faceRight = false
}: TriangleLizardHeadProps) => {
  const groupRef = useRef<Group>(null)

  useFrame((_, delta) => {
    if (groupRef.current) {
      if (isSpinning) {
        // Spin around the Z axis (nose axis) like a drill
        groupRef.current.rotation.z += delta * 8
      } else if (followMouse) {
        const targetY = mouseX * 0.4
        const targetX = mouseY * 0.4

        groupRef.current.rotation.y += (targetY - groupRef.current.rotation.y) * 0.1
        groupRef.current.rotation.x += (targetX - groupRef.current.rotation.x) * 0.1
        // Reset Z rotation when not spinning
        groupRef.current.rotation.z += (0 - groupRef.current.rotation.z) * 0.1
      } else {
        // Not spinning, not following mouse - look directly at user (neutral position)
        groupRef.current.rotation.x += (0 - groupRef.current.rotation.x) * 0.1
        groupRef.current.rotation.y += (0 - groupRef.current.rotation.y) * 0.1
        groupRef.current.rotation.z += (0 - groupRef.current.rotation.z) * 0.1
      }
    }
  })

  // When spinning: face left and slightly up
  // When not following mouse: face straight at user
  // Normal: use faceRight prop
  const facingUser = !followMouse && !isSpinning
  const yRotation = isSpinning ? -1.2 : facingUser ? 0 : (faceRight ? 1 : -1)
  const xRotation = isSpinning ? -0.5 : facingUser ? 0 : -0.3
  const zRotation = isSpinning ? -Math.PI / 8 : facingUser ? 0 : (faceRight ? Math.PI / 8 : -Math.PI / 8)

  return (
    <group rotation={[xRotation, yRotation, zRotation]}>
      <group ref={groupRef}>
        {/* MAIN HEAD: Cone/Pyramid shape for triangular look */}
        <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.7, 1.4, 4]} />
          <meshStandardMaterial
            color={skinColor}
            flatShading={true}
            roughness={0.4}
          />
        </mesh>

        {/* EYE BULGES: Smaller, more angular */}
        <mesh position={[-0.35, 0.15, -0.3]}>
          <boxGeometry args={[0.25, 0.25, 0.25]} />
          <meshStandardMaterial color={detailColor} flatShading={true} />
        </mesh>
        <mesh position={[0.35, 0.15, -0.3]}>
          <boxGeometry args={[0.25, 0.25, 0.25]} />
          <meshStandardMaterial color={detailColor} flatShading={true} />
        </mesh>

        {/* EYES */}
        <Eye
          position={[-0.48, 0.15, -0.3]}
          rotation={[0, -Math.PI / 2 - 0.2, 0]}
          scale={1}
          color={eyeColor}
        />
        <Eye
          position={[0.48, 0.15, -0.3]}
          rotation={[0, Math.PI / 2 + 0.2, 0]}
          scale={1}
          color={eyeColor}
        />

        {/* NOSTRILS */}
        <mesh position={[-0.06, 0.05, 0.65]}>
          <boxGeometry args={[0.03, 0.03, 0.02]} />
          <meshStandardMaterial color="#2a2a2a" />
        </mesh>
        <mesh position={[0.06, 0.05, 0.65]}>
          <boxGeometry args={[0.03, 0.03, 0.02]} />
          <meshStandardMaterial color="#2a2a2a" />
        </mesh>

      </group>
    </group>
  )
}

// --- 3. The Wrapper Component ---

interface TriangleLizard3DProps {
  size?: number
  followMouse?: boolean
  isSpinning?: boolean
  className?: string
  skinColor?: string
  detailColor?: string
  eyeColor?: string
  faceRight?: boolean
}

export function TriangleLizard3D({
  size = 200,
  followMouse = true,
  isSpinning = false,
  className = '',
  skinColor = "#A8F15A",
  detailColor = "#96D651",
  eyeColor = "black",
  faceRight = false
}: TriangleLizard3DProps) {
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth) * 4 - 1
      mouseY = (e.clientY / window.innerHeight) * 2 - 1
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <div className={className} style={{ width: size, height: size }}>
      <Canvas camera={{ position: [0, 0, 3], fov: 45 }} style={{ pointerEvents: 'none' }}>
        <ambientLight intensity={1.3} />
        <pointLight position={[3, 1, 10]} intensity={1} />
        <directionalLight position={[3, 5, 5]} intensity={1} />
        <TriangleLizardHead followMouse={followMouse} isSpinning={isSpinning} skinColor={skinColor} detailColor={detailColor} eyeColor={eyeColor} faceRight={faceRight} />
      </Canvas>
    </div>
  )
}
