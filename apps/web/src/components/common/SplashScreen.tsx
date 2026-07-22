import React, { useEffect, useState } from 'react'
import logo from '../../assets/logo.png'

const PARTICLES = [
  { x: 12, y: 20, size: 3, dur: 2.8, delay: 0.0 },
  { x: 85, y: 15, size: 2, dur: 3.2, delay: 0.4 },
  { x: 25, y: 75, size: 4, dur: 2.5, delay: 0.7 },
  { x: 70, y: 80, size: 2, dur: 3.5, delay: 0.2 },
  { x: 50, y: 10, size: 3, dur: 2.9, delay: 1.0 },
  { x: 90, y: 50, size: 2, dur: 3.1, delay: 0.5 },
  { x: 8,  y: 55, size: 3, dur: 2.7, delay: 0.9 },
  { x: 60, y: 90, size: 2, dur: 3.3, delay: 0.3 },
  { x: 35, y: 30, size: 2, dur: 3.0, delay: 1.2 },
  { x: 78, y: 35, size: 3, dur: 2.6, delay: 0.6 },
]

const LETTERS = ['D','i','a','m','e','t','r']

export default function SplashScreen({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<'in' | 'hold' | 'out'>('in')

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('hold'), 1000)
    const t2 = setTimeout(() => setPhase('out'), 3200)
    const t3 = setTimeout(() => onDone(), 3900)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [onDone])

  const exiting = phase === 'out'

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden select-none"
      style={{
        background: 'linear-gradient(155deg, #010e07 0%, #011309 45%, #021a0c 100%)',
        transition: 'opacity 0.7s cubic-bezier(0.4,0,0.2,1), transform 0.7s cubic-bezier(0.4,0,0.2,1)',
        opacity: exiting ? 0 : 1,
        transform: exiting ? 'scale(1.06)' : 'scale(1)',
        pointerEvents: exiting ? 'none' : undefined,
      }}
    >
      {/* Ambient radial glow */}
      <div className="absolute pointer-events-none" style={{
        inset: 0,
        background: 'radial-gradient(ellipse 65% 55% at 50% 50%, rgba(0,196,140,0.10) 0%, transparent 70%)',
      }} />

      {/* Floating particles */}
      {PARTICLES.map((p, i) => (
        <span key={i} className="absolute rounded-full" style={{
          left: `${p.x}%`, top: `${p.y}%`,
          width: p.size, height: p.size,
          background: i % 3 === 0 ? 'rgba(0,255,200,0.72)' : 'rgba(0,196,140,0.52)',
          boxShadow: i % 4 === 0 ? '0 0 6px 2px rgba(0,196,140,0.55)' : 'none',
          animation: `splashParticle ${p.dur}s ${p.delay}s ease-in-out infinite`,
        }} />
      ))}

      {/* Concentric ring pulses */}
      <div className="absolute" style={{ top: '50%', left: '50%' }}>
        <div className="absolute rounded-full" style={{
          width: 220, height: 220,
          border: '1.5px solid rgba(0,196,140,0.26)',
          top: '50%', left: '50%',
          animation: 'splashRingPulse 2.2s 0.3s ease-out infinite',
        }} />
        <div className="absolute rounded-full" style={{
          width: 370, height: 370,
          border: '1px solid rgba(0,196,140,0.14)',
          top: '50%', left: '50%',
          animation: 'splashRingPulse 2.2s 0.75s ease-out infinite',
        }} />
        <div className="absolute rounded-full" style={{
          width: 540, height: 540,
          border: '1px solid rgba(0,196,140,0.07)',
          top: '50%', left: '50%',
          animation: 'splashRingPulse 2.2s 1.2s ease-out infinite',
        }} />
      </div>

      {/* Logo */}
      <div className="relative z-10" style={{
        width: 112, height: 112,
        animation: 'splashLogoIn 0.8s 0.05s cubic-bezier(0.34,1.56,0.64,1) both',
      }}>
        {/* Radial halo */}
        <div className="absolute pointer-events-none" style={{
          inset: '-24px', borderRadius: '40px',
          background: 'radial-gradient(circle, rgba(0,196,140,0.35) 0%, transparent 65%)',
          filter: 'blur(18px)',
        }} />
        {/* Spinning conic border */}
        <div style={{
          position: 'absolute', inset: '-4px', borderRadius: '34px',
          background: 'conic-gradient(from 0deg, transparent 0deg, rgba(0,255,190,1) 70deg, rgba(0,196,140,0.65) 140deg, transparent 200deg)',
          animation: 'splashConicSpin 2.2s linear infinite',
          zIndex: 0,
        }} />
        {/* Dark mask */}
        <div style={{
          position: 'absolute', inset: '2px', borderRadius: '30px',
          background: '#011309', zIndex: 1,
        }} />
        {/* Logo box */}
        <div className="absolute rounded-[28px] flex items-center justify-center overflow-hidden" style={{
          inset: '0px',
          background: 'linear-gradient(140deg, rgba(0,196,140,0.18) 0%, rgba(0,20,12,0.96) 100%)',
          zIndex: 2,
          animation: 'splashLogoGlow 2s 1.0s ease-in-out infinite',
        }}>
          {/* Corner shine */}
          <div className="absolute inset-0 pointer-events-none" style={{
            borderRadius: '28px',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.10) 0%, transparent 45%)',
          }} />
          {/* Shimmer sweep */}
          <div className="absolute inset-0 pointer-events-none" style={{
            background: 'linear-gradient(108deg, transparent 15%, rgba(255,255,255,0.65) 48%, rgba(200,255,240,0.35) 52%, transparent 85%)',
            animation: 'splashShimmer 2.8s 0.65s ease-in-out infinite',
            zIndex: 3,
          }} />
          <img src={logo} alt="Diametr"
            className="w-[4.5rem] h-auto object-contain"
            style={{
              filter: 'brightness(0) invert(1) drop-shadow(0 0 10px rgba(0,196,140,0.9))',
              position: 'relative', zIndex: 5,
            }}
          />
        </div>
      </div>

      {/* Letter-by-letter title */}
      <div className="mt-9 flex items-end justify-center relative z-10" style={{ gap: '1px' }} aria-label="Diametr">
        {LETTERS.map((ch, i) => (
          <span key={i} className="font-black text-white" style={{
            fontSize: '2.7rem', lineHeight: 1, letterSpacing: '-0.02em',
            display: 'inline-block', opacity: 0,
            animation: `splashLetterIn 0.48s ${0.7 + i * 0.07}s cubic-bezier(0.34,1.56,0.64,1) forwards`,
            textShadow: i === 0 || i === 6
              ? '0 0 28px rgba(0,255,190,0.5)'
              : '0 0 20px rgba(0,196,140,0.3)',
          }}>{ch}</span>
        ))}
      </div>

      {/* Tagline */}
      <div className="mt-2 relative z-10" style={{
        animation: 'splashSubIn 0.55s 1.0s cubic-bezier(0.16,1,0.3,1) both',
      }}>
        <p className="text-[11px] font-semibold uppercase"
          style={{ color: 'rgba(0,196,140,0.72)', letterSpacing: '0.20em' }}>
          Qurilish materiallari platformasi
        </p>
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-12 z-10 rounded-full overflow-hidden" style={{
        width: '5rem', height: '2px',
        background: 'rgba(255,255,255,0.07)',
        animation: 'splashBarIn 0.4s 0.5s ease both',
      }}>
        <div className="h-full rounded-full relative overflow-hidden" style={{
          background: 'linear-gradient(90deg, rgba(0,196,140,0.5) 0%, #00C48C 60%, rgba(0,255,180,0.85) 100%)',
          animation: 'splashBarFill 1.9s 0.65s cubic-bezier(0.33,1,0.68,1) both',
        }}>
          <div className="absolute inset-y-0 w-10 pointer-events-none" style={{
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.7), transparent)',
            animation: 'splashBarShimmer 1.1s 0.85s ease-in-out infinite',
          }} />
        </div>
      </div>

      {/* Corner glows */}
      <div className="absolute bottom-0 left-0 pointer-events-none" style={{
        width: 200, height: 200,
        background: 'radial-gradient(circle at 0% 100%, rgba(0,196,140,0.09) 0%, transparent 65%)',
      }} />
      <div className="absolute top-0 right-0 pointer-events-none" style={{
        width: 260, height: 260,
        background: 'radial-gradient(circle at 100% 0%, rgba(0,196,140,0.06) 0%, transparent 65%)',
      }} />
    </div>
  )
}
