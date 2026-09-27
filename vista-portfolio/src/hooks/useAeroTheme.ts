import { useEffect } from 'react';
import { useThemeStore } from '../stores/themeStore';
import { setMasterVolume, setSoundEnabled } from '../utils/sound';

const ACCENT_SWATCHES = ['#0078d7', '#6a3fb5', '#4a5568', '#0f9b8e', '#d1462f', '#e08a1e'];

/** Pushes theme state into CSS custom properties and the audio engine. */
export function useAeroTheme() {
  const accentColor = useThemeStore((s) => s.accentColor);
  const glassIntensity = useThemeStore((s) => s.glassIntensity);
  const animationsEnabled = useThemeStore((s) => s.animationsEnabled);
  const reducedMotion = useThemeStore((s) => s.reducedMotion);
  const highContrast = useThemeStore((s) => s.highContrast);
  const soundEnabled = useThemeStore((s) => s.soundEnabled);
  const volume = useThemeStore((s) => s.volume);

  useEffect(() => {
    const root = document.documentElement;
    const hex = accentColor.replace('#', '');
    const r = parseInt(hex.slice(0, 2), 16) || 0;
    const g = parseInt(hex.slice(2, 4), 16) || 0;
    const b = parseInt(hex.slice(4, 6), 16) || 0;

    root.style.setProperty('--aero-blue', accentColor);
    root.style.setProperty('--aero-blue-dark', `rgb(${Math.round(r * 0.65)} ${Math.round(g * 0.65)} ${Math.round(b * 0.7)})`);
    root.style.setProperty('--aero-blue-light', `rgb(${Math.min(255, r + 70)} ${Math.min(255, g + 70)} ${Math.min(255, b + 70)})`);
    root.style.setProperty('--aero-glow', `rgba(${r},${g},${b},0.4)`);
    root.style.setProperty('--aero-glow-strong', `rgba(${r},${g},${b},0.75)`);
    root.style.setProperty('--window-active-border', `rgba(${r},${g},${b},0.65)`);
    root.style.setProperty('--selection-blue', `rgba(${r},${g},${b},0.32)`);
  }, [accentColor]);

  useEffect(() => {
    const blur = 8 + glassIntensity * 12;
    const saturate = 140 + glassIntensity * 40;
    document.documentElement.style.setProperty('--glass-blur', `blur(${blur}px) saturate(${saturate}%)`);
  }, [glassIntensity]);

  useEffect(() => {
    const root = document.documentElement;
    const off = !animationsEnabled || reducedMotion;
    root.style.setProperty('--dur-fast', off ? '0.01ms' : '140ms');
    root.style.setProperty('--dur-base', off ? '0.01ms' : '220ms');
    root.style.setProperty('--dur-slow', off ? '0.01ms' : '360ms');
    root.classList.toggle('reduce-motion', off);
  }, [animationsEnabled, reducedMotion]);

  useEffect(() => {
    document.documentElement.classList.toggle('high-contrast', highContrast);
  }, [highContrast]);

  useEffect(() => {
    setSoundEnabled(soundEnabled);
  }, [soundEnabled]);

  useEffect(() => {
    setMasterVolume(volume);
  }, [volume]);

  // Respect the OS preference unless the user has explicitly overridden it.
  useEffect(() => {
    const setReducedMotion = useThemeStore.getState().setReducedMotion;
    const setHighContrast = useThemeStore.getState().setHighContrast;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const contrast = window.matchMedia('(prefers-contrast: more)');

    const apply = () => {
      setReducedMotion(motion.matches);
      setHighContrast(contrast.matches);
    };
    apply();
    motion.addEventListener('change', apply);
    contrast.addEventListener('change', apply);
    return () => {
      motion.removeEventListener('change', apply);
      contrast.removeEventListener('change', apply);
    };
  }, []);
}

export { ACCENT_SWATCHES };
