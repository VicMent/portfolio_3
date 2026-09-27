import { useEffect, useRef, useState } from 'react';
import { cn } from '../../utils/helpers';
import { useWindowStore, TASKBAR_HEIGHT } from '../../stores/windowStore';
import { playClickSound, playOpenSound } from '../../utils/sound';
import { X, Minus, Square, ChevronLeft, ChevronRight } from 'lucide-react';

const STEP = 132;
const DEPTH = 55;
const ROT = 26;

export function Flip3D({ onClose }: { onClose: () => void }) {
  const windows = useWindowStore((s) => s.windows);
  const order = useWindowStore((s) => s.order);
  const focusWindow = useWindowStore((s) => s.focusWindow);
  const minimizeWindow = useWindowStore((s) => s.minimizeWindow);
  const closeWindow = useWindowStore((s) => s.closeWindow);
  const [index, setIndex] = useState(0);
  const indexRef = useRef(0);

  const cards = order
    .map((id) => windows[id])
    .filter((w): w is NonNullable<typeof w> => Boolean(w) && w.showInTaskbar && !w.isMinimized)
    .sort((a, b) => b.zIndex - a.zIndex);

  useEffect(() => {
    if (index >= cards.length) setIndex(Math.max(0, cards.length - 1));
  }, [cards.length, index]);

  useEffect(() => {
    indexRef.current = index;
  }, [index]);

  const step = (delta: number) => {
    if (!cards.length) return;
    setIndex((i) => (i + delta + cards.length) % cards.length);
  };

  const commit = (i: number) => {
    const card = cards[i];
    if (card) {
      playOpenSound();
      focusWindow(card.id);
    }
    onClose();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        step(e.shiftKey ? -1 : 1);
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        step(1);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        step(-1);
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        commit(indexRef.current);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [cards, onClose]);

  if (!cards.length) return null;

  return (
    <div
      role="dialog"
      aria-label="Flip 3D window switcher"
      className="fixed inset-0 z-[9000] flex items-center justify-center"
      style={{ background: 'radial-gradient(ellipse at center, rgba(0,90,160,0.35) 0%, rgba(0,0,0,0.85) 70%)' }}
      onClick={onClose}
    >
      <div
        className="relative flex h-[420px] w-[560px] items-center justify-center"
        style={{ perspective: '1400px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {cards.map((win, i) => {
          const offset = i - index;
          const abs = Math.abs(offset);
          if (abs > 4) return null;

          const transform = `translateX(${offset * STEP}px) translateZ(${-abs * DEPTH}px) rotateY(${-offset * ROT}deg) scale(${1 - abs * 0.04})`;

          return (
            <button
              key={win.id}
              type="button"
              onClick={() => commit(i)}
              className={cn(
                'absolute w-[380px] overflow-hidden rounded-lg text-left transition-transform duration-300 ease-out',
                'border shadow-2xl backdrop-blur-xl',
                offset === 0
                  ? 'border-[var(--aero-blue)] shadow-[0_0_40px_var(--aero-glow-strong)]'
                  : 'border-white/20'
              )}
              style={{
                transform,
                zIndex: 50 - abs,
                opacity: offset === 0 ? 1 : 0.8,
              }}
            >
              <div className="flex h-8 items-center gap-2 bg-[linear-gradient(180deg,rgba(120,180,235,0.95),rgba(20,85,150,0.95))] px-2">
                <span aria-hidden="true" className="text-[12px]">{win.icon}</span>
                <span className="truncate text-[12px] font-semibold text-white">{win.title}</span>
                <span className="ml-auto flex items-center gap-1">
                  <span
                    role="button"
                    tabIndex={-1}
                    aria-hidden="true"
                    onClick={(e) => { e.stopPropagation(); playClickSound(); minimizeWindow(win.id); }}
                    className="flex h-4 w-4 items-center justify-center rounded text-white/90 hover:bg-white/25"
                  >
                    <Minus size={9} />
                  </span>
                  <span
                    role="button"
                    tabIndex={-1}
                    aria-hidden="true"
                    onClick={(e) => { e.stopPropagation(); playClickSound(); closeWindow(win.id); }}
                    className="flex h-4 w-4 items-center justify-center rounded text-white/90 hover:bg-[#e81123]"
                  >
                    <X size={9} />
                  </span>
                </span>
              </div>

              <div className="flex h-[300px] flex-col items-center justify-center gap-3 bg-[#0b1420]/95 backdrop-blur-md">
                <span aria-hidden="true" className="text-6xl">{win.icon}</span>
                <p className="px-6 text-center text-sm font-medium text-white">{win.title}</p>
                <p className="text-[11px] text-white/50">
                  {i + 1} of {cards.length} · Enter to open
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Arrows */}
      <button
        type="button"
        aria-label="Previous window"
        onClick={(e) => { e.stopPropagation(); step(-1); }}
        className="absolute left-6 flex h-11 w-11 items-center justify-center rounded-full aero-glass text-white transition-colors hover:bg-white/15"
      >
        <ChevronLeft size={22} />
      </button>
      <button
        type="button"
        aria-label="Next window"
        onClick={(e) => { e.stopPropagation(); step(1); }}
        className="absolute right-6 flex h-11 w-11 items-center justify-center rounded-full aero-glass text-white transition-colors hover:bg-white/15"
      >
        <ChevronRight size={22} />
      </button>

      <div
        className="absolute flex items-center gap-2 text-xs text-white/70"
        style={{ bottom: TASKBAR_HEIGHT + 20 }}
      >
        <kbd className="rounded bg-white/10 px-1.5 py-0.5">Tab</kbd> cycle
        <kbd className="rounded bg-white/10 px-1.5 py-0.5">Enter</kbd> open
        <kbd className="rounded bg-white/10 px-1.5 py-0.5">Esc</kbd> cancel
      </div>
    </div>
  );
}
