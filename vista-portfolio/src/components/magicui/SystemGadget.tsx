import { useEffect, useState } from 'react';

interface Reading {
  id: string;
  label: string;
  value: number;
  unit: string;
  color: string;
}

const BASE: Reading[] = [
  { id: 'cpu', label: 'CPU', value: 18, unit: '%', color: '#7cc98d' },
  { id: 'ram', label: 'Memory', value: 46, unit: '%', color: '#61dafb' },
  { id: 'gpu', label: 'GPU', value: 12, unit: '%', color: '#e0a35c' },
];

function jitter(base: number, spread: number) {
  return Math.max(2, Math.min(98, base + (Math.random() - 0.5) * spread));
}

export function SystemGadget({ compact = true }: { compact?: boolean }) {
  const [readings, setReadings] = useState<Reading[]>(BASE);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (reduced.matches) return;

    const id = setInterval(() => {
      setReadings((prev) =>
        prev.map((r) => ({ ...r, value: jitter(r.value, r.id === 'ram' ? 8 : 16) }))
      );
    }, 2200);

    return () => clearInterval(id);
  }, []);

  return (
    <div className="space-y-2">
      {readings.map((r) => (
        <div key={r.id}>
          <div className="mb-0.5 flex items-baseline justify-between">
            <span className="text-[10.5px] text-white/70">{r.label}</span>
            <span className="font-mono text-[10.5px] font-semibold" style={{ color: r.color }}>
              {Math.round(r.value)}
              {r.unit}
            </span>
          </div>
          <div
            className="h-1.5 overflow-hidden rounded-full bg-black/40"
            role="meter"
            aria-valuenow={Math.round(r.value)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={r.label}
          >
            <div
              className="h-full rounded-full transition-[width] duration-700 ease-out"
              style={{ width: `${r.value}%`, background: r.color }}
            />
          </div>
        </div>
      ))}

      {compact && (
        <p className="pt-0.5 text-[10px] text-white/40">
          {Object.keys(window.navigator).length > 0 ? 'Simulated load' : ''}
        </p>
      )}
    </div>
  );
}
