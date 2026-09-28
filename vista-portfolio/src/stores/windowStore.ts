import { create } from 'zustand';
import type { WindowState } from '../data/types';
import { getAppMeta } from '../data/appMeta';
import { useDesktopStore } from './desktopStore';

export const TASKBAR_HEIGHT = 48;
export const SIDEBAR_WIDTH = 244;

interface OpenOverrides {
  title?: string;
  position?: { x: number; y: number };
  size?: { width: number; height: number };
  props?: Record<string, unknown>;
}

interface WindowStore {
  windows: Record<string, WindowState>;
  order: string[];
  focusedWindowId: string | null;
  /** Windows mid exit-animation; removed from `windows` a moment later. */
  closingIds: string[];
  zCounter: number;

  openWindow: (appId: string, overrides?: OpenOverrides) => string;
  closeWindow: (id: string) => void;
  finalizeClose: (id: string) => void;
  closeAll: () => void;
  minimizeWindow: (id: string) => void;
  toggleMaximize: (id: string) => void;
  restoreWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  moveWindow: (id: string, position: { x: number; y: number }) => void;
  resizeWindow: (id: string, size: { width: number; height: number }, position?: { x: number; y: number }) => void;
  snapWindow: (id: string, edge: 'left' | 'right' | 'maximize') => void;
  showDesktop: () => void;
  cascadeWindows: () => void;
  tileWindows: () => void;
}

function viewport() {
  if (typeof window === 'undefined') return { w: 1440, h: 900 };
  // Treat the gadget rail as reserved space so windows never end up stranded
  // underneath it (where their resize edges would be unreachable).
  const reserved = useDesktopStore.getState().sidebarOpen ? SIDEBAR_WIDTH : 0;
  return {
    w: Math.max(320, window.innerWidth - reserved),
    h: window.innerHeight - TASKBAR_HEIGHT,
  };
}

/** Keep at least this much of the title bar reachable on screen. */
const KEEP_VISIBLE = 120;

function clampToViewport(
  pos: { x: number; y: number },
  size: { width: number; height: number }
): { x: number; y: number } {
  const { w, h } = viewport();
  return {
    x: Math.round(Math.min(Math.max(pos.x, -size.width + KEEP_VISIBLE), w - KEEP_VISIBLE)),
    y: Math.round(Math.min(Math.max(pos.y, 0), h - 32)),
  };
}

function clampSize(
  size: { width: number; height: number },
  min: { width: number; height: number }
): { width: number; height: number } {
  const { w, h } = viewport();
  return {
    width: Math.round(Math.max(min.width, Math.min(size.width, w))),
    height: Math.round(Math.max(min.height, Math.min(size.height, h))),
  };
}

/** Cascade new windows so they never land exactly on top of each other. */
function nextCascadePosition(index: number, size: { width: number; height: number }) {
  const { w, h } = viewport();
  const step = 28;
  const maxSteps = 6;
  const slot = index % maxSteps;
  const baseX = Math.round((w - size.width) / 2);
  const baseY = Math.round((h - size.height) / 2);
  return clampToViewport(
    {
      x: baseX + slot * step - (maxSteps / 2) * step,
      y: Math.max(0, baseY + slot * step - (maxSteps / 2) * step),
    },
    size
  );
}

