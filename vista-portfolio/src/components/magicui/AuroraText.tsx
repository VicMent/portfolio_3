import { cn } from '../../utils/helpers';

/**
 * Animated gradient text.
 *
 * The palette is deliberately light: this sits on the dark window surface,
 * and mid-tone blues previously disappeared into the glass.
 */
export function AuroraText({
  className,
  children,
  colors = ['#ffffff', '#bfe4ff', '#7ee7e7', '#ffffff', '#cfe4ff'],
  duration = 9,
}: {
  className?: string;
  children: React.ReactNode;
  colors?: string[];
  duration?: number;
}) {
  const gradient = `linear-gradient(100deg, ${colors.join(', ')}, ${colors[0]})`;

  return (
    <span
      className={cn('inline-block', className)}
      style={{
        backgroundImage: gradient,
        backgroundSize: '300% 100%',
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        color: 'transparent',
        WebkitTextFillColor: 'transparent',
        animation: `aurora-shift ${duration}s ease-in-out infinite`,
      }}
    >
      {children}
    </span>
  );
}
