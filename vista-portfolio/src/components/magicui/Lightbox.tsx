import { useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '../../utils/helpers';

export interface LightboxMedia {
  src: string;
  kind: 'image' | 'video';
  poster?: string;
  alt: string;
}

export function Lightbox({
  items,
  index,
  onClose,
  onIndexChange,
}: {
  items: LightboxMedia[];
  index: number | null;
  onClose: () => void;
  onIndexChange: (next: number) => void;
}) {
  const open = index !== null;
  const touchStart = useRef<number | null>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  const go = useCallback(
    (delta: number) => {
      if (index === null) return;
      onIndexChange((index + delta + items.length) % items.length);
    },
    [index, items.length, onIndexChange]
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeRef.current();
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, go]);

  if (typeof document === 'undefined') return null;
  const media = index === null ? null : items[index];

  return createPortal(
    <AnimatePresence>
      {open && media && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={media.alt}
          className="fixed inset-0 z-[9500] flex items-center justify-center bg-black/88 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeRef.current}
          onTouchStart={(e) => {
            touchStart.current = e.touches[0].clientX;
          }}
          onTouchEnd={(e) => {
            if (touchStart.current === null) return;
            const delta = e.changedTouches[0].clientX - touchStart.current;
            if (Math.abs(delta) > 50) go(delta < 0 ? 1 : -1);
            touchStart.current = null;
          }}
        >
          <motion.figure
            className="relative w-full max-w-5xl overflow-hidden rounded-xl border border-[var(--window-active-border)] bg-[#0b1420] shadow-2xl"
            initial={{ scale: 0.94, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 bg-black/40 px-4 py-2.5">
              <figcaption className="truncate text-sm font-medium text-white">{media.alt}</figcaption>
              <div className="flex items-center gap-3">
                {items.length > 1 && (
                  <span className="text-xs text-white/50">
                    {(index ?? 0) + 1} / {items.length}
                  </span>
                )}
                <button
                  type="button"
                  onClick={closeRef.current}
                  aria-label="Close"
                  className="flex h-7 w-7 items-center justify-center rounded text-white/80 transition-colors hover:bg-white/15 hover:text-white"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {media.kind === 'video' ? (
              <video
                key={media.src}
                src={media.src}
                poster={media.poster}
                controls
                autoPlay
                playsInline
                className="max-h-[78vh] w-full bg-black"
              />
            ) : (
              <img
                key={media.src}
                src={media.src}
                alt={media.alt}
                className="max-h-[78vh] w-full object-contain"
              />
            )}
          </motion.figure>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

export { cn };
