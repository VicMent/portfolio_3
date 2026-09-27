import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DesktopIcon, Gadget } from '../data/types';
import { desktopIcons, sidebarGadgets } from '../data/portfolio';

const GRID = 92;
const EDGE = 12;

interface DesktopStore {
  icons: DesktopIcon[];
  wallpaper: string;
  sidebarOpen: boolean;
  gadgets: Gadget[];
  setIcons: (icons: DesktopIcon[]) => void;
  selectIcon: (id: string, multi?: boolean) => void;
  deselectAll: () => void;
  updateIconPosition: (id: string, position: { x: number; y: number }) => void;
  arrangeIcons: () => void;
  setWallpaper: (wallpaper: string) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

export const useDesktopStore = create<DesktopStore>()(
  persist(
    (set, get) => ({
      icons: desktopIcons,
      wallpaper: '/vista.jpg',
      sidebarOpen: true,
      gadgets: sidebarGadgets,

      setIcons: (icons) => set({ icons }),

      selectIcon: (id, multi = false) =>
        set((state) => ({
          icons: state.icons.map((icon) =>
            icon.id === id
              ? { ...icon, isSelected: !multi ? true : !icon.isSelected }
              : multi
                ? icon
                : { ...icon, isSelected: false }
          ),
        })),

      deselectAll: () =>
        set((state) => ({
          icons: state.icons.map((icon) => (icon.isSelected ? { ...icon, isSelected: false } : icon)),
        })),

      updateIconPosition: (id, position) =>
        set((state) => ({
          icons: state.icons.map((icon) => (icon.id === id ? { ...icon, position } : icon)),
        })),

      arrangeIcons: () => {
        const { icons } = get();
        const maxX = window.innerWidth - GRID - EDGE;
        const maxY = window.innerHeight - 48 - GRID - EDGE;
        const perColumn = Math.max(1, Math.floor((maxY - EDGE) / GRID) + 1);
        set({
          icons: icons.map((icon, i) => {
            const col = Math.floor(i / perColumn);
            const row = i % perColumn;
            return {
              ...icon,
              position: {
                x: Math.min(EDGE + col * GRID, maxX),
                y: Math.min(EDGE + row * GRID, maxY),
              },
            };
          }),
        });
      },

      setWallpaper: (wallpaper) => set({ wallpaper }),

      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
    }),
    {
      name: 'vista-desktop',
      partialize: (state) => ({
        icons: state.icons.map(({ isSelected: _omit, ...icon }) => icon),
        wallpaper: state.wallpaper,
        sidebarOpen: state.sidebarOpen,
      }),
      merge: (persisted, current) => {
        const p = persisted as Partial<DesktopStore> | undefined;
        return {
          ...current,
          ...p,
          // Selection is never restored from storage.
          icons: (p?.icons ?? current.icons).map((i) => ({ ...i, isSelected: false })),
        };
      },
    }
  )
);
