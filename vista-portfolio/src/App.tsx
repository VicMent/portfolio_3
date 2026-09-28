import { Suspense, useEffect, useMemo, useState } from 'react';
import { useWindowStore } from './stores/windowStore';
import { useDesktopStore } from './stores/desktopStore';
import { useThemeStore } from './stores/themeStore';
import { useAeroTheme } from './hooks/useAeroTheme';
import { useDesktopShortcuts } from './hooks/useDesktopShortcuts';
import { useIdle } from './hooks/useIdle';
import { getApp } from './data/apps';
import { BaseWindow } from './components/windows/BaseWindow';
import { AppErrorBoundary, WindowErrorBoundary } from './components/vista/ErrorBoundaries';
import { Desktop } from './components/shell/Desktop';
import { Sidebar } from './components/shell/Sidebar';
import { Taskbar } from './components/shell/Taskbar';
import { Flip3D } from './components/shell/Flip3D';
import { AppDrawer } from './components/shell/AppDrawer';
import { Screensaver } from './components/shell/Screensaver';
import { ShutdownScreen } from './components/shell/ShutdownScreen';
import { WindowsLogo } from './components/vista/BrandIcons';
import { useIsMobile } from './hooks/useMediaQuery';
import { playStartupSound } from './utils/sound';
import { APP_META } from './data/appMeta';
import type { WindowState } from './data/types';

/** Shown while a lazily-loaded window's chunk is still arriving. */
function WindowSkeleton({ title }: { title: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 text-[var(--text-muted)]">
      <WindowsLogo className="h-7 w-7 animate-pulse text-[var(--aero-blue)]" />
      <p className="text-xs">Loading {title}…</p>
    </div>
  );
}

function LazyContent({
  appId,
  window: win,
  onClose,
}: {
  appId: string;
  window: WindowState;
  onClose: () => void;
}) {
  const app = getApp(appId);
  if (!app) return null;
  const Content = app.component;
  return <Content window={win} onClose={onClose} />;
}

/* ------------------------------------------------------------------ boot */

function BootScreen({ progress }: { progress: number }) {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black px-6">
      <div className="relative mb-8 h-20 w-20">
        <span className="absolute inset-0 rounded-full border-2 border-white/10" />
        <span className="absolute inset-0 animate-spin-slow rounded-full border-2 border-transparent border-t-[var(--aero-blue)]" />
        <span className="absolute inset-0 flex items-center justify-center">
          <WindowsLogo className="h-9 w-9 text-[var(--aero-blue)]" />
        </span>
      </div>

      <h1 className="text-2xl font-bold tracking-tight text-white">Vic Menten OS</h1>
      <p className="mt-1.5 text-sm text-gray-400">Starting up&hellip;</p>

      <div className="mt-8 h-2 w-64 overflow-hidden rounded-full border border-white/15 bg-white/10">
        <div
          className="h-full rounded-full bg-[linear-gradient(90deg,var(--aero-blue),var(--aero-teal))] transition-[width] duration-200"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="mt-2 font-mono text-[11px] text-gray-500">{progress}%</p>
    </div>
  );
}

/* ----------------------------------------------------------------- easter egg */

function KonamiCode() {
  const openWindow = useWindowStore((s) => s.openWindow);
  useEffect(() => {
    const CODE = 'ArrowUp,ArrowUp,ArrowDown,ArrowDown,ArrowLeft,ArrowRight,ArrowLeft,ArrowRight,KeyB,KeyA';
    let buffer: string[] = [];
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA)$/.test(target.tagName)) return;
      buffer = [...buffer, e.code].slice(-10);
      if (buffer.join(',') === CODE) {
        buffer = [];
        openWindow('roid-rager');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openWindow]);
  return null;
}

/* -------------------------------------------------------------------- app */

