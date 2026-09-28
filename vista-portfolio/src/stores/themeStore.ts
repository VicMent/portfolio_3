import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ThemeState {
  /** 'dark' is the default Aero look; 'light' is the classic Vista frame. */
  scheme: 'dark' | 'light';
  accentColor: string;
  glassIntensity: number;
  animationsEnabled: boolean;
  reducedMotion: boolean;
  highContrast: boolean;
  soundEnabled: boolean;
  volume: number;
  toggleScheme: () => void;
  setScheme: (scheme: 'dark' | 'light') => void;
  setAccentColor: (color: string) => void;
  setGlassIntensity: (value: number) => void;
  setAnimationsEnabled: (value: boolean) => void;
  setReducedMotion: (value: boolean) => void;
  setHighContrast: (value: boolean) => void;
  setSoundEnabled: (value: boolean) => void;
  setVolume: (value: number) => void;
  resetToDefaults: () => void;
}

const DEFAULTS = {
  scheme: 'dark' as const,
  accentColor: '#0078d7',
  glassIntensity: 1,
  animationsEnabled: true,
  reducedMotion: false,
  highContrast: false,
  soundEnabled: true,
  volume: 0.4,
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      ...DEFAULTS,
      toggleScheme: () => set((s) => ({ scheme: s.scheme === 'dark' ? 'light' : 'dark' })),
      setScheme: (scheme) => set({ scheme }),
      setAccentColor: (accentColor) => set({ accentColor }),
      setGlassIntensity: (glassIntensity) =>
        set({ glassIntensity: clamp01(glassIntensity, 0, 2) }),
      setAnimationsEnabled: (animationsEnabled) => set({ animationsEnabled }),
      setReducedMotion: (reducedMotion) => set({ reducedMotion }),
      setHighContrast: (highContrast) => set({ highContrast }),
      setSoundEnabled: (soundEnabled) => set({ soundEnabled }),
      setVolume: (volume) => set({ volume: clamp01(volume, 0, 1) }),
      resetToDefaults: () => set({ ...DEFAULTS }),
    }),
    { name: 'vista-theme' }
  )
);

function clamp01(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
