import { useEffect, useRef, useState } from 'react';
import { cn } from '../../utils/helpers';
import { useInView, useReducedMotion } from './useMagic';

/**
 * Headline that resolves word by word from blurred to sharp.
 * The final text stays in the DOM, so it remains readable to assistive tech
 * and to search engines even before the animation runs.
 */
export function BlurText({
  text,
  className,
  delay = 0,
  stagger = 0.07,
  duration = 700,
  as: Tag = 'span',
}: {
  text: string;
  className?: string;
  delay?: number;
  stagger?: number;
  duration?: number;
  as?: 'span' | 'h1' | 'h2' | 'h3' | 'p';
}) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-30px' });
  const reduced = useReducedMotion();
  const words = text.split(' ');
  const [shown, setShown] = useState<number[]>(reduced ? words.map((_, i) => i) : []);

  useEffect(() => {
    if (reduced) {
      setShown(words.map((_, i) => i));
      return;
    }
    if (!inView) return;

    const timers = words.map((_, i) =>
      window.setTimeout(
        () => setShown((prev) => (prev.includes(i) ? prev : [...prev, i])),
        delay + i * stagger * 1000
      )
    );
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, delay, stagger, reduced, text]);

  return (
    <Tag ref={ref as never} className={cn('inline', className)}>
      {words.map((word, i) => {
        const isShown = shown.includes(i);
        return (
          <span
            key={`${word}-${i}`}
            className="inline-block"
            style={{
              filter: isShown ? 'blur(0px)' : 'blur(9px)',
              opacity: isShown ? 1 : 0,
              transition: reduced
                ? 'none'
                : `filter ${duration}ms ease-out, opacity ${duration}ms ease-out`,
              marginRight: i < words.length - 1 ? '0.28em' : undefined,
              willChange: 'filter, opacity',
            }}
          >
            {word}
          </span>
        );
      })}
    </Tag>
  );
}
