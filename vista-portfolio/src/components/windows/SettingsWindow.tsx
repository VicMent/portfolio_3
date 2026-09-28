import { useState } from 'react';
import { AppWindow } from './AppWindow';
import { useThemeStore } from '../../stores/themeStore';

const ACCENTS = [
  { name: 'Aero Blue', value: '#0078d7' },
  { name: 'Royal Purple', value: '#6a3fb5' },
  { name: 'Graphite', value: '#4a5568' },
  { name: 'Sea Green', value: '#0f9b8e' },
  { name: 'Ember', value: '#d1462f' },
  { name: 'Sunset', value: '#e08a1e' },
];

export function SettingsWindow() {
  const {
    accentColor,
    glassIntensity,
    animationsEnabled,
    soundEnabled,
    volume,
    setAccentColor,
    setGlassIntensity,
    setAnimationsEnabled,
    setSoundEnabled,
    setVolume,
    resetToDefaults,
  } = useThemeStore();

  const [section, setSection] = useState<'appearance' | 'sound' | 'accessibility'>('appearance');

  const Row = ({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) => (
    <div className="flex items-center justify-between gap-6 py-3 border-b border-[var(--glass-border)] last:border-b-0">
      <div className="min-w-0">
        <p className="text-sm font-medium text-[var(--text-primary)]">{label}</p>
        {hint && <p className="text-xs text-[var(--text-muted)] mt-0.5">{hint}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );

  const Toggle = ({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) => (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className="relative w-12 h-6 rounded-full transition-colors"
      style={{
        background: checked
          ? 'linear-gradient(180deg, var(--aero-blue), var(--aero-blue-dark))'
          : 'rgba(0,0,0,0.35)',
        border: '1px solid var(--glass-border)',
      }}
    >
      <span
        className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform"
        style={{ transform: `translateX(${checked ? 22 : 2}px)` }}
      />
    </button>
  );

  return (
    <AppWindow>
      <div className="flex h-full">
        <nav className="w-44 shrink-0 border-r border-[var(--glass-border)] bg-black/20 p-2">
          {([
            { id: 'appearance', label: 'Appearance', icon: '🎨' },
            { id: 'sound', label: 'Sound', icon: '🔊' },
            { id: 'accessibility', label: 'Accessibility', icon: '♿' },
          ] as const).map((item) => (
            <button
              key={item.id}
              onClick={() => setSection(item.id)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm transition-colors ${
                section === item.id
                  ? 'bg-[var(--selection-blue)] border border-[var(--aero-blue)] text-[var(--text-primary)]'
                  : 'text-[var(--text-secondary)] hover:bg-white/10'
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
          <button
            onClick={resetToDefaults}
            className="w-full mt-4 px-3 py-2 rounded-lg text-left text-sm text-[var(--text-secondary)] hover:bg-white/10 transition-colors"
          >
            ↺ Reset to defaults
          </button>
        </nav>

        <div className="flex-1 p-6 overflow-y-auto">
          {section === 'appearance' && (
            <div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">Appearance</h3>
              <p className="text-sm text-[var(--text-muted)] mb-4">Personalise the Aero look.</p>

              <div className="aero-surface rounded-xl px-5">
                <div className="py-4">
                  <p className="text-sm font-medium text-[var(--text-primary)] mb-3">Accent colour</p>
                  <div className="flex flex-wrap gap-2">
                    {ACCENTS.map((accent) => (
                      <button
                        key={accent.value}
                        onClick={() => setAccentColor(accent.value)}
                        title={accent.name}
                        aria-label={accent.name}
                        className="w-9 h-9 rounded-lg border-2 transition-transform hover:scale-110"
                        style={{
                          background: accent.value,
                          borderColor: accentColor === accent.value ? '#fff' : 'transparent',
                        }}
                      />
                    ))}
                  </div>
                </div>

                <Row label="Glass intensity" hint="How blurry and saturated window surfaces look">
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={0}
                      max={2}
                      step={0.1}
                      value={glassIntensity}
                      onChange={(e) => setGlassIntensity(Number(e.target.value))}
                      className="w-36 accent-[var(--aero-blue)]"
                      aria-label="Glass intensity"
                    />
                    <span className="text-xs text-[var(--text-muted)] w-8 text-right">
                      {glassIntensity.toFixed(1)}
                    </span>
                  </div>
                </Row>
              </div>
            </div>
          )}

          {section === 'sound' && (
            <div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">Sound</h3>
              <p className="text-sm text-[var(--text-muted)] mb-4">
                System sounds are generated in the browser — no audio files to download.
              </p>
              <div className="aero-surface rounded-xl px-5">
                <Row label="System sounds" hint="Startup, open, close and click feedback">
                  <Toggle checked={soundEnabled} onChange={setSoundEnabled} label="System sounds" />
                </Row>
                <Row label="Volume">
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={volume}
                      disabled={!soundEnabled}
                      onChange={(e) => setVolume(Number(e.target.value))}
                      className="w-36 accent-[var(--aero-blue)] disabled:opacity-40"
                      aria-label="Volume"
                    />
                    <span className="text-xs text-[var(--text-muted)] w-8 text-right">
                      {Math.round(volume * 100)}%
                    </span>
                  </div>
                </Row>
              </div>
            </div>
          )}

          {section === 'accessibility' && (
            <div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">Accessibility</h3>
              <p className="text-sm text-[var(--text-muted)] mb-4">
                Your system&apos;s reduced-motion preference is respected automatically.
              </p>
              <div className="aero-surface rounded-xl px-5">
                <Row label="Animations" hint="Window transitions, glows and ambient motion">
                  <Toggle checked={animationsEnabled} onChange={setAnimationsEnabled} label="Animations" />
                </Row>
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-4 leading-relaxed">
                Tip: press <kbd className="px-1.5 py-0.5 rounded aero-surface text-[11px]">Alt</kbd> +{' '}
                <kbd className="px-1.5 py-0.5 rounded aero-surface text-[11px]">S</kbd> to open
                Settings from anywhere.
              </p>
            </div>
          )}
        </div>
      </div>
    </AppWindow>
  );
}
