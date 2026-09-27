import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ThemeState {
  accentColor: string;
  glassIntensity: number;
  animationsEnabled: boolean;
  reducedMotion: boolean;
  highContrast: boolean;
  soundEnabled: boolean;
  volume: number;
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
