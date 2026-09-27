import { useEffect, useRef } from 'react';
import { cn } from '../../utils/helpers';

interface BorderBeamProps {
  className?: string;
  size?: number;
  duration?: number;
  delay?: number;
  colorFrom?: string;
  colorTo?: string;
  reverse?: boolean;
}

export function BorderBeam({
  className,
  size = 50,
  duration = 6,
  delay = 0,
  colorFrom = '#0078d7',
  colorTo = '#00b4b4',
  reverse = false,
}: BorderBeamProps) {
  const beamRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const beam = beamRef.current;
    if (!beam) return;
    beam.style.animation = `borderBeam ${duration}s linear ${delay}s infinite ${reverse ? 'reverse' : ''}`;
  }, [duration, delay, reverse]);

  return (
    <div
      ref={beamRef}
      className={cn(
        'absolute inset-0 pointer-events-none overflow-hidden',
        className
      )}
      style={{
        '--beam-size': `${size}px`,
        '--beam-color-from': colorFrom,
        '--beam-color-to': colorTo,
      } as React.CSSProperties}
    >
      <div
        className="absolute"
        style={{
          width: '200%',
          height: '200%',
          top: '-50%',
          left: '-50%',
          background: `conic-gradient(from 0deg, ${colorFrom}, ${colorTo}, ${colorFrom})`,
          mask: `radial-gradient(circle at center, transparent calc(${size}px - 2px), black calc(${size}px - 2px), black ${size}px, transparent ${size}px)`,
          WebkitMask: `radial-gradient(circle at center, transparent calc(${size}px - 2px), black calc(${size}px - 2px), black ${size}px, transparent ${size}px)`,
          animation: 'borderBeamRotate 4s linear infinite',
        } as React.CSSProperties}
      />
      <style>{`
        @keyframes borderBeamRotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export function BorderBeamSimple({
  className,
  size = 4,
  duration = 3,
  colorFrom = '#0078d7',
  colorTo = '#00b4b4',
}: BorderBeamProps) {
  return (
    <div
      className={cn(
        'absolute inset-0 pointer-events-none',
        className
      )}
    >
      <style>{`
        .beam {
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background: linear-gradient(90deg, ${colorFrom}, ${colorTo}, ${colorFrom});
          background-size: 200% 100%;
          animation: beamMove ${duration}s linear infinite;
          opacity: 0.6;
        }
        @keyframes beamMove {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
      <div className="beam" style={{ borderRadius: 'inherit' }} />
    </div>
  );
}