export const useWindowStore = create<WindowStore>()((set, get) => ({
  windows: {},
  order: [],
  focusedWindowId: null,
  closingIds: [],
  // Windows use inline z-index values, so this counter must sit above the
  // static stacking of the shell (desktop 0, sidebar 20, handles 70).
  zCounter: 100,

  openWindow: (appId, overrides = {}) => {
    const app = getAppMeta(appId);
    if (!app) {
      console.warn(`[windowStore] Unknown app id: "${appId}"`);
      return '';
    }

    const existingId = Object.values(get().windows).find((w) => w.appId === appId)?.id;

    // Already open → just focus it (and un-minimize).
    if (existingId) {
      const win = get().windows[existingId];
      if (win.isMinimized || !win.isFocused) get().restoreWindow(existingId);
      else get().focusWindow(existingId);
      return existingId;
    }

    const { w, h } = viewport();
    const minSize = {
      width: Math.min(app.minSize?.width ?? 400, w),
      height: Math.min(app.minSize?.height ?? 300, h),
    };
    const requested = app.size ?? { width: 800, height: 600 };
    const size = {
      width: Math.min(requested.width, w),
      height: Math.min(requested.height, h),
    };

    const id = appId;
    const position = overrides.position
      ? clampToViewport(overrides.position, size)
      : nextCascadePosition(Object.keys(get().windows).length, size);

    const zCounter = get().zCounter + 1;

    const newWindow: WindowState = {
      id,
      appId,
      title: overrides.title ?? app.title,
      type: app.type ?? 'app',
      icon: app.icon,
      position,
      size,
      isMinimized: false,
      isMaximized: false,
      isFocused: true,
      zIndex: zCounter,
      isResizable: app.resizable !== false,
      isMovable: true,
      showInTaskbar: app.showInTaskbar !== false,
      minWidth: minSize.width,
      minHeight: minSize.height,
      props: overrides.props,
    };

    set((state) => {
      const windows = { ...state.windows };
      // Only one window is focused at a time.
      for (const key of Object.keys(windows)) {
        windows[key] = { ...windows[key], isFocused: false };
      }
      windows[id] = newWindow;
      return {
        windows,
        order: [...state.order, id],
        focusedWindowId: id,
        zCounter,
        // Re-opening mid-close should cancel the pending exit.
        closingIds: state.closingIds.filter((w) => w !== id),
      };
    });

    return id;
  },

  /**
   * Mark a window as closing. It stays mounted (so it can animate out) and is
   * dropped by `finalizeClose` once the exit transition has finished.
   */
  closeWindow: (id) =>
    set((state) => {
      if (!state.windows[id] || state.closingIds.includes(id)) return state;
      return { closingIds: [...state.closingIds, id] };
    }),

  finalizeClose: (id) =>
    set((state) => {
      if (!state.windows[id]) return state;
      const windows = { ...state.windows };
      delete windows[id];
      const order = state.order.filter((w) => w !== id);

      const stillFocused = state.focusedWindowId && windows[state.focusedWindowId];
      const focusedWindowId = stillFocused
        ? state.focusedWindowId
        : order
            .map((wid) => windows[wid])
            .filter((w) => w && !w.isMinimized)
            .sort((a, b) => b.zIndex - a.zIndex)[0]?.id ?? null;

      if (focusedWindowId && windows[focusedWindowId]) {
        windows[focusedWindowId] = { ...windows[focusedWindowId], isFocused: true };
      }

      return {
        windows,
        order,
        focusedWindowId,
        closingIds: state.closingIds.filter((w) => w !== id),
      };
    }),

  closeAll: () => set({ windows: {}, order: [], focusedWindowId: null, closingIds: [] }),

  minimizeWindow: (id) =>
    set((state) => {
      const win = state.windows[id];
      if (!win || win.isMinimized) return state;
      const windows = { ...state.windows, [id]: { ...win, isMinimized: true, isFocused: false } };
      const focusedWindowId =
        state.order
          .map((wid) => windows[wid])
          .filter((w) => w && !w.isMinimized && w.id !== id)
          .sort((a, b) => b.zIndex - a.zIndex)[0]?.id ?? null;
      if (focusedWindowId) {
        windows[focusedWindowId] = { ...windows[focusedWindowId], isFocused: true };
      }
      return { windows, focusedWindowId };
    }),

  toggleMaximize: (id) =>
    set((state) => {
      const win = state.windows[id];
      if (!win || !win.isResizable) return state;
      const windows = { ...state.windows };

      if (win.isMaximized) {
        const size = win.restoreSize ?? { width: 900, height: 620 };
        windows[id] = {
          ...win,
          isMaximized: false,
          size: clampSize(size, { width: win.minWidth, height: win.minHeight }),
          position: clampToViewport(win.position, size),
        };
      } else {
        windows[id] = {
          ...win,
          isMaximized: true,
          restoreSize: { ...win.size },
          position: { x: 0, y: 0 },
          size: { width: viewport().w, height: viewport().h },
        };
      }
      return { windows };
    }),

  restoreWindow: (id) => {
    const zCounter = get().zCounter + 1;
    set((state) => {
      const win = state.windows[id];
      if (!win) return state;
      const windows = { ...state.windows };
      for (const key of Object.keys(windows)) {
        windows[key] = { ...windows[key], isFocused: key === id };
      }
      windows[id] = { ...win, isMinimized: false, isFocused: true, zIndex: zCounter };
      return { windows, focusedWindowId: id, zCounter };
    });
  },

  /**
   * Raise a window. Minimized windows are restored rather than ignored —
   * `focusWindow` deliberately no-ops on them, so callers restoring from the
   * taskbar must come through here.
   */
  focusWindow: (id) => {
    const win = get().windows[id];
    if (!win) return;
    if (win.isMinimized) {
      get().restoreWindow(id);
      return;
    }
    // No-op if already focused and on top — avoids pointless re-renders.
    if (win.isFocused && win.zIndex === get().zCounter) return;
    const zCounter = get().zCounter + 1;
    set((state) => {
      const windows = { ...state.windows };
      for (const key of Object.keys(windows)) {
        windows[key] = { ...windows[key], isFocused: key === id };
      }
      windows[id] = { ...windows[id], zIndex: zCounter };
      return { windows, focusedWindowId: id, zCounter };
    });
  },

  moveWindow: (id, position) =>
    set((state) => {
      const win = state.windows[id];
      if (!win || !win.isMovable || win.isMaximized) return state;
      return {
        windows: {
          ...state.windows,
          [id]: { ...win, position: clampToViewport(position, win.size) },
        },
      };
    }),

  resizeWindow: (id, size, position) =>
    set((state) => {
      const win = state.windows[id];
      if (!win || !win.isResizable || win.isMaximized) return state;

      const nextSize = clampSize(size, { width: win.minWidth, height: win.minHeight });
      const nextPos = position
        ? clampToViewport(position, nextSize)
        : clampToViewport(win.position, nextSize);

      return {
        windows: {
          ...state.windows,
          [id]: { ...win, size: nextSize, position: nextPos },
        },
      };
    }),

  snapWindow: (id, edge) => {
    const { w, h } = viewport();
    set((state) => {
      const win = state.windows[id];
      if (!win) return state;
      const half = { width: Math.round(w / 2), height: h };
      const full = { width: w, height: h };

      const windows = { ...state.windows };
      if (edge === 'maximize') {
        windows[id] = {
          ...win,
          isMaximized: true,
          restoreSize: win.restoreSize ?? { ...win.size },
          position: { x: 0, y: 0 },
          size: full,
        };
      } else {
        windows[id] = {
          ...win,
          isMaximized: false,
          size: clampSize(half, { width: win.minWidth, height: win.minHeight }),
          position: edge === 'left' ? { x: 0, y: 0 } : { x: w - Math.round(w / 2), y: 0 },
        };
      }
      return { windows };
    });
  },

  showDesktop: () =>
    set((state) => {
      const windows = { ...state.windows };
      for (const key of Object.keys(windows)) {
        windows[key] = {
          ...windows[key],
          isMinimized: windows[key].isMinimized ? false : true,
        };
      }
      return { windows, focusedWindowId: null };
    }),

  cascadeWindows: () =>
    set((state) => {
      const windows = { ...state.windows };
      const visible = state.order
        .map((id) => windows[id])
        .filter((w): w is WindowState => Boolean(w) && !w.isMinimized);
      if (!visible.length) return state;

      visible.forEach((win, i) => {
        windows[win.id] = {
          ...win,
          isMaximized: false,
          position: clampToViewport(
            { x: 60 + i * 30, y: 40 + i * 30 },
            win.restoreSize ?? win.size
          ),
        };
      });
      return { windows };
    }),

  tileWindows: () =>
    set((state) => {
      const windows = { ...state.windows };
      const visible = state.order
        .map((id) => windows[id])
        .filter((w): w is WindowState => Boolean(w) && !w.isMinimized);
      if (!visible.length) return state;

      const { w, h } = viewport();
      const cols = Math.ceil(Math.sqrt(visible.length));
      const rows = Math.ceil(visible.length / cols);

      visible.forEach((win, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        windows[win.id] = {
          ...win,
          isMaximized: false,
          position: { x: Math.floor((col * w) / cols), y: Math.floor((row * h) / rows) },
          size: {
            width: Math.floor(w / cols),
            height: Math.floor(h / rows),
          },
        };
      });
      return { windows };
    }),
}));

/** Convenience selectors */
export const getUsableViewport = viewport;

export const selectVisibleWindows = (state: WindowStore): WindowState[] =>
  state.order.map((id) => state.windows[id]).filter((w): w is WindowState => Boolean(w));
