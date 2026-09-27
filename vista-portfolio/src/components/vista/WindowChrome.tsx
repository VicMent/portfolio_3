import { type ReactNode, memo } from 'react';
import { cn } from '../../utils/helpers';
import { X, Minus, Square, Copy } from 'lucide-react';

interface WindowChromeProps {
  title: string;
  icon?: ReactNode;
  isActive?: boolean;
  isMaximized?: boolean;
  showMinimize?: boolean;
  onMinimize?: () => void;
  onMaximize?: () => void;
  onClose?: () => void;
  onPointerDown?: (e: React.PointerEvent) => void;
  onPointerMove?: (e: React.PointerEvent) => void;
  onPointerUp?: (e: React.PointerEvent) => void;
  onPointerCancel?: (e: React.PointerEvent) => void;
  onDoubleClick?: (e: React.MouseEvent) => void;
  children: ReactNode;
}

function ChromeButton({
  label,
  onClick,
  active,
  danger,
  children,
}: {
  label: string;
  onClick?: () => void;
  active?: boolean;
  danger?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      data-no-drag="true"
      className={cn(
        'group relative flex h-[26px] w-[42px] items-center justify-center',
        'text-white/90 transition-colors',
        danger
          ? 'hover:bg-[#e81123] focus-visible:bg-[#e81123]'
          : 'hover:bg-white/25 focus-visible:bg-white/30',
        active && 'bg-white/20'
      )}
    >
      {children}
    </button>
  );
}

export const WindowChrome = memo(function WindowChrome({
  title,
  icon,
  isActive = true,
  isMaximized = false,
  showMinimize = true,
  onMinimize,
  onMaximize,
  onClose,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  onDoubleClick,
  children,
}: WindowChromeProps) {
  return (
    <div
      className={cn(
        'flex h-full w-full flex-col overflow-hidden',
        'border transition-[border-color,box-shadow] duration-150',
        isActive
          ? 'border-[var(--aero-blue)]/70 shadow-[0_0_22px_var(--aero-glow)]'
          : 'border-white/15'
      )}
    >
      {/* Title bar */}
      <div
        data-window-drag=""
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onDoubleClick={onDoubleClick}
        className={cn(
          'relative flex h-8 shrink-0 touch-none select-none items-center gap-2 pr-1 pl-2.5',
          'cursor-grab active:cursor-grabbing',
          isActive
            ? 'bg-[linear-gradient(180deg,rgba(120,180,235,0.95)_0%,rgba(35,115,188,0.95)_45%,rgba(20,85,150,0.95)_46%,rgba(45,125,200,0.95)_100%)]'
            : 'bg-[linear-gradient(180deg,rgba(235,240,248,0.55)_0%,rgba(190,205,225,0.5)_50%,rgba(160,180,205,0.5)_100%)]'
        )}
      >
        {/* Aero gloss */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent"
        />

        <span className="relative flex h-[18px] w-[18px] shrink-0 items-center justify-center text-[13px] leading-none">
          {icon ?? (
            <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
              <rect x="2" y="2" width="12" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="1.2" />
              <path d="M5 6h6M5 9.5h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          )}
        </span>

        <span
          className={cn(
            'relative min-w-0 flex-1 truncate text-[13px] font-semibold tracking-tight',
            isActive ? 'text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.55)]' : 'text-[#3a4550]/80'
          )}
        >
          {title}
        </span>

        <div data-no-drag="true" className="relative flex shrink-0 items-center">
          <span
            aria-hidden="true"
            className={cn(
              'mx-1 h-[18px] w-px',
              isActive ? 'bg-white/35' : 'bg-black/15'
            )}
          />
          {showMinimize && (
            <ChromeButton label="Minimize" onClick={onMinimize}>
              <Minus size={13} strokeWidth={2.5} />
            </ChromeButton>
          )}
          {onMaximize && (
            <ChromeButton label={isMaximized ? 'Restore Down' : 'Maximize'} onClick={onMaximize}>
              {isMaximized ? (
                <Copy size={11} strokeWidth={2.2} className="-scale-x-100" />
              ) : (
                <Square size={11} strokeWidth={2.4} />
              )}
            </ChromeButton>
          )}
          <ChromeButton label="Close" onClick={onClose} danger>
            <X size={14} strokeWidth={2.6} />
          </ChromeButton>
        </div>
      </div>

      {/* Content */}
      <div
        className="relative min-h-0 flex-1 bg-[var(--surface-bg)]"
        style={{
          backdropFilter: 'blur(18px) saturate(140%)',
          WebkitBackdropFilter: 'blur(18px) saturate(140%)',
        }}
      >
        {children}
      </div>
    </div>
  );
});
