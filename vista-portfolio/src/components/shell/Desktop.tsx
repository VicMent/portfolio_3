import { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '../../utils/helpers';
import { useDesktopStore } from '../../stores/desktopStore';
import { useWindowStore, TASKBAR_HEIGHT } from '../../stores/windowStore';
import { getAppMeta } from '../../data/appMeta';
import type { DesktopIcon } from '../../data/types';
import { playClickSound, playOpenSound, playEmptySound } from '../../utils/sound';
import { useThemeStore } from '../../stores/themeStore';

const GRID = 92;
const EDGE = 12;

export function Desktop() {
  const icons = useDesktopStore((s) => s.icons);
  const selectIcon = useDesktopStore((s) => s.selectIcon);
  const deselectAll = useDesktopStore((s) => s.deselectAll);
  const updateIconPosition = useDesktopStore((s) => s.updateIconPosition);
  const arrangeIcons = useDesktopStore((s) => s.arrangeIcons);
  const setWallpaper = useDesktopStore((s) => s.setWallpaper);
  const wallpaper = useDesktopStore((s) => s.wallpaper);
  const openWindow = useWindowStore((s) => s.openWindow);
  const showDesktop = useWindowStore((s) => s.showDesktop);
  const soundEnabled = useThemeStore((s) => s.soundEnabled);

  const [menu, setMenu] = useState<null | { x: number; y: number; iconId?: string }>(null);
  const [marquee, setMarquee] = useState<null | { x: number; y: number; w: number; h: number }>(null);
  const marqueeStart = useRef<{ x: number; y: number } | null>(null);

  const closeMenu = useCallback(() => setMenu(null), []);

  useEffect(() => {
    if (!menu) return;
    const dismiss = () => closeMenu();
    document.addEventListener('pointerdown', dismiss);
    document.addEventListener('blur', dismiss);
    window.addEventListener('resize', dismiss);
    return () => {
      document.removeEventListener('pointerdown', dismiss);
      document.removeEventListener('blur', dismiss);
      window.removeEventListener('resize', dismiss);
    };
  }, [menu, closeMenu]);

  // Rubber-band selection
  useEffect(() => {
    if (!marqueeStart.current) return;
    const onMove = (e: PointerEvent) => {
      const s = marqueeStart.current;
      if (!s) return;
      setMarquee({
        x: Math.min(s.x, e.clientX),
        y: Math.min(s.y, e.clientY),
        w: Math.abs(e.clientX - s.x),
        h: Math.abs(e.clientY - s.y),
      });
    };
    const onUp = (e: PointerEvent) => {
      const s = marqueeStart.current;
      marqueeStart.current = null;
      setMarquee(null);
      if (!s) return;
      const box = {
        x: Math.min(s.x, e.clientX),
        y: Math.min(s.y, e.clientY),
        w: Math.abs(e.clientX - s.x),
        h: Math.abs(e.clientY - s.y),
      };
      if (box.w < 6 && box.h < 6) return;
      document
        .querySelectorAll<HTMLElement>('[data-desktop-icon]')
        .forEach((el) => {
          const r = el.getBoundingClientRect();
          const inside =
            r.left < box.x + box.w && r.right > box.x && r.top < box.y + box.h && r.bottom > box.y;
          if (inside) selectIcon(el.dataset.desktopIcon!, true);
        });
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [selectIcon]);

  const launch = useCallback(
    (icon: DesktopIcon) => {
      if (soundEnabled) playOpenSound();
      const id = openWindow(icon.appId);
      if (!id && soundEnabled) playEmptySound();
    },
    [openWindow, soundEnabled]
  );

  return (
    <div
      role="region"
      aria-label="Desktop"
      className="fixed inset-0 z-0 overflow-hidden"
      onContextMenu={(e) => {
        e.preventDefault();
        if (e.target !== e.currentTarget) return;
        deselectAll();
        setMenu({ x: e.clientX, y: e.clientY });
      }}
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) {
          deselectAll();
          marqueeStart.current = { x: e.clientX, y: e.clientY };
        }
      }}
    >
      <Wallpaper />

      <div className="absolute inset-0" style={{ bottom: TASKBAR_HEIGHT }}>
        {icons.map((icon) => (
          <DesktopIconTile
            key={icon.id}
            icon={icon}
            selected={icon.isSelected}
            onSelect={(multi) => {
              if (soundEnabled) playClickSound();
              selectIcon(icon.id, multi);
            }}
            onOpen={() => launch(icon)}
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
              selectIcon(icon.id, false);
              setMenu({ x: e.clientX, y: e.clientY, iconId: icon.id });
            }}
            onMove={(pos) => updateIconPosition(icon.id, pos)}
          />
        ))}
      </div>

      {marquee && marquee.w > 4 && marquee.h > 4 && (
        <div
          className="pointer-events-none fixed border border-[var(--aero-blue)] bg-[var(--aero-blue)]/15"
          style={{ left: marquee.x, top: marquee.y, width: marquee.w, height: marquee.h }}
        />
      )}

      {menu && (
        <DesktopContextMenu
          x={menu.x}
          y={menu.y}
          iconId={menu.iconId}
          onClose={closeMenu}
          onArrange={() => {
            arrangeIcons();
            closeMenu();
          }}
          onRefresh={() => {
            showDesktop();
            closeMenu();
          }}
          onOpenIcon={(id) => {
            const icon = icons.find((i) => i.id === id);
            if (icon) launch(icon);
            closeMenu();
          }}
          onUseWallpaper={(src) => {
            setWallpaper(src);
            closeMenu();
          }}
          wallpaper={wallpaper}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------- wallpaper */

const WALLPAPERS = [
  { id: 'vista', src: '/vista.jpg', label: 'Aero Bloom' },
  { id: 'aurora', src: '', label: 'Aurora Gradient' },
  { id: 'deep', src: '', label: 'Deep Space' },
];

function Wallpaper() {
  const wallpaper = useDesktopStore((s) => s.wallpaper);

  if (wallpaper === '') return <GradientWallpaper variant="aurora" />;
  if (wallpaper === 'aurora') return <GradientWallpaper variant="aurora" />;
  if (wallpaper === 'deep') return <GradientWallpaper variant="deep" />;

  return (
    <>
      {/* Base colour shows through while/if the image is missing. */}
      <div className="absolute inset-0 -z-10 bg-[#0b1622]" />
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url("${wallpaper}")` }}
        onError={(e) => {
          (e.currentTarget as HTMLElement).style.display = 'none';
        }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(120% 90% at 50% 0%, rgba(0,120,215,0.18) 0%, rgba(0,0,0,0.25) 60%, rgba(0,0,0,0.55) 100%)',
        }}
      />
    </>
  );
}

function GradientWallpaper({ variant }: { variant: 'aurora' | 'deep' }) {
  const palettes = {
    aurora:
      'radial-gradient(90% 70% at 18% 12%, rgba(0,120,215,0.55) 0%, transparent 55%),' +
      'radial-gradient(80% 60% at 82% 22%, rgba(0,180,180,0.42) 0%, transparent 55%),' +
      'radial-gradient(90% 70% at 60% 88%, rgba(92,184,92,0.28) 0%, transparent 60%),' +
      'linear-gradient(160deg, #071522 0%, #0b2033 45%, #102a2a 100%)',
    deep:
      'radial-gradient(80% 60% at 70% 20%, rgba(106,63,181,0.45) 0%, transparent 60%),' +
      'radial-gradient(70% 60% at 25% 75%, rgba(0,120,215,0.35) 0%, transparent 60%),' +
      'linear-gradient(180deg, #05070d 0%, #0a1020 60%, #101828 100%)',
  };

  return (
    <>
      <div className="absolute inset-0" style={{ background: palettes[variant] }} aria-hidden="true" />
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
          maskImage: 'radial-gradient(ellipse at 50% 40%, black 20%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(ellipse at 50% 40%, black 20%, transparent 75%)',
        }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{ boxShadow: 'inset 0 0 220px 60px rgba(0,0,0,0.55)' }}
      />
    </>
  );
}

/* ----------------------------------------------------------------- icons */

function DesktopIconTile({
  icon,
  selected,
  onSelect,
  onOpen,
  onContextMenu,
  onMove,
}: {
  icon: DesktopIcon;
  selected: boolean;
  onSelect: (multi: boolean) => void;
  onOpen: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
  onMove: (pos: { x: number; y: number }) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef<{ pointerId: number; dx: number; dy: number; moved: boolean } | null>(null);
  const app = getAppMeta(icon.appId);

  const snap = (x: number, y: number) => {
    const maxX = window.innerWidth - GRID - EDGE;
    const maxY = window.innerHeight - TASKBAR_HEIGHT - GRID - EDGE;
    const sx = Math.round((x - EDGE) / GRID) * GRID + EDGE;
    const sy = Math.round((y - EDGE) / GRID) * GRID + EDGE;
    return {
      x: Math.max(EDGE, Math.min(sx, maxX)),
      y: Math.max(EDGE, Math.min(sy, maxY)),
    };
  };

  return (
    <div
      ref={ref}
      data-desktop-icon={icon.id}
      role="button"
      tabIndex={0}
      aria-label={icon.label}
      onPointerDown={(e) => {
        if (e.button !== 0 && e.pointerType === 'mouse') return;
        onSelect(e.ctrlKey || e.metaKey);
        const rect = ref.current!.getBoundingClientRect();
        drag.current = {
          pointerId: e.pointerId,
          dx: e.clientX - rect.left,
          dy: e.clientY - rect.top,
          moved: false,
        };
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        const d = drag.current;
        const el = ref.current;
        if (!d || !el || d.pointerId !== e.pointerId) return;
        if (!d.moved && Math.abs(e.movementX) + Math.abs(e.movementY) === 0) return;
        d.moved = true;
        el.style.left = `${e.clientX - d.dx}px`;
        el.style.top = `${e.clientY - d.dy}px`;
      }}
      onPointerUp={(e) => {
        const d = drag.current;
        drag.current = null;
        try {
          (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
        } catch {
          /* already released */
        }
        if (!d) return;
        const el = ref.current;
        if (!el) return;
        if (!d.moved) {
          el.style.left = `${icon.position.x}px`;
          el.style.top = `${icon.position.y}px`;
          return;
        }
        onMove(snap(parseFloat(el.style.left), parseFloat(el.style.top)));
      }}
      onDoubleClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen();
        }
      }}
      onContextMenu={onContextMenu}
      className={cn(
        'group absolute flex select-none flex-col items-center gap-1.5 rounded-lg p-2 text-center',
        'transition-shadow',
        selected ? 'bg-[var(--selection-blue)]/70 ring-1 ring-[var(--aero-blue)]' : 'hover:bg-white/10'
      )}
      style={{ left: icon.position.x, top: icon.position.y, width: GRID - 8 }}
    >
      <span
        aria-hidden="true"
        className="flex h-12 w-12 items-center justify-center rounded-xl aero-glass text-[26px] leading-none shadow-lg transition-transform group-hover:scale-105"
      >
        {icon.icon || app?.icon}
      </span>
      <span
        className={cn(
          'line-clamp-2 w-full text-[11px] leading-tight',
          selected ? 'text-white' : 'text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.9)]'
        )}
      >
        {icon.label}
      </span>
    </div>
  );
}

/* ---------------------------------------------------------- context menu */

function DesktopContextMenu({
  x,
  y,
  iconId,
  onClose,
  onArrange,
  onRefresh,
  onOpenIcon,
  onUseWallpaper,
  wallpaper,
}: {
  x: number;
  y: number;
  iconId?: string;
  onClose: () => void;
  onArrange: () => void;
  onRefresh: () => void;
  onOpenIcon: (id: string) => void;
  onUseWallpaper: (src: string) => void;
  wallpaper: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [submenu, setSubmenu] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const left = Math.min(x, window.innerWidth - 230);
  const top = Math.min(y, window.innerHeight - 340);

  const item = (label: string, onClick?: () => void, disabled?: boolean) => (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2.5 rounded px-2.5 py-1.5 text-left text-[12.5px] text-white transition-colors',
        disabled
          ? 'cursor-not-allowed text-gray-500'
          : 'hover:bg-[var(--selection-blue)] focus-visible:bg-[var(--selection-blue)] focus:outline-none'
      )}
    >
      {label}
    </button>
  );

  return (
    <div
      ref={ref}
      role="menu"
      className="aero-glass fixed z-[70] w-56 animate-[vista-pop_120ms_ease-out] rounded-lg border border-white/25 p-1 shadow-2xl"
      style={{ left, top }}
    >
      {iconId ? (
        <>
          {item('Open', () => onOpenIcon(iconId))}
          {item('Open with Portfolio', () => onOpenIcon(iconId))}
          <Divider />
          {item('Cut', undefined, true)}
          {item('Copy', undefined, true)}
          {item('Create shortcut', undefined, true)}
          <Divider />
          {item('Rename', undefined, true)}
          {item('Delete', undefined, true)}
          <Divider />
          {item('Properties', undefined, true)}
        </>
      ) : (
        <>
          <div className="relative" onMouseEnter={() => setSubmenu(true)} onMouseLeave={() => setSubmenu(false)}>
            <button
              type="button"
              className="flex w-full items-center justify-between rounded px-2.5 py-1.5 text-left text-[12.5px] text-white transition-colors hover:bg-[var(--selection-blue)]"
            >
              View
              <span aria-hidden="true" className="text-gray-300">›</span>
            </button>
            {submenu && (
              <div className="aero-glass absolute top-0 left-full z-10 ml-1 w-44 rounded-lg border border-white/25 p-1 shadow-xl">
                {item('Large icons', undefined, true)}
                {item('Medium icons', undefined, true)}
                {item('Small icons', undefined, true)}
                <Divider />
                {item('List', undefined, true)}
                {item('Details', undefined, true)}
              </div>
            )}
          </div>

          <div className="relative" onMouseEnter={() => setSubmenu(true)} onMouseLeave={() => setSubmenu(false)}>
            <button
              type="button"
              className="flex w-full items-center justify-between rounded px-2.5 py-1.5 text-left text-[12.5px] text-white transition-colors hover:bg-[var(--selection-blue)]"
            >
              Sort by
              <span aria-hidden="true" className="text-gray-300">›</span>
            </button>
            {submenu && (
              <div className="aero-glass absolute top-0 left-full z-10 ml-1 w-44 rounded-lg border border-white/25 p-1 shadow-xl">
                {item('Name', undefined, true)}
                {item('Size', undefined, true)}
                {item('Item type', undefined, true)}
                {item('Date modified', undefined, true)}
              </div>
            )}
          </div>

          <Divider />

          {item('Refresh', onRefresh)}
          {item('Paste', undefined, true)}
          {item('Arrange icons by name', onArrange)}

          <Divider />

          <div className="relative" onMouseEnter={() => setSubmenu(true)} onMouseLeave={() => setSubmenu(false)}>
            <button
              type="button"
              className="flex w-full items-center justify-between rounded px-2.5 py-1.5 text-left text-[12.5px] text-white transition-colors hover:bg-[var(--selection-blue)]"
            >
              Desktop background
              <span aria-hidden="true" className="text-gray-300">›</span>
            </button>
            {submenu && (
              <div className="aero-glass absolute top-0 left-full z-10 ml-1 w-52 rounded-lg border border-white/25 p-2 shadow-xl">
                <p className="mb-1.5 px-1 text-[10px] uppercase tracking-wider text-gray-400">Wallpaper</p>
                <div className="grid grid-cols-3 gap-1.5">
                  {WALLPAPERS.map((w) => (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => onUseWallpaper(w.src)}
                      title={w.label}
                      className={cn(
                        'h-12 overflow-hidden rounded border transition-transform hover:scale-105',
                        wallpaper === w.src
                          ? 'border-[var(--aero-blue)] ring-1 ring-[var(--aero-blue)]'
                          : 'border-white/25'
                      )}
                      style={
                        w.src
                          ? { backgroundImage: `url("${w.src}")`, backgroundSize: 'cover' }
                          : {
                              background:
                                w.id === 'aurora'
                                  ? 'linear-gradient(140deg,#0b2033,#0f6fb8,#00b4b4)'
                                  : 'linear-gradient(140deg,#05070d,#101828,#6a3fb5)',
                            }
                      }
                    >
                      <span className="sr-only">{w.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Divider />
          {item('Properties', undefined, true)}
        </>
      )}
    </div>
  );
}

function Divider() {
  return <div className="my-1 h-px bg-white/15" role="separator" />;
}
