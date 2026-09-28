import { cn } from '../../utils/helpers';

/**
 * Animated gradient text.
 *
 * The palette comes from CSS custom properties so it can be deepened in the
 * Aero Light theme — the light-on-dark stops vanish against a light surface.
 */
export function AuroraText({
  className,
  children,
  duration = 9,
  as: Tag = 'span',
}: {
  className?: string;
  children: React.ReactNode;
  duration?: number;
  as?: 'span' | 'h1' | 'h2' | 'h3' | 'p';
}) {
  return (
    <Tag
      className={cn('inline-block', className)}
      style={{
        backgroundImage:
          'linear-gradient(100deg, var(--aurora-1), var(--aurora-2), var(--aurora-3), var(--aurora-4), var(--aurora-5), var(--aurora-1))',
        backgroundSize: '300% 100%',
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        color: 'transparent',
        WebkitTextFillColor: 'transparent',
        animation: `aurora-shift ${duration}s ease-in-out infinite`,
      }}
    >
      {children}
    </Tag>
  );
}
