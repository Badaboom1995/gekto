import { TriangleLizard3D } from './TriangleLizard3D'

interface LizardAvatarProps {
  size: number
  isShaking?: boolean
  followMouse?: boolean
}

export function LizardAvatar({ size, isShaking = false, followMouse = true }: LizardAvatarProps) {
  return (
    <div
      style={{
        animation: isShaking ? 'shake 0.5s ease-in-out' : 'none',
      }}
    >
      <style>{`
        @keyframes shake {
          0%, 100% { transform: rotate(0deg); }
          20% { transform: rotate(-15deg); }
          40% { transform: rotate(12deg); }
          60% { transform: rotate(-8deg); }
          80% { transform: rotate(5deg); }
        }
      `}</style>
      <TriangleLizard3D
        size={size}
        followMouse={followMouse && !isShaking}
        skinColor="#BFFF6B"
        detailColor="#A8F15A"
        eyeColor="black"
      />
    </div>
  )
}
