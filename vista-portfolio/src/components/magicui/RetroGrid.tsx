import { useEffect, useRef, useState } from 'react';
import { cn } from '../../utils/helpers';
import { useReducedMotion } from './useMagic';

/**
 * Animated perspective grid — the classic synthwave floor.
 * Scoped to a single window (Roid Rager) so it does not fight the Aero shell.
 */
export function RetroGrid({
  className,
  cellSize = 44,
  perspective = 420,
  speed = 2.2,
  fade = true,
}: {
  className?: string;
  cellSize?: number;
  perspective?: number;
  speed?: number;
  fade?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    if (reduced) return;
    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const delta = (now - last) / 1000;
      last = now;
      setOffset((o) => (o + delta * speed * 40) % cellSize);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [cellSize, speed, reduced]);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}
      style={{ perspective: `${perspective}px` }}
    >
      <div
        className="absolute inset-x-[-60%] bottom-[-30%] h-[130%] origin-bottom"
        style={{
          transform: 'rotateX(72deg)',
          backgroundImage: `
            linear-gradient(to right, rgba(0,180,180,0.35) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0,180,215,0.35) 1px, transparent 1px)
          `,
          backgroundSize: `${cellSize}px ${cellSize}px`,
          backgroundPosition: `0px ${offset}px`,
          maskImage: 'linear-gradient(to bottom, transparent 0%, black 55%, black 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 55%, black 100%)',
        }}
      />

      {/* Horizon glow */}
      <div
        className="absolute inset-x-0 top-1/2 h-px"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(0,180,215,0.6), transparent)',
          boxShadow: '0 0 24px 6px rgba(0,150,200,0.25)',
        }}
      />

      {fade && (
        <div className="absolute inset-0 bg-gradient-to-b from-[#0b1420]/70 via-transparent to-[#0b1420]/95" />
      )}
    </div>
  );
}
