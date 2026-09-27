import { useCallback, useEffect, useState } from 'react';
import { useWindowStore } from '../stores/windowStore';
import { useDesktopStore } from '../stores/desktopStore';

function isTypingTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  return /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) || el.isContentEditable;
}

/**
 * All desktop-wide keyboard shortcuts in one place.
 * Each listener is registered once for the lifetime of the app.
 */
export function useDesktopShortcuts() {
  const [flip3D, setFlip3D] = useState(false);

  const openWindow = useWindowStore((s) => s.openWindow);
  const showDesktop = useWindowStore((s) => s.showDesktop);
  const cascadeWindows = useWindowStore((s) => s.cascadeWindows);
  const tileWindows = useWindowStore((s) => s.tileWindows);
  const minimizeWindow = useWindowStore((s) => s.minimizeWindow);
  const toggleMaximize = useWindowStore((s) => s.toggleMaximize);
  const snapWindow = useWindowStore((s) => s.snapWindow);
  const focusedWindowId = useWindowStore((s) => s.focusedWindowId);
  const closeWindow = useWindowStore((s) => s.closeWindow);
  const windows = useWindowStore((s) => s.windows);

  const toggleFlip3D = useCallback(() => setFlip3D((v) => !v), []);
  const closeFlip3D = useCallback(() => setFlip3D(false), []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const focused = focusedWindowId ? windows[focusedWindowId] : null;

      // Win/Alt combinations -------------------------------------------------
      if ((e.metaKey || e.altKey) && !e.ctrlKey) {
        const key = e.key.toLowerCase();

        if (key === 'd') {
          e.preventDefault();
          showDesktop();
          return;
        }
        if (key === 'm') {
          e.preventDefault();
          showDesktop();
          return;
        }
        if (key === 's') {
          e.preventDefault();
          openWindow('settings');
          return;
        }
        if (key === 'r') {
          e.preventDefault();
          openWindow('run');
          return;
        }
        if (key === 'tab') {
          e.preventDefault();
          setFlip3D((v) => !v);
          return;
        }
        if (key === 'arrowup' && focused) {
          e.preventDefault();
          toggleMaximize(focused.id);
          return;
        }
        if (key === 'arrowdown' && focused) {
          e.preventDefault();
          focused.isMaximized ? toggleMaximize(focused.id) : minimizeWindow(focused.id);
          return;
        }
        if ((key === 'arrowleft' || key === 'arrowright') && focused) {
          e.preventDefault();
          snapWindow(focused.id, key === 'arrowleft' ? 'left' : 'right');
          return;
        }
        // Alt+1..7 jump to a taskbar slot.
        const slot = Number(key);
        if (!Number.isNaN(slot) && slot >= 1 && slot <= 7) {
          e.preventDefault();
          const open = Object.values(useWindowStore.getState().windows).filter(
            (w) => w.showInTaskbar && !w.isMinimized
          );
          const target = open[slot - 1];
          if (target) {
            useWindowStore.getState().focusWindow(target.id);
          }
          return;
        }
      }

      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'x') {
        e.preventDefault();
        cascadeWindows();
        return;
      }

      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 't') {
        e.preventDefault();
        tileWindows();
        return;
      }

      if (e.key === 'F4' && e.altKey && focused) {
        e.preventDefault();
        closeWindow(focused.id);
        return;
      }

      // Escape closes Flip 3D, otherwise blurs whatever has focus.
      if (e.key === 'Escape') {
        if (flip3D) {
          setFlip3D(false);
          return;
        }
        if (!isTypingTarget(e.target)) (document.activeElement as HTMLElement | null)?.blur?.();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    focusedWindowId,
    windows,
    flip3D,
    showDesktop,
    minimizeWindow,
    openWindow,
    closeWindow,
    toggleMaximize,
    snapWindow,
    cascadeWindows,
    tileWindows,
  ]);

  // Toggle Flip 3D off when there is nothing to switch between.
  useEffect(() => {
    const open = Object.values(windows).filter((w) => w.showInTaskbar && !w.isMinimized);
    if (open.length < 2 && flip3D) setFlip3D(false);
  }, [windows, flip3D]);

  useEffect(() => {
    if (isTypingTarget(document.activeElement)) useDesktopStore.getState().deselectAll();
  }, [windows]);

  return { flip3D, toggleFlip3D, closeFlip3D };
}
