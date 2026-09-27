import {
  Children,
  cloneElement,
  isValidElement,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
} from 'react';
import { cn } from '../../utils/helpers';
import { usePrefersReducedMotion } from '../../hooks/useMediaQuery';

type Direction = 'up' | 'down' | 'left' | 'right';

const OFFSET: Record<Direction, string> = {
  up: 'translateY(18px)',
  down: 'translateY(-18px)',
  left: 'translateX(18px)',
  right: 'translateX(-18px)',
};

/** Reveals its children one by one as they scroll into view. */
export function AnimatedList({
  className,
  children,
  delay = 0,
  duration = 480,
  stagger = 90,
  direction = 'up',
}: {
  className?: string;
  children: ReactNode;
  delay?: number;
  duration?: number;
  stagger?: number;
  direction?: Direction;
}) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const items = Children.toArray(children);
  const [shown, setShown] = useState<Set<number>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (prefersReducedMotion) {
      setShown(new Set(items.map((_, i) => i)));
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const i = Number((entry.target as HTMLElement).dataset.index);
          if (!Number.isNaN(i) && entry.isIntersecting) {
            window.setTimeout(() => {
              setShown((prev) => new Set(prev).add(i));
            }, delay + i * stagger);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -8% 0px' }
    );

    const nodes = container.querySelectorAll<HTMLElement>('[data-index]');
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [items.length, delay, stagger, prefersReducedMotion]);

  return (
    <div ref={containerRef} className={cn('space-y-2', className)}>
      {items.map((child, index) => {
        if (!isValidElement(child)) return child;
        const isShown = shown.has(index);
        const style: CSSProperties = {
          opacity: isShown ? 1 : 0,
          transform: isShown ? 'none' : OFFSET[direction],
          transition: prefersReducedMotion
            ? 'none'
            : `opacity ${duration}ms var(--ease-vista), transform ${duration}ms var(--ease-vista)`,
          transitionDelay: `${delay + index * stagger}ms`,
        };

        const props = (child.props ?? {}) as { style?: CSSProperties };
        return cloneElement(
          child as ReactElement<{ style?: CSSProperties }>,
          {
            style: { ...props.style, ...style },
            'data-index': index,
          } as Partial<{ style?: CSSProperties }> & Record<string, unknown>
        );
      })}
    </div>
  );
}
