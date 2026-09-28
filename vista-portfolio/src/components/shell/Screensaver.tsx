import { useEffect } from 'react';
import { playNotifySound } from '../../utils/sound';

/**
 * Idle screensaver: the 3D turntable spin from the source renders, full bleed.
 * Any interaction dismisses it.
 */
export function Screensaver({ onDismiss }: { onDismiss: () => void }) {
  useEffect(() => {
    playNotifySound();
    const onActivity = () => onDismiss();
    const events: Array<keyof WindowEventMap> = ['pointerdown', 'keydown', 'wheel', 'touchstart'];
    for (const event of events) window.addEventListener(event, onActivity, { passive: true });
    return () => {
      for (const event of events) window.removeEventListener(event, onActivity);
    };
  }, [onDismiss]);

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-[9700] cursor-none overflow-hidden bg-[#1c1c1c]"
      onDoubleClick={onDismiss}
    >
      <video
        className="h-full w-full object-cover"
        poster="/media/turntable-poster.jpg"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        onMouseMove={onDismiss}
      >
        <source src="/media/turntable.webm" type="video/webm" />
        <source src="/media/turntable.mp4" type="video/mp4" />
      </video>

      {/* Corner ticks, like a real screensaver overlay */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-6">
        {(
          [
            'left-0 top-0 border-l-2 border-t-2',
            'right-0 top-0 border-r-2 border-t-2',
            'left-0 bottom-0 border-b-2 border-l-2',
            'right-0 bottom-0 border-b-2 border-r-2',
          ] as const
        ).map((pos) => (
          <span key={pos} className={`absolute h-8 w-8 border-white/25 ${pos}`} />
        ))}
      </div>

      <p className="pointer-events-none absolute inset-x-0 bottom-10 text-center font-mono text-[11px] tracking-[0.3em] text-white/40 uppercase">
        Move to dismiss
      </p>
    </div>
  );
}
