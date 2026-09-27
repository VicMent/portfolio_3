import { useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '../../utils/helpers';
import { useWindowStore } from '../../stores/windowStore';
import { START_MENU_APPS, START_MENU_CATEGORIES, type AppMeta } from '../../data/appMeta';
import { Search, X, ChevronRight, Power, Lock } from 'lucide-react';
import { playClickSound } from '../../utils/sound';
import { useThemeStore } from '../../stores/themeStore';

export function StartMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const openWindow = useWindowStore((s) => s.openWindow);
  const closeAll = useWindowStore((s) => s.closeAll);
  const soundEnabled = useThemeStore((s) => s.soundEnabled);

  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showShutdown, setShowShutdown] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Search actually filters: match title, id, category and keywords.
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = START_MENU_APPS;
    if (!q) return list;
    return list.filter((app) =>
      [app.title, app.id, app.category ?? '', ...(app.keywords ?? [])]
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  }, [query]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setExpanded(null);
      setShowShutdown(false);
      const t = setTimeout(() => inputRef.current?.focus(), 40);
      return () => clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  const launch = (app: AppMeta) => {
    if (soundEnabled) playClickSound();
    openWindow(app.id);
    onClose();
  };

  const isSearching = query.trim().length > 0;

  return (
    <div
      ref={ref}
      role="menu"
      aria-label="Start menu"
      className={cn(
        'aero-glass fixed bottom-[52px] left-1 z-[8000] w-[340px] max-w-[calc(100vw-16px)] origin-bottom-left',
        'overflow-hidden rounded-lg border border-white/25 shadow-[0_18px_50px_rgba(0,0,0,0.55)]',
        'animate-[vista-pop_160ms_ease-out]'
      )}
    >
      {/* Search */}
      <div className="border-b border-white/15 bg-white/10 px-3 py-2.5">
        <div className="relative">
          <Search size={15} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-300" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search programs and files"
            aria-label="Search programs and files"
            className="w-full rounded-md border border-white/25 bg-black/30 py-1.5 pr-8 pl-8 text-[13px] text-white placeholder-gray-400 outline-none focus:border-[var(--aero-blue)] focus:ring-1 focus:ring-[var(--aero-blue)]"
            spellCheck={false}
          />
          {isSearching && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-300 hover:text-white"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="flex min-h-[240px]">
        {/* Left: pinned / results */}
        <div className="max-h-[420px] min-w-0 flex-1 overflow-y-auto p-2">
          {isSearching ? (
            results.length ? (
              <ul>
                {results.map((app) => (
                  <li key={app.id}>
                    <MenuItem app={app} onClick={() => launch(app)} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-3 py-6 text-center text-xs text-gray-400">
                No programs match &apos;{query.trim()}&apos;.
              </p>
            )
          ) : (
            <ul>
              {START_MENU_APPS.filter((a) => a.category === undefined).map((app) => (
                <li key={app.id}>
                  <MenuItem app={app} onClick={() => launch(app)} />
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Right: All Programs */}
        {!isSearching && (
          <div className="w-[152px] shrink-0 border-l border-white/15 bg-black/25 p-2">
            <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              All Programs
            </p>
            <ul className="space-y-0.5">
              {START_MENU_CATEGORIES.map((category) => {
                const isOpen = expanded === category;
                const items = START_MENU_APPS.filter((a) => a.category === category);
                if (!items.length) return null;
                return (
                  <li key={category} className="relative">
                    <button
                      type="button"
                      onMouseEnter={() => setExpanded(category)}
                      onFocus={() => setExpanded(category)}
                      aria-expanded={isOpen}
                      className={cn(
                        'flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-[13px] transition-colors',
                        isOpen ? 'bg-white/15 text-white' : 'text-gray-200 hover:bg-white/10'
                      )}
                    >
                      <span className="truncate">{category}</span>
                      <ChevronRight size={13} className="shrink-0 text-gray-400" />
                    </button>

                    {isOpen && (
                      <ul
                        className="absolute top-0 left-full z-10 ml-1 min-w-[168px] animate-[vista-pop_120ms_ease-out] rounded-md border border-white/20 bg-[#1c2a3a]/95 p-1 shadow-xl backdrop-blur"
                        onMouseLeave={() => setExpanded(null)}
                      >
                        {items.map((app) => (
                          <li key={app.id}>
                            <MenuItem app={app} onClick={() => launch(app)} compact />
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-white/15 bg-[linear-gradient(90deg,rgba(0,120,215,0.5),rgba(0,90,158,0.5))] px-3 py-2">
        <button
          type="button"
          onClick={() => openWindow('about')}
          className="flex items-center gap-2 rounded px-1.5 py-1 text-left transition-colors hover:bg-white/15"
        >
          <span aria-hidden="true" className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 text-sm">
            🎮
          </span>
          <span className="text-[12px] leading-tight text-white">
            Vic Menten
            <span className="block text-[10px] text-white/70">Game programmer</span>
          </span>
        </button>

        <div className="flex items-center gap-0.5">
          <FooterButton label="Close all windows" onClick={() => { closeAll(); onClose(); }}>
            <X size={14} />
          </FooterButton>
          <FooterButton label="Lock" onClick={() => { openWindow('settings'); onClose(); }}>
            <Lock size={14} />
          </FooterButton>
          <FooterButton label="Shut down" danger onClick={() => setShowShutdown((v) => !v)}>
            <Power size={14} />
          </FooterButton>
        </div>
      </div>

      {showShutdown && (
        <div className="absolute right-2 bottom-14 w-56 rounded-lg border border-white/25 bg-[#1c2a3a]/95 p-3 shadow-xl backdrop-blur">
          <p className="text-[12px] text-gray-200">Shut down Windows?</p>
          <div className="mt-2 flex justify-end gap-2">
            <button type="button" onClick={() => setShowShutdown(false)} className="aero-button rounded px-3 py-1 text-[12px]">
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                closeAll();
                setShowShutdown(false);
                onClose();
              }}
              className="aero-button-primary rounded px-3 py-1 text-[12px]"
            >
              Shut down
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MenuItem({
  app,
  onClick,
  compact,
}: {
  app: AppMeta;
  onClick: () => void;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2.5 rounded px-2 text-left text-white transition-colors hover:bg-[var(--selection-blue)]',
        compact ? 'py-1.5 text-[12px]' : 'py-2 text-[13px]'
      )}
    >
      <span aria-hidden="true" className="shrink-0 text-base leading-none">
        {app.icon}
      </span>
      <span className="truncate">{app.title}</span>
    </button>
  );
}

function FooterButton({
  label,
  onClick,
  danger,
  children,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={cn(
        'flex h-8 w-8 items-center justify-center rounded transition-colors',
        danger ? 'text-white hover:bg-[#e81123]' : 'text-white hover:bg-white/20'
      )}
    >
      {children}
    </button>
  );
}
