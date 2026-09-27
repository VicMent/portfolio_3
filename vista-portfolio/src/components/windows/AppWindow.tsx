import type { ReactNode } from 'react';
import { cn } from '../../utils/helpers';

/**
 * Content pane for a standard application window.
 * The window chrome itself is owned by `BaseWindow` in `App`.
 */
export function AppWindow({
  children,
  className,
  scroll = true,
}: {
  children: ReactNode;
  className?: string;
  scroll?: boolean;
}) {
  return (
    <div className={cn(scroll ? 'h-full overflow-y-auto' : 'h-full overflow-hidden', className)}>
      {children}
    </div>
  );
}

/** Centred, narrower pane used for modal-style dialogs. */
export function DialogWindow({
  children,
  className,
  onClose,
}: {
  children: ReactNode;
  className?: string;
  onClose?: () => void;
}) {
  return (
    <div className={cn('h-full overflow-y-auto', className)} onKeyDown={(e) => e.key === 'Escape' && onClose?.()}>
      {children}
    </div>
  );
}
