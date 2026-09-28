import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '../../utils/helpers';
import { WindowChrome } from '../vista/WindowChrome';
import { useWindowStore, TASKBAR_HEIGHT, getUsableViewport } from '../../stores/windowStore';
import { useDesktopStore } from '../../stores/desktopStore';
import type { WindowState } from '../../data/types';
import { playOpenSound, playCloseSound, playMinimizeSound, playMaximizeSound } from '../../utils/sound';
import { useIsMobile, usePrefersReducedMotion } from '../../hooks/useMediaQuery';

type ResizeDir = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

interface DragState {
  pointerId: number;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
  width: number;
  height: number;
  moved: boolean;
}

interface ResizeState {
  pointerId: number;
  dir: ResizeDir;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
  originW: number;
  originH: number;
}

const SNAP_EDGE = 18;

function useIsMobileViewport() {
  return useIsMobile();
}

export function BaseWindow({
  window: win,
  children,
  closing = false,
}: {
  window: WindowState;
  children: ReactNode;
  /** True while the window is playing its exit animation. */
  closing?: boolean;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const resizeRef = useRef<ResizeState | null>(null);
  const [snapHint, setSnapHint] = useState<null | 'left' | 'right' | 'maximize'>(null);
  /** Kept mounted for a beat after minimising so the fly-out can play. */
  const [minimising, setMinimising] = useState(false);
  /** Offset from the window's centre to its taskbar button, for the fly-out. */
  const [flyTo, setFlyTo] = useState<{ dx: number; dy: number } | null>(null);

  const { focusWindow, closeWindow, minimizeWindow, toggleMaximize, moveWindow, resizeWindow, snapWindow } =
    useWindowStore();

  const isMobile = useIsMobileViewport();
  const sidebarOpen = useDesktopStore((s) => s.sidebarOpen);
  const reduceMotion = usePrefersReducedMotion();

  // Only play the open sound for genuinely new windows, once.
  const openedRef = useRef(false);
  useEffect(() => {
    if (openedRef.current) return;
    openedRef.current = true;
    playOpenSound();
  }, []);

  // Minimise: measure the taskbar button, animate towards it, then unmount.
  useEffect(() => {
    if (!win.isMinimized) return;
    const el = document.querySelector<HTMLElement>(`[data-taskbar-item="${win.id}"]`);
    const frame = frameRef.current;
    if (el && frame) {
      const button = el.getBoundingClientRect();
      const box = frame.getBoundingClientRect();
      setFlyTo({
        dx: button.left + button.width / 2 - (box.left + box.width / 2),
        dy: button.top + button.height / 2 - (box.top + box.height / 2),
      });
    } else {
      setFlyTo(null);
    }
    setMinimising(true);
    const timer = window.setTimeout(() => setMinimising(false), 260);
    return () => clearTimeout(timer);
  }, [win.isMinimized, win.id]);

  // Leaving a minimised state resets the fly-out offset.
  useEffect(() => {
    if (!win.isMinimized) setFlyTo(null);
  }, [win.isMinimized]);

  const viewport = useMemo(() => getUsableViewport(), [sidebarOpen, isMobile]);

  // Keep windows inside the usable area when the screen or rail changes.
  useEffect(() => {
    if (isMobile || win.isMaximized) return;
    const maxX = viewport.w - 120;
    const maxY = viewport.h - 32;
    if (win.position.x > maxX || win.position.y > maxY || win.position.x < 0 || win.position.y < 0) {
      moveWindow(win.id, {
        x: Math.min(Math.max(win.position.x, 0), maxX),
        y: Math.min(Math.max(win.position.y, 0), maxY),
      });
    }
  }, [viewport.w, viewport.h, isMobile, win.id, win.isMaximized, win.position.x, win.position.y, moveWindow]);

  /* ---------------------------------------------------------------- drag */

  const beginDrag = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      // Only bail on genuinely interactive elements — a blanket data-no-drag
      // check would also block dragging from the title text itself.
      const target = e.target as HTMLElement;
      if (target.closest('button, a, input, select, textarea, [data-no-drag]')) return;
      if (!win.isMovable || isMobile) return;

      focusWindow(win.id);

      // Dragging a maximized window restores it under the cursor (Aero behaviour).
      if (win.isMaximized) {
        const restored = win.restoreSize ?? { width: 900, height: 620 };
        const ratio = (e.clientX - win.position.x) / Math.max(win.size.width, 1);
        toggleMaximize(win.id);
        const x = Math.max(0, e.clientX - restored.width * ratio);
        moveWindow(win.id, { x, y: Math.max(0, e.clientY - 16) });
        dragRef.current = {
          pointerId: e.pointerId,
          startX: e.clientX,
          startY: e.clientY,
          originX: x,
          originY: Math.max(0, e.clientY - 16),
          width: restored.width,
          height: restored.height,
          moved: false,
        };
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        return;
      }

      dragRef.current = {
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        originX: win.position.x,
        originY: win.position.y,
        width: win.size.width,
        height: win.size.height,
        moved: false,
      };
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    },
    [win.id, win.isMaximized, win.position.x, win.position.y, win.size.width, win.size.height, win.restoreSize, win.isMovable, isMobile, focusWindow, toggleMaximize, moveWindow]
  );

  const onDragMove = useCallback(
    (e: React.PointerEvent) => {
      const d = dragRef.current;
      const el = frameRef.current;
      if (!d || !el || d.pointerId !== e.pointerId) return;

      const dx = e.clientX - d.startX;
      const dy = e.clientY - d.startY;
      if (!d.moved && Math.abs(dx) < 3 && Math.abs(dy) < 3) return;
      d.moved = true;

      let x = d.originX + dx;
      let y = Math.max(0, d.originY + dy);
      const limit = getUsableViewport().w;
      x = Math.min(Math.max(x, -d.width + 120), limit - 120);

      el.style.transform = `translate3d(${x}px, ${y}px, 0)`;

      // Aero edge snapping
      if (e.clientX <= SNAP_EDGE) setSnapHint('left');
      else if (e.clientX >= limit - SNAP_EDGE) setSnapHint('right');
      else if (e.clientY <= SNAP_EDGE) setSnapHint('maximize');
      else setSnapHint(null);
    },
    []
  );

  const endDrag = useCallback(
    (e: React.PointerEvent) => {
      const d = dragRef.current;
      if (!d || d.pointerId !== e.pointerId) return;
      dragRef.current = null;
      setSnapHint(null);
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        /* pointer already released */
      }
      if (!d.moved) return;

      if (snapHint) {
        snapWindow(win.id, snapHint);
        return;
      }
      const el = frameRef.current;
      const x = el ? Number(/translate3d\((-?[\d.]+)px/.exec(el.style.transform)?.[1] ?? d.originX) : d.originX;
      const y = el ? Number(/translate3d\([^,]+,\s*(-?[\d.]+)px/.exec(el.style.transform)?.[1] ?? d.originY) : d.originY;
      moveWindow(win.id, { x, y });
    },
    [win.id, snapHint, snapWindow, moveWindow]
  );

  /* -------------------------------------------------------------- resize */

  const beginResize = useCallback(
    (e: React.PointerEvent, dir: ResizeDir) => {
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      if (!win.isResizable || isMobile || win.isMaximized) return;
      e.stopPropagation();
      focusWindow(win.id);
      resizeRef.current = {
        pointerId: e.pointerId,
        dir,
        startX: e.clientX,
        startY: e.clientY,
        originX: win.position.x,
        originY: win.position.y,
        originW: win.size.width,
        originH: win.size.height,
      };
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    },
    [win.id, win.isResizable, win.isMaximized, win.position.x, win.position.y, win.size.width, win.size.height, isMobile, focusWindow]
  );

  const onResizeMove = useCallback((e: React.PointerEvent) => {
    const r = resizeRef.current;
    const el = frameRef.current;
    if (!r || !el || r.pointerId !== e.pointerId) return;

    const dx = e.clientX - r.startX;
    const dy = e.clientY - r.startY;
    const { dir, originX, originY, originW, originH } = r;

    let { width, height, x, y } = { width: originW, height: originH, x: originX, y: originY };

    if (dir.includes('e')) width = originW + dx;
    if (dir.includes('s')) height = originH + dy;
    if (dir.includes('w')) {
      width = originW - dx;
      x = originX + dx;
    }
    if (dir.includes('n')) {
      height = originH - dy;
      y = originY + dy;
    }

    // Respect minimums by compensating the origin on west/north edges.
    if (dir.includes('w') && width < win.minWidth) {
      x = originX + (originW - win.minWidth);
      width = win.minWidth;
    }
    if (dir.includes('n') && height < win.minHeight) {
      y = originY + (originH - win.minHeight);
      height = win.minHeight;
    }
    if (!dir.includes('w')) width = Math.max(win.minWidth, width);
    if (!dir.includes('n')) height = Math.max(win.minHeight, height);
    if (y < 0) {
      height += y;
      y = 0;
    }

    el.style.width = `${Math.round(width)}px`;
    el.style.height = `${Math.round(height)}px`;
    el.style.transform = `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0)`;
  }, [win.minWidth, win.minHeight]);

  const endResize = useCallback(
    (e: React.PointerEvent) => {
      const r = resizeRef.current;
      if (!r || r.pointerId !== e.pointerId) return;
      resizeRef.current = null;
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        /* already released */
      }
      const el = frameRef.current;
      if (!el) return;
      const width = parseFloat(el.style.width);
      const height = parseFloat(el.style.height);
      const x = Number(/translate3d\((-?[\d.]+)px/.exec(el.style.transform)?.[1] ?? r.originX);
      const y = Number(/translate3d\([^,]+,\s*(-?[\d.]+)px/.exec(el.style.transform)?.[1] ?? r.originY);
      if (Number.isFinite(width) && Number.isFinite(height)) {
        resizeWindow(win.id, { width, height }, { x, y });
      }
    },
    [win.id, resizeWindow]
  );

  /* ------------------------------------------------------------- actions */

  const handleClose = useCallback(() => {
    playCloseSound();
    closeWindow(win.id);
  }, [win.id, closeWindow]);

  const handleMinimize = useCallback(() => {
    playMinimizeSound();
    minimizeWindow(win.id);
  }, [win.id, minimizeWindow]);

  const handleMaximize = useCallback(() => {
    playMaximizeSound();
    toggleMaximize(win.id);
  }, [win.id, toggleMaximize]);

  const handleTitleDoubleClick = useCallback(() => {
    if (win.isResizable) {
      playMaximizeSound();
      toggleMaximize(win.id);
    }
  }, [win.id, win.isResizable, toggleMaximize]);

  // Stay mounted briefly while the minimise animation plays.
  if (win.isMinimized && !minimising) return null;

  const maximized = win.isMaximized || isMobile;
  const frameStyle: React.CSSProperties = maximized
    ? {
        top: 0,
        left: 0,
        // Reserve the gadget rail so a maximised window never hides it.
        width: isMobile ? '100vw' : `${viewport.w}px`,
        height: `calc(100vh - ${TASKBAR_HEIGHT}px)`,
      }
    : {
        width: win.size.width,
        height: win.size.height,
        transform: `translate3d(${win.position.x}px, ${win.position.y}px, 0)`,
      };

  const resizeHandles: Array<{ dir: ResizeDir; className: string; cursor: string }> = [
    { dir: 'n', className: 'top-0 left-3 right-3 h-1.5', cursor: 'ns-resize' },
    { dir: 's', className: 'bottom-0 left-3 right-3 h-1.5', cursor: 'ns-resize' },
    { dir: 'w', className: 'left-0 top-3 bottom-3 w-1.5', cursor: 'ew-resize' },
    { dir: 'e', className: 'right-0 top-3 bottom-3 w-1.5', cursor: 'ew-resize' },
    { dir: 'nw', className: 'top-0 left-0 w-4 h-4', cursor: 'nwse-resize' },
    { dir: 'ne', className: 'top-0 right-0 w-4 h-4', cursor: 'nesw-resize' },
    { dir: 'sw', className: 'bottom-0 left-0 w-4 h-4', cursor: 'nesw-resize' },
    { dir: 'se', className: 'bottom-0 right-0 w-4 h-4', cursor: 'nwse-resize' },
  ];

  return (
    <>
      {snapHint && (
        <div
          className="fixed pointer-events-none z-[9998] rounded-lg border-2 border-white/70 bg-[var(--aero-blue)]/25 backdrop-blur-sm transition-all"
          style={
            snapHint === 'left'
              ? { left: 0, top: 0, width: '50vw', height: `calc(100vh - ${TASKBAR_HEIGHT}px)` }
              : snapHint === 'right'
                ? { right: 0, top: 0, width: '50vw', height: `calc(100vh - ${TASKBAR_HEIGHT}px)` }
                : { left: 0, top: 0, width: `${viewport.w}px`, height: `calc(100vh - ${TASKBAR_HEIGHT}px)` }
          }
        />
      )}

      <motion.div
        className="pointer-events-none fixed inset-0"
        style={{ zIndex: win.zIndex }}
        initial={reduceMotion ? false : { opacity: 0, scale: 0.94 }}
        animate={
          closing
            ? { opacity: 0, scale: 0.96, transition: { duration: 0.16, ease: 'easeIn' } }
            : win.isMinimized && minimising
              ? {
                  opacity: 0,
                  scale: 0.08,
                  x: flyTo?.dx ?? 0,
                  y: flyTo?.dy ?? viewport.h,
                  transition: { duration: 0.26, ease: [0.4, 0, 0.2, 1] },
                }
              : { opacity: 1, scale: 1, x: 0, y: 0, transition: { type: 'spring', stiffness: 420, damping: 34 } }
        }
      >
      <div
        ref={frameRef}
        role="dialog"
        aria-label={win.title}
        aria-modal={false}
        onPointerDown={() => focusWindow(win.id)}
        className={cn(
          'pointer-events-auto fixed flex flex-col overflow-hidden',
          !win.isFocused && 'opacity-95'
        )}
        style={{
          ...frameStyle,
          borderRadius: maximized ? 0 : 7,
          boxShadow: win.isFocused
            ? '0 18px 50px rgba(0,0,0,0.55), 0 0 0 1px rgba(0,120,215,0.55)'
            : '0 10px 30px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.12)',
        }}
      >
        <WindowChrome
          title={win.title}
          icon={<span aria-hidden="true">{win.icon}</span>}
          isActive={win.isFocused}
          isMaximized={win.isMaximized}
          showMinimize={!isMobile}
          onMinimize={handleMinimize}
          onMaximize={win.isResizable ? handleMaximize : undefined}
          onClose={handleClose}
          onPointerDown={beginDrag}
          onPointerMove={onDragMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onDoubleClick={handleTitleDoubleClick}
        >
          {children}
        </WindowChrome>

        {!maximized &&
          win.isResizable &&
          resizeHandles.map((h) => (
            <div
              key={h.dir}
              onPointerDown={(e) => beginResize(e, h.dir)}
              onPointerMove={onResizeMove}
              onPointerUp={endResize}
              onPointerCancel={endResize}
              className={cn('absolute z-20 touch-none', h.className)}
              style={{ cursor: h.cursor }}
              aria-hidden="true"
            />
          ))}
      </div>
      </motion.div>
    </>
  );
}

BaseWindow.displayName = 'BaseWindow';
