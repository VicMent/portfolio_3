import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { cn } from '../../utils/helpers';
import { useInView, useReducedMotion } from './useMagic';

export interface BeamNode {
  id: string;
  label: string;
  sublabel?: string;
  icon?: React.ReactNode;
}

/**
 * An animated light travelling along a curved path between stacked nodes.
 * Purely decorative — the content is a normal ordered list underneath it.
 */
export function AnimatedBeam({
  nodes,
  className,
  duration = 9,
}: {
  nodes: BeamNode[];
  className?: string;
  duration?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const inView = useInView(containerRef, { once: true, margin: '-80px' });
  const reduced = useReducedMotion();
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => setHeight(el.offsetHeight);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [nodes.length]);

  // A gentle S-curve down the left edge of the node stack.
  const path = useMemo(() => {
    const w = 2;
    return `M ${w} 0 C ${w} ${height * 0.22}, 14 ${height * 0.34}, 14 ${height * 0.5} S ${w} ${height * 0.7}, ${w} ${height}`;
  }, [height]);

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Static rail */}
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute top-0 left-0 h-full w-7 overflow-visible"
        viewBox={`0 0 20 ${Math.max(height, 1)}`}
        preserveAspectRatio="none"
      >
        <path d={path} fill="none" stroke="var(--surface-border)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
      </svg>

      {/* Travelling pulse */}
      {inView && !reduced && height > 0 && (
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute top-0 left-0 h-full w-7 overflow-visible"
          viewBox={`0 0 20 ${height}`}
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="beam-fade" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--aero-blue-light)" stopOpacity="0" />
              <stop offset="50%" stopColor="#7ee7e7" stopOpacity="1" />
              <stop offset="100%" stopColor="var(--aero-teal)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d={path}
            fill="none"
            stroke="url(#beam-fade)"
            strokeWidth="2.5"
            vectorEffect="non-scaling-stroke"
            style={{
              strokeDasharray: '14 190',
              animation: `beam-travel ${duration}s linear infinite`,
              filter: 'drop-shadow(0 0 4px var(--aero-glow))',
            }}
          />
          <style>{`@keyframes beam-travel { from { stroke-dashoffset: 204; } to { stroke-dashoffset: 0; } }`}</style>
        </svg>
      )}

      <ol className="relative space-y-3 pl-9">
        {nodes.map((node, i) => (
          <li
            key={node.id}
            className="group relative"
            style={
              inView && !reduced
                ? {
                    animation: `beam-node-in 600ms cubic-bezier(0.22,1,0.36,1) ${i * 110}ms both`,
                  }
                : undefined
            }
          >
            <span
              aria-hidden="true"
              className="absolute top-1/2 -left-[26px] h-2.5 w-2.5 -translate-y-1/2 rounded-full border-2 border-[var(--aero-blue)] bg-[#0b1420] transition-transform duration-200 group-hover:scale-125"
            />
            <div className="aero-surface rounded-xl px-4 py-3 transition-colors group-hover:border-[var(--aero-blue)]/60">
              <div className="flex items-center gap-2.5">
                {node.icon && (
                  <span aria-hidden="true" className="text-lg leading-none">
                    {node.icon}
                  </span>
                )}
                <div className="min-w-0">
                  <p className="text-[13.5px] font-semibold text-[var(--text-primary)]">{node.label}</p>
                  {node.sublabel && (
                    <p className="text-[11.5px] text-[var(--text-muted)]">{node.sublabel}</p>
                  )}
                </div>
              </div>
            </div>
          </li>
        ))}
      </ol>

      <style>{`@keyframes beam-node-in { from { opacity: 0; transform: translateX(-12px); } to { opacity: 1; transform: none; } }`}</style>
    </div>
  );
}
