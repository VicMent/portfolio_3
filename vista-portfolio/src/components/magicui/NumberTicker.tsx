import { useEffect, useRef, useState } from 'react';
import { useInView, useReducedMotion } from './useMagic';

interface NumberTickerProps {
  value: number;
  decimals?: number;
  delay?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  /** Format the final value, e.g. (n) => `${n}` */
  format?: (value: number) => string;
  /** Seconds to wait after the element comes into view. */
  delaySeconds?: number;
}

/**
 * Counts up to `value` when it scrolls into view.
 * Honours prefers-reduced-motion by rendering the final number immediately.
 */
export function NumberTicker({
  value,
  decimals = 0,
  delay = 0,
  prefix = '',
  suffix = '',
  className,
  format,
}: NumberTickerProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const reduced = useReducedMotion();
  const [display, setDisplay] = useState(() => (reduced ? value : 0));

  useEffect(() => {
    if (!inView) return;
    if (reduced) {
      setDisplay(value);
      return;
    }

    let frame = 0;
    let start: number | null = null;
    const duration = 1100;
    const ease = (t: number) => 1 - Math.pow(1 - t, 3);

    const step = (now: number) => {
      if (start === null) start = now;
      const elapsed = now - start - delay;
      if (elapsed < 0) {
        frame = requestAnimationFrame(step);
        return;
      }
      const t = Math.min(elapsed / duration, 1);
      setDisplay(value * ease(t));
      if (t < 1) frame = requestAnimationFrame(step);
    };

    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [inView, value, delay, reduced]);

  const shown = decimals > 0 ? display.toFixed(decimals) : Math.round(display).toLocaleString();

  return (
    <span ref={ref} className={className}>
      {prefix}
      {format ? format(Number(shown)) : shown}
      {suffix}
    </span>
  );
}
