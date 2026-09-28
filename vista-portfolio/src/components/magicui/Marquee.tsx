import { useRef, useState, type ReactNode } from 'react';
import { cn } from '../../utils/helpers';
import { useReducedMotion } from './useMagic';

/**
 * Infinite horizontal ticker with edge fades.
 * Duplicates its children and pauses on hover/focus so it stays inspectable.
 */
export function Marquee({
  children,
  className,
  reverse = false,
  speed = 38,
  pauseOnHover = true,
  fade = true,
}: {
  children: ReactNode;
  className?: string;
  reverse?: boolean;
  /** Seconds for one full pass. */
  speed?: number;
  pauseOnHover?: boolean;
  fade?: boolean;
}) {
  const reduced = useReducedMotion();
  const [paused, setPaused] = useState(false);
  const duration = reduced ? 0 : speed;

  return (
    <div
      className={cn('group relative flex w-full overflow-hidden', className)}
      onMouseEnter={() => pauseOnHover && setPaused(true)}
      onMouseLeave={() => pauseOnHover && setPaused(false)}
      onFocus={() => pauseOnHover && setPaused(true)}
      onBlur={() => pauseOnHover && setPaused(false)}
      role="marquee"
      aria-label="Technologies"
    >
      {[0, 1].map((copy) => (
        <ul
          key={copy}
          aria-hidden={copy === 1}
          className="flex shrink-0 items-center gap-6 pr-6"
          style={{
            animation: duration
              ? `marquee-scroll ${duration}s linear infinite`
              : undefined,
            animationDirection: reverse ? 'reverse' : 'normal',
            animationPlayState: paused ? 'paused' : 'running',
          }}
        >
          {children}
        </ul>
      ))}

      {fade && (
        <>
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-[var(--surface-bg)] to-transparent"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-[var(--surface-bg)] to-transparent"
          />
        </>
      )}

      <style>{`@keyframes marquee-scroll { from { transform: translateX(0); } to { transform: translateX(-100%); } }`}</style>
    </div>
  );
}
