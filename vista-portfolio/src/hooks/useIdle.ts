import { useEffect, useRef, useState } from 'react';

/**
 * Reports user inactivity. Pass 0 to disable.
 * Any pointer, key, wheel or touch activity resets the timer.
 */
export function useIdle(delayMs: number) {
  const [idle, setIdle] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!delayMs) {
      setIdle(false);
      return;
    }

    const reset = () => {
      setIdle(false);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setIdle(true), delayMs);
    };

    reset();
    const events: Array<keyof WindowEventMap> = [
      'pointermove',
      'pointerdown',
      'keydown',
      'wheel',
      'touchstart',
    ];
    for (const event of events) window.addEventListener(event, reset, { passive: true });

    return () => {
      window.clearTimeout(timer.current);
      for (const event of events) window.removeEventListener(event, reset);
    };
  }, [delayMs]);

  return idle;
}
