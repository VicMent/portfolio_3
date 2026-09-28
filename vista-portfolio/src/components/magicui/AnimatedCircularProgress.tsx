import { useEffect, useRef, useState } from 'react';
import { cn } from '../../utils/helpers';
import { useInView, useReducedMotion } from './useMagic';

/** Circular progress ring that draws itself when scrolled into view. */
export function AnimatedCircularProgress({
  value,
  size = 68,
  strokeWidth = 6,
  color = 'var(--aero-blue)',
  trackColor = 'rgba(255,255,255,0.1)',
  label,
  sublabel,
  className,
  duration = 1200,
}: {
  value: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  label?: string;
  sublabel?: string;
  className?: string;
  duration?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const reduced = useReducedMotion();
  const [progress, setProgress] = useState(reduced ? value : 0);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    if (!inView) return;
    if (reduced) {
      setProgress(value);
      return;
    }
    let frame = 0;
    let start: number | null = null;
    const ease = (t: number) => 1 - Math.pow(1 - t, 3);

    const step = (now: number) => {
      if (start === null) start = now;
      const t = Math.min((now - start) / duration, 1);
      setProgress(value * ease(t));
      if (t < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [inView, value, duration, reduced]);

  const offset = circumference * (1 - progress / 100);

  return (
    <div ref={ref} className={cn('flex flex-col items-center gap-1.5 text-center', className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={trackColor} strokeWidth={strokeWidth} />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ filter: `drop-shadow(0 0 5px ${color}66)` }}
          />
        </svg>
        <span
          className="absolute inset-0 flex items-center justify-center font-semibold tabular-nums"
          style={{ color, fontSize: size * 0.26 }}
        >
          {Math.round(progress)}
        </span>
      </div>
      {label && <span className="text-[12px] font-medium text-[var(--text-primary)]">{label}</span>}
      {sublabel && <span className="text-[10.5px] text-[var(--text-muted)]">{sublabel}</span>}
    </div>
  );
}
