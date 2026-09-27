import { memo } from 'react';
import { cn } from '../../utils/helpers';

/**
 * A diagonal light sweep. Purely decorative overlay — it renders no content
 * of its own so it can safely sit on top of a card without duplicating children.
 */
export const ShineBorder = memo(function ShineBorder({
  className,
  duration = 2,
  color = 'rgba(255,255,255,0.35)',
}: {
  className?: string;
  duration?: number;
  color?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}
    >
      <span
        className="absolute -inset-y-full w-1/2 skew-x-[-18deg]"
        style={{
          background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
          animation: `shine-sweep ${duration}s ease-in-out infinite`,
        }}
      />
    </span>
  );
});
