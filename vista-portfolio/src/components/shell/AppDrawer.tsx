import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useWindowStore } from '../../stores/windowStore';
import { START_MENU_APPS } from '../../data/appMeta';
import { playClickSound } from '../../utils/sound';
import { TASKBAR_HEIGHT } from '../../stores/windowStore';
import { cn } from '../../utils/helpers';

/**
 * Mobile app drawer. On a phone the desktop icons are hard to reach once a
 * window is open, so the Start button opens this instead of the Start menu.
 */
export function AppDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const openWindow = useWindowStore((s) => s.openWindow);
  const [visible, setVisible] = useState(open);

  useEffect(() => {
    if (open) setVisible(true);
    else {
      const t = setTimeout(() => setVisible(false), 240);
      return () => clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!visible) return null;

  const groups = START_MENU_APPS.reduce<Record<string, typeof START_MENU_APPS>>((acc, app) => {
    const key = app.category ?? 'Applications';
    (acc[key] ||= []).push(app);
    return acc;
  }, {});

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-label="All applications"
          className="fixed inset-x-0 z-[8500] overflow-y-auto overscroll-contain px-4 pb-10"
          style={{
            top: 0,
            height: `calc(100dvh - ${TASKBAR_HEIGHT}px)`,
            // Fully opaque: this is a full-screen mobile overlay, and a
            // translucent backdrop let the open window ghost through.
            background: '#080e16',
          }}
          initial={{ y: '-100%' }}
          animate={{ y: 0 }}
          exit={{ y: '-100%' }}
          transition={{ type: 'spring', stiffness: 320, damping: 34 }}
        >
          <div className="sticky top-0 z-10 -mx-4 flex items-center justify-between bg-[#080e16] px-4 py-4">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">All applications</h2>
            <span className="text-xs text-[var(--text-muted)]">{START_MENU_APPS.length} programs</span>
          </div>

          {Object.entries(groups).map(([group, apps]) => (
            <section key={group} className="mb-6">
              <h3 className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                {group}
              </h3>
              <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {apps.map((app) => (
                  <li key={app.id}>
                    <button
                      type="button"
                      onClick={() => {
                        playClickSound();
                        openWindow(app.id);
                        onClose();
                      }}
                      className={cn(
                        'flex w-full flex-col items-center gap-2 rounded-xl px-2 py-4',
                        'aero-surface transition-transform active:scale-95'
                      )}
                    >
                      <span aria-hidden="true" className="text-3xl leading-none">
                        {app.icon}
                      </span>
                      <span className="line-clamp-2 text-center text-[11px] leading-tight text-[var(--text-primary)]">
                        {app.title}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
