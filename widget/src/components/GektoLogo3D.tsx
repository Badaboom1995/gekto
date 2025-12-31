import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import type { Group } from 'three'

interface PixelProps {
  pos: [number, number, number]
  size: number
}

const Pixel = ({ pos, size }: PixelProps) => (
  <mesh position={pos}>
    <boxGeometry args={[size, size, size * 0.2]} />
    <meshStandardMaterial color="black" />
  </mesh>
)

interface PixelEyeProps {
  position: [number, number, number]
  rotation: [number, number, number]
  scale?: number
}

const PixelEye = ({ position, rotation, scale = 1 }: PixelEyeProps) => {
  const size = 0.12 * scale
  return (
    <group position={position} rotation={rotation}>
      <Pixel pos={[0, 0, 0]} size={size} />
      <Pixel pos={[0, size, 0]} size={size} />
      <Pixel pos={[0, -size, 0]} size={size} />
      <Pixel pos={[size, 0, 0]} size={size} />
      <Pixel pos={[-size, 0, 0]} size={size} />
    </group>
  )
}

interface PyramidProps {
  rotationSpeed?: number
}

const Pyramid = ({ rotationSpeed = 0.5 }: PyramidProps) => {
  const groupRef = useRef<Group>(null)

  useFrame((_, delta) => {
    if (groupRef.current && rotationSpeed > 0) {
      groupRef.current.rotation.y += delta * rotationSpeed
    }
  })

  return (
    <group rotation={[0, 0, -Math.PI / 4]}>
      <group ref={groupRef} rotation={[0, 0, 0]}>
        <mesh position={[0, 0, 0]} rotation={[0, Math.PI / 4, 0]}>
          <coneGeometry args={[0.8, 1.6, 4]} />
          <meshStandardMaterial
            color="#A8F15A"
            flatShading={true}
            roughness={0.3}
          />
        </mesh>
        {/* Left eye - on left face */}
        <PixelEye
          position={[-0.25, 0.1, 0.25]}
          rotation={[-0.9, -Math.PI / 4, 0]}
          scale={0.5}
        />
        {/* Right eye - on right face */}
        <PixelEye
          position={[0.25, 0.1, 0.25]}
          rotation={[-0.9, Math.PI / 4, 0]}
          scale={0.5}
        />
      </group>
    </group>
  )
}

interface GektoLogo3DProps {
  size?: number
  rotationSpeed?: number
  className?: string
}

export function GektoLogo3D({ size = 100, rotationSpeed = 0.5, className = '' }: GektoLogo3DProps) {
  return (
    <div className={className} style={{ width: size, height: size }}>
      <Canvas camera={{ position: [0, 0, 3], fov: 50 }} style={{ pointerEvents: 'none' }}>
        <ambientLight intensity={1} />
        <pointLight position={[10, 10, 10]} intensity={10} />
        <directionalLight position={[-1, 5, 5]} intensity={1.8} />
        <Pyramid rotationSpeed={rotationSpeed} />
      </Canvas>
    </div>
  )
}
