import { Component, useEffect, useState, type ReactNode } from 'react';
import { useWindowStore } from './stores/windowStore';
import { useDesktopStore } from './stores/desktopStore';
import { useThemeStore } from './stores/themeStore';
import { useAeroTheme } from './hooks/useAeroTheme';
import { useDesktopShortcuts } from './hooks/useDesktopShortcuts';
import { getApp } from './data/apps';
import { BaseWindow } from './components/windows/BaseWindow';
import { Desktop } from './components/shell/Desktop';
import { Sidebar } from './components/shell/Sidebar';
import { Taskbar } from './components/shell/Taskbar';
import { Flip3D } from './components/shell/Flip3D';
import { WindowsLogo } from './components/vista/BrandIcons';
import { useIsMobile } from './hooks/useMediaQuery';
import { playStartupSound } from './utils/sound';

/* ------------------------------------------------------------ boundaries */

class WindowErrorBoundary extends Component<
  { children: ReactNode; title: string; onClose: () => void },
  { failed: boolean; message: string }
> {
  state = { failed: false, message: '' };

  static getDerivedStateFromError(error: Error) {
    return { failed: true, message: error.message };
  }

  componentDidUpdate(prev: { children: ReactNode }) {
    if (prev.children !== this.props.children && this.state.failed) {
      this.setState({ failed: false, message: '' });
    }
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
        <p className="text-3xl">⚠️</p>
        <h2 className="text-base font-semibold text-white">This window stopped responding</h2>
        <p className="max-w-sm text-xs text-gray-400">{this.state.message}</p>
        <div className="mt-2 flex gap-2">
          <button type="button" onClick={() => this.setState({ failed: false, message: '' })} className="aero-button rounded px-4 py-1.5 text-xs">
            Try again
          </button>
          <button type="button" onClick={this.props.onClose} className="aero-button-primary rounded px-4 py-1.5 text-xs">
            Close window
          </button>
        </div>
      </div>
    );
  }
}

/* ------------------------------------------------------------------ boot */

function BootScreen({ progress }: { progress: number }) {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black px-6">
      <div className="relative mb-8 h-20 w-20">
        <span className="absolute inset-0 rounded-full border-2 border-white/10" />
        <span className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-[var(--aero-blue)]" />
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

/* ------------------------------------------------------------------- app */

function KonamiCode() {
  const openWindow = useWindowStore((s) => s.openWindow);
  useEffect(() => {
    const CODE = 'ArrowUp,ArrowUp,ArrowDown,ArrowDown,ArrowLeft,ArrowRight,ArrowLeft,ArrowRight,KeyB,KeyA';
    let buffer: string[] = [];
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      // Do not hijack keys typed into inputs.
      if (target && /^(INPUT|TEXTAREA)$/.test(target.tagName)) return;
      buffer = [...buffer, e.code].slice(-10);
      if (buffer.join(',') === CODE) {
        buffer = [];
        openWindow('about');
      }
    };
    // One stable listener for the lifetime of the app.
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openWindow]);
  return null;
}

export default function App() {
  const windows = useWindowStore((s) => s.windows);
  const order = useWindowStore((s) => s.order);
  const closeWindow = useWindowStore((s) => s.closeWindow);
  const openWindow = useWindowStore((s) => s.openWindow);
  const sidebarOpen = useDesktopStore((s) => s.sidebarOpen);
  const soundEnabled = useThemeStore((s) => s.soundEnabled);
  const isMobile = useIsMobile();

  const [booted, setBooted] = useState(false);
  const [progress, setProgress] = useState(0);

  useAeroTheme();
  const { flip3D, toggleFlip3D, closeFlip3D } = useDesktopShortcuts();

  // Boot, then open the Welcome Center. Short enough not to be an obstacle.
  useEffect(() => {
    let cancelled = false;
    const steps = [12, 28, 46, 63, 78, 90, 100];
    let i = 0;

    const tick = () => {
      if (cancelled) return;
      setProgress(steps[i]);
      i += 1;
      if (i < steps.length) {
        timer = setTimeout(tick, 110);
      } else {
        if (soundEnabled) playStartupSound();
        openWindow('welcome');
        setBooted(true);
      }
    };

    let timer = setTimeout(tick, 220);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [openWindow, soundEnabled]);

  if (!booted) return <BootScreen progress={progress} />;

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#0b1622]">
      <Desktop />
      <Sidebar isOpen={sidebarOpen && !isMobile} />
      <Taskbar flip3DActive={flip3D} onFlip3DActivate={toggleFlip3D} />
      {flip3D && <Flip3D onClose={closeFlip3D} />}

      {order.map((id) => {
        const win = windows[id];
        if (!win || win.isMinimized) return null;
        const app = getApp(win.appId);
        if (!app) return null;
        const Content = app.component;
        return (
          <BaseWindow key={id} window={win}>
            <WindowErrorBoundary title={win.title} onClose={() => closeWindow(id)}>
              <Content window={win} onClose={() => closeWindow(id)} />
            </WindowErrorBoundary>
          </BaseWindow>
        );
      })}

      <KonamiCode />
    </div>
  );
}
