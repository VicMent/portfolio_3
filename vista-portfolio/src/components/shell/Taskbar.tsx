import { useEffect, useRef, useState } from 'react';
import { cn } from '../../utils/helpers';
import { useWindowStore, TASKBAR_HEIGHT } from '../../stores/windowStore';
import { useDesktopStore } from '../../stores/desktopStore';
import { useThemeStore } from '../../stores/themeStore';
import { useIsMobile } from '../../hooks/useMediaQuery';
import { StartMenu } from './StartMenu';
import { getAppMeta } from '../../data/appMeta';
import { WindowsLogo } from '../vista/BrandIcons';
import { Clock } from '../magicui/Clock';
import { playClickSound, unlockAudio } from '../../utils/sound';
import { Settings, FlipHorizontal } from 'lucide-react';

const QUICK_LAUNCH = ['portfolio', 'about', 'ethical-labs', 'roid-rager', 'contact'];

export function Taskbar({
  flip3DActive,
  onFlip3DActivate,
}: {
  flip3DActive: boolean;
  onFlip3DActivate: () => void;
}) {
  const windows = useWindowStore((s) => s.windows);
  const order = useWindowStore((s) => s.order);
  const focusedWindowId = useWindowStore((s) => s.focusedWindowId);
  const focusWindow = useWindowStore((s) => s.focusWindow);
  const minimizeWindow = useWindowStore((s) => s.minimizeWindow);
  const openWindow = useWindowStore((s) => s.openWindow);
  const showDesktop = useWindowStore((s) => s.showDesktop);

  const sidebarOpen = useDesktopStore((s) => s.sidebarOpen);
  const toggleSidebar = useDesktopStore((s) => s.toggleSidebar);
  const soundEnabled = useThemeStore((s) => s.soundEnabled);

  const isMobile = useIsMobile();
  const [menuOpen, setMenuOpen] = useState(false);
  const startRef = useRef<HTMLButtonElement>(null);

  // The first gesture anywhere unlocks the audio context.
  useEffect(() => {
    const unlock = () => unlockAudio();
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);

  const taskbarWindows = order
    .map((id) => windows[id])
    .filter((w): w is NonNullable<typeof w> => Boolean(w) && w.showInTaskbar);

  const click = (fn: () => void) => {
    if (soundEnabled) playClickSound();
    fn();
  };

  return (
    <>
      <StartMenu open={menuOpen} onClose={() => setMenuOpen(false)} />

      <div
        role="toolbar"
        aria-label="Taskbar"
        className={cn(
          'aero-glass fixed inset-x-0 bottom-0 z-50 flex items-stretch gap-1 border-t border-white/20 px-1',
          'bg-[linear-gradient(180deg,rgba(255,255,255,0.16)_0%,rgba(255,255,255,0.06)_45%,rgba(255,255,255,0.02)_100%)]'
        )}
        style={{ height: TASKBAR_HEIGHT }}
      >
        {/* Start orb */}
        <button
          ref={startRef}
          type="button"
          aria-label="Start"
          aria-expanded={menuOpen}
          onClick={() => click(() => setMenuOpen((v) => !v))}
          className={cn(
            'group relative m-1 mr-2 flex items-center gap-2 rounded-md px-3',
            'transition-colors',
            menuOpen
              ? 'bg-[linear-gradient(180deg,rgba(255,255,255,0.28),rgba(255,255,255,0.08))]'
              : 'hover:bg-white/15'
          )}
        >
          <span
            aria-hidden="true"
            className={cn(
              'flex h-7 w-7 items-center justify-center rounded-full text-white',
              'bg-[radial-gradient(circle_at_32%_28%,#8fd0ff_0%,#2b8fe0_45%,#0a4f8f_100%)]',
              'shadow-[0_0_10px_var(--aero-glow)] transition-transform group-active:scale-95'
            )}
          >
            <WindowsLogo className="h-3.5 w-3.5" />
          </span>
          <span className="hidden text-sm font-semibold italic text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.5)] sm:block">
            start
          </span>
        </button>

        {/* Quick launch */}
        {!isMobile && (
          <div className="hidden items-center gap-0.5 border-r border-white/20 pr-2 md:flex">
            {QUICK_LAUNCH.map((appId) => (
              <QuickLaunchButton key={appId} appId={appId} onOpen={() => click(() => openWindow(appId))} />
            ))}
          </div>
        )}

        {/* Running windows */}
        <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
          {taskbarWindows.map((win) => {
            const isFocused = win.id === focusedWindowId;
            return (
              <button
                key={win.id}
                type="button"
                onClick={() =>
                  click(() => {
                    if (isFocused && !win.isMinimized) minimizeWindow(win.id);
                    else focusWindow(win.id);
                  })
                }
                title={win.title}
                className={cn(
                  'flex h-9 max-w-[190px] shrink-0 items-center gap-2 rounded-md px-2.5 text-[12px] transition-colors',
                  isFocused && !win.isMinimized
                    ? 'bg-[linear-gradient(180deg,rgba(255,255,255,0.34),rgba(255,255,255,0.14))] shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]'
                    : 'hover:bg-white/12'
                )}
              >
                <span aria-hidden="true" className="shrink-0 text-sm">
                  {win.icon}
                </span>
                <span
                  className={cn(
                    'truncate',
                    isFocused && !win.isMinimized ? 'text-white' : 'text-gray-300'
                  )}
                >
                  {win.title}
                </span>
              </button>
            );
          })}
        </div>

        {/* Tray */}
        <div className="flex shrink-0 items-center gap-0.5 border-l border-white/20 pl-1.5">
          <TrayButton label="Sidebar" active={sidebarOpen} onClick={() => click(toggleSidebar)}>
            <svg viewBox="0 0 16 16" className="h-4 w-4" fill="currentColor" aria-hidden="true">
              <rect x="1" y="2" width="5" height="12" rx="1" />
              <rect x="10" y="2" width="5" height="12" rx="1" />
            </svg>
          </TrayButton>

          {!isMobile && (
            <TrayButton
              label="Flip 3D"
              active={flip3DActive}
              onClick={() => click(onFlip3DActivate)}
            >
              <FlipHorizontal size={16} />
            </TrayButton>
          )}

          <TrayButton label="Settings" onClick={() => click(() => openWindow('settings'))}>
            <Settings size={16} />
          </TrayButton>

          <button
            type="button"
            onClick={() => click(showDesktop)}
            className="ml-0.5 h-9 w-2 shrink-0 rounded-sm border-l border-white/25 transition-colors hover:bg-white/25"
            aria-label="Show desktop"
            title="Show desktop"
          />
        </div>

        <Clock className="shrink-0 px-3 py-1.5 text-right" />
      </div>
    </>
  );
}

function QuickLaunchButton({ appId, onOpen }: { appId: string; onOpen: () => void }) {
  const app = getAppMeta(appId);
  if (!app) return null;
  return (
    <button
      type="button"
      onClick={onOpen}
      title={app.title}
      aria-label={app.title}
      className="flex h-8 w-8 items-center justify-center rounded transition-colors hover:bg-white/15"
    >
      <span aria-hidden="true" className="text-base">
        {app.icon}
      </span>
    </button>
  );
}

function TrayButton({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        'flex h-8 w-8 items-center justify-center rounded text-gray-200 transition-colors hover:bg-white/15',
        active && 'bg-white/15 text-white'
      )}
    >
      {children}
    </button>
  );
}
