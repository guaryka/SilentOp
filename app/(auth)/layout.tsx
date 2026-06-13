import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'SilentOp — Sign In',
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative flex items-center justify-center overflow-hidden"
      style={{
        minHeight: '100vh',
        backgroundColor: '#0a0a0f'
      }}
    >
      {/* Animated background orbs */}
      <div className="absolute overflow-hidden" style={{ inset: 0, pointerEvents: 'none' }}>
        <div
          className="absolute animate-pulse-glow"
          style={{
            top: '-10rem',
            left: '-10rem',
            width: '24rem',
            height: '24rem',
            borderRadius: '50%',
            opacity: 0.2,
            filter: 'blur(64px)',
            background: 'radial-gradient(circle, #7c3aed, transparent)'
          }}
        />
        <div
          className="absolute animate-pulse-glow"
          style={{
            bottom: '-10rem',
            right: '-10rem',
            width: '24rem',
            height: '24rem',
            borderRadius: '50%',
            opacity: 0.2,
            filter: 'blur(64px)',
            background: 'radial-gradient(circle, #06b6d4, transparent)',
            animationDelay: '1s'
          }}
        />
        <div
          className="absolute"
          style={{
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '38rem',
            height: '38rem',
            borderRadius: '50%',
            opacity: 0.05,
            filter: 'blur(64px)',
            background: 'radial-gradient(circle, #a855f7, transparent)'
          }}
        />
      </div>
      {/* Grid pattern */}
      <div
        className="absolute"
        style={{
          inset: 0,
          opacity: 0.03,
          backgroundImage: `linear-gradient(rgba(124, 58, 237, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(124, 58, 237, 0.5) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />
      <div className="relative flex justify-center w-full" style={{ zIndex: 10, padding: '0 1rem' }}>
        {children}
      </div>
    </div>
  )
}
