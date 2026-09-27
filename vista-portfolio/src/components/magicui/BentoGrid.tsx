import { type ReactNode, useState } from 'react';
import { cn } from '../../utils/helpers';
import { ShineBorder } from './ShineBorder';
import { BorderBeam } from './BorderBeam';

type HoverEffect = 'shine' | 'beam' | 'scale' | 'none';

export function BentoCard({
  className,
  children,
  span = 1,
  hoverEffect = 'shine',
  onClick,
}: {
  className?: string;
  children: ReactNode;
  span?: number;
  hoverEffect?: HoverEffect;
  onClick?: () => void;
}) {
  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-xl aero-surface',
        'transition-[transform,border-color,box-shadow] duration-200',
        'hover:border-[var(--aero-blue)]',
        hoverEffect === 'scale' && 'hover:-translate-y-0.5 hover:shadow-xl',
        onClick && 'cursor-pointer',
        className
      )}
      style={{ gridColumn: `span ${Math.min(span, 12)}` }}
      onClick={onClick}
    >
      {/* Overlays are decorative only — they never wrap the content. */}
      {hoverEffect === 'shine' && (
        <span aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-xl">
          <ShineBorder duration={1.6} className="!absolute !inset-0 h-full w-full" />
        </span>
      )}
      {hoverEffect === 'beam' && <BorderBeam size={2} duration={3} className="z-0" />}

      <div className="relative z-10 h-full">{children}</div>
    </div>
  );
}

export function BentoGrid({
  className,
  children,
  columns = 2,
  gap = 4,
}: {
  className?: string;
  children: ReactNode;
  columns?: number;
  gap?: number;
}) {
  return (
    <div
      className={cn('grid', className)}
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`, gap: `${gap * 4}px` }}
    >
      {children}
    </div>
  );
}

export function ResponsiveBentoGrid({
  className,
  children,
  minColumnWidth = 280,
  gap = 4,
}: {
  className?: string;
  children: ReactNode;
  minColumnWidth?: number;
  gap?: number;
}) {
  return (
    <div
      className={cn('grid', className)}
      style={{ gridTemplateColumns: `repeat(auto-fit, minmax(${minColumnWidth}px, 1fr))`, gap: `${gap * 4}px` }}
    >
      {children}
    </div>
  );
}
