import { useEffect, useRef, useState } from 'react';
import { cn } from '../../utils/helpers';
import { useDesktopStore } from '../../stores/desktopStore';
import { useWindowStore, TASKBAR_HEIGHT } from '../../stores/windowStore';
import { ClockGadget } from '../magicui/ClockGadget';
import { SkillsGadget } from '../magicui/SkillsGadget';
import { SystemGadget } from '../magicui/SystemGadget';
import { WeatherGadget } from '../magicui/WeatherGadget';
import { ChevronRight, X, Plus } from 'lucide-react';
import { playClickSound } from '../../utils/sound';

const GADGETS: Record<string, React.ComponentType<{ compact?: boolean }>> = {
  ClockGadget,
  SkillsGadget,
  SystemGadget,
  WeatherGadget,
};

export function Sidebar({ isOpen }: { isOpen: boolean }) {
  const gadgets = useDesktopStore((s) => s.gadgets);
  const openWindow = useWindowStore((s) => s.openWindow);
  const panelRef = useRef<HTMLDivElement>(null);
  const [collapsed, setCollapsed] = useState(false);

  // With no gadgets the sidebar is dead weight.
  const visible = gadgets.filter((g) => g.isDocked);
  if (!visible.length) return null;

  return (
    <>
      {/* Slide-out handle — hidden on small screens where the rail is off anyway */}
      <button
        type="button"
        onClick={() => {
          playClickSound();
          setCollapsed(false);
        }}
        aria-label="Show sidebar"
        className={cn(
          'fixed right-0 z-[9999] hidden h-24 w-3 items-center justify-center rounded-l-md border border-r-0 border-white/25 md:flex',
          'bg-[linear-gradient(180deg,rgba(255,255,255,0.22),rgba(255,255,255,0.06))]',
          'transition-all duration-200 hover:bg-white/25',
          isOpen && 'pointer-events-none translate-x-full opacity-0'
        )}
        style={{ top: `calc(50% - 48px)` }}
      >
        <ChevronRight size={14} className="text-white" />
      </button>

      <aside
        ref={panelRef}
        aria-label="Sidebar gadgets"
        className={cn(
          'aero-glass fixed right-0 z-20 flex flex-col border-l border-white/20',
          'bg-[linear-gradient(180deg,rgba(255,255,255,0.14),rgba(255,255,255,0.05))]',
          'transition-transform duration-250 ease-out'
        )}
        style={{
          top: 0,
          bottom: TASKBAR_HEIGHT,
          width: 244,
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
        }}
      >
        <header className="flex shrink-0 items-center justify-between border-b border-white/15 px-3 py-2">
          <h2 className="text-[12px] font-semibold uppercase tracking-wider text-white/85">Gadgets</h2>
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              aria-label="Collapse sidebar"
              onClick={() => setCollapsed(true)}
              className="flex h-6 w-6 items-center justify-center rounded text-white/70 transition-colors hover:bg-white/15 hover:text-white"
            >
              <ChevronRight size={13} />
            </button>
            <button
              type="button"
              aria-label="Hide sidebar"
              onClick={() => useDesktopStore.getState().setSidebarOpen(false)}
              className="flex h-6 w-6 items-center justify-center rounded text-white/70 transition-colors hover:bg-white/15 hover:text-white"
            >
              <X size={13} />
            </button>
          </div>
        </header>

        <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto p-2.5">
          {visible.map((gadget) => {
            const Component = GADGETS[gadget.component];
            if (!Component) return null;
            return (
              <section
                key={gadget.id}
                className="aero-glass overflow-hidden rounded-lg p-2.5 transition-colors hover:border-[var(--aero-blue)]/60"
              >
                <h3 className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-white/80">
                  <span aria-hidden="true">{gadget.icon}</span>
                  {gadget.name}
                </h3>
                <Component compact />
              </section>
            );
          })}

          <button
            type="button"
            onClick={() => openWindow('settings')}
            className="aero-glass flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-[11px] text-white/70 transition-colors hover:border-[var(--aero-blue)]/60 hover:text-white"
          >
            <Plus size={13} /> Add gadget
          </button>
        </div>

        <footer className="shrink-0 border-t border-white/15 px-3 py-1.5 text-center text-[10px] text-white/40">
          {visible.length} gadgets
        </footer>
      </aside>
    </>
  );
}
