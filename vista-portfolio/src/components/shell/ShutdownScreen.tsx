import { useState } from 'react';
import { playStartupSound } from '../../utils/sound';
import { WindowsLogo } from '../vista/BrandIcons';
import { AuroraText } from '../magicui/AuroraText';

/**
 * The payoff for pressing Shut down: the real "It's now safe to turn off
 * your computer" screen, with a working power-on and restart.
 */
export function ShutdownScreen({
  mode,
  onPowerOn,
  onRestart,
}: {
  mode: 'off' | 'restart';
  onPowerOn?: () => void;
  onRestart?: () => void;
}) {
  const [done, setDone] = useState(false);

  return (
    <div className="fixed inset-0 z-[9800] flex flex-col items-center justify-center bg-black px-6 text-center">
      <div className="relative mb-9 h-16 w-16">
        <span className="absolute inset-0 rounded-full border-2 border-white/10" />
        <span className="absolute inset-0 animate-spin-slow rounded-full border-2 border-transparent border-t-[var(--aero-blue)]" />
        <span className="absolute inset-0 flex items-center justify-center">
          <WindowsLogo className="h-8 w-8 text-[var(--aero-blue)]" />
        </span>
      </div>

      {mode === 'off' && !done ? (
        <>
          <AuroraText className="block text-2xl font-semibold tracking-tight">
            It&apos;s now safe to turn off your computer.
          </AuroraText>
          <p className="mt-3 max-w-sm text-sm text-gray-400">
            This desktop is a portfolio, not a real machine — press the button to boot it back up.
          </p>
          <button
            type="button"
            onClick={() => {
              setDone(true);
              playStartupSound();
              onPowerOn?.();
            }}
            className="aero-button-primary mt-8 rounded-lg px-6 py-3 text-sm"
          >
            Turn on
          </button>
        </>
      ) : mode === 'restart' && !done ? (
        <>
          <p className="text-lg text-white">Restarting&hellip;</p>
          <p className="mt-2 text-sm text-gray-400">One moment while we reload the desktop.</p>
        </>
      ) : (
        <p className="text-sm text-gray-500">Welcome back.</p>
      )}
    </div>
  );
}