export default function App() {
  const windows = useWindowStore((s) => s.windows);
  const order = useWindowStore((s) => s.order);
  const closingIds = useWindowStore((s) => s.closingIds);
  const closeWindow = useWindowStore((s) => s.closeWindow);
  const finalizeClose = useWindowStore((s) => s.finalizeClose);
  const openWindow = useWindowStore((s) => s.openWindow);
  const closeAll = useWindowStore((s) => s.closeAll);
  const sidebarOpen = useDesktopStore((s) => s.sidebarOpen);
  const soundEnabled = useThemeStore((s) => s.soundEnabled);
  const isMobile = useIsMobile();

  const [booted, setBooted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [shutdown, setShutdown] = useState<null | 'off' | 'restart'>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useAeroTheme();
  const { flip3D, toggleFlip3D, closeFlip3D } = useDesktopShortcuts();

  // A deep link like /?app=resume opens straight into that window.
  useEffect(() => {
    if (!booted) return;
    const app = new URLSearchParams(window.location.search).get('app');
    if (app && app in APP_META) openWindow(app);
  }, [booted, openWindow]);

  useEffect(() => {
    let cancelled = false;
    const steps = [12, 28, 46, 63, 78, 90, 100];
    let i = 0;
    let timer: number;

    const tick = () => {
      if (cancelled) return;
      setProgress(steps[i]);
      i += 1;
      if (i < steps.length) {
        timer = window.setTimeout(tick, 110);
      } else {
        if (soundEnabled) playStartupSound();
        openWindow('welcome');
        setBooted(true);
      }
    };

    timer = window.setTimeout(tick, 220);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [openWindow, soundEnabled]);

  // Commit closes only after the exit animation has had time to play.
  useEffect(() => {
    if (!closingIds.length) return;
    const timers = closingIds.map((id) => window.setTimeout(() => finalizeClose(id), 190));
    return () => timers.forEach(clearTimeout);
  }, [closingIds, finalizeClose]);

  // Idle for a while with no windows open → run the turntable screensaver.
  // `?idle=<seconds>` overrides the delay, which is handy for testing it.
  const idleDelay = useMemo(() => {
    const raw = new URLSearchParams(window.location.search).get('idle');
    const parsed = raw ? Number(raw) : NaN;
    return Number.isFinite(parsed) && parsed >= 0 ? parsed * 1000 : 45_000;
  }, []);
  const idle = useIdle(booted && !shutdown ? idleDelay : 0);
  const [screensaver, setScreensaver] = useState(false);
  useEffect(() => {
    if (idle && order.length === 0) setScreensaver(true);
  }, [idle, order.length]);

  if (!booted) return <BootScreen progress={progress} />;

  if (shutdown === 'restart') {
    return (
      <ShutdownScreen
        mode="restart"
        onRestart={() => {
          setShutdown(null);
          window.location.reload();
        }}
      />
    );
  }

  if (shutdown === 'off') {
    return <ShutdownScreen mode="off" onPowerOn={() => { setShutdown(null); openWindow('welcome'); }} />;
  }

  return (
    <AppErrorBoundary>
      <div className="relative h-full w-full overflow-hidden bg-[#0b1622]">
        <Desktop />
        <Sidebar isOpen={sidebarOpen && !isMobile} />
        <Taskbar
          flip3DActive={flip3D}
          onFlip3DActivate={toggleFlip3D}
          onStart={() => setDrawerOpen((v) => !v)}
          onShutDown={() => {
            closeAll();
            setShutdown('off');
          }}
        />
        <AppDrawer open={isMobile && drawerOpen} onClose={() => setDrawerOpen(false)} />
        {flip3D && <Flip3D onClose={closeFlip3D} />}

        {order.map((id) => {
          const win = windows[id];
          if (!win || (win.isMinimized && !closingIds.includes(id))) return null;
          if (!getApp(win.appId)) return null;
          return (
            <BaseWindow key={id} window={win} closing={closingIds.includes(id)}>
              <WindowErrorBoundary title={win.title} onClose={() => closeWindow(id)}>
                <Suspense fallback={<WindowSkeleton title={win.title} />}>
                  <LazyContent appId={win.appId} window={win} onClose={() => closeWindow(id)} />
                </Suspense>
              </WindowErrorBoundary>
            </BaseWindow>
          );
        })}

        <KonamiCode />
        {screensaver && <Screensaver onDismiss={() => setScreensaver(false)} />}
      </div>
    </AppErrorBoundary>
  );
}
