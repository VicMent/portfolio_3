import { useState, useMemo, useRef, useEffect } from 'react';
import { DialogWindow } from './AppWindow';
import { useWindowStore } from '../../stores/windowStore';
import { APPS, START_MENU_APPS } from '../../data/apps';
import { playClickSound, playErrorSound } from '../../utils/sound';

export function RunWindow({ onClose }: { window?: unknown; onClose: () => void }) {
  const openWindow = useWindowStore((s) => s.openWindow);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return START_MENU_APPS.slice(0, 5);
    return START_MENU_APPS.filter((app) =>
      [app.title, app.id, ...(app.keywords ?? [])]
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  }, [query]);

  const launch = (appId: string) => {
    const app = APPS[appId];
    if (!app) {
      playErrorSound();
      return;
    }
    playClickSound();
    openWindow(appId);
    onClose();
  };

  const submit = () => {
    const exact = START_MENU_APPS.find(
      (a) => a.id === query.trim().toLowerCase() || a.title.toLowerCase() === query.trim().toLowerCase()
    );
    if (exact) return launch(exact.id);
    if (matches.length) return launch(matches[0].id);
    playErrorSound();
  };

  return (
    <DialogWindow>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="p-5"
      >
        <div className="flex items-start gap-4">
          <img src="/favicon.svg" alt="" className="w-12 h-12 shrink-0" />
          <div className="min-w-0 flex-1">
            <h2 className="text-[var(--text-primary)] font-semibold text-lg leading-tight">What do you want to open?</h2>
            <p className="text-[var(--text-secondary)] text-sm mt-1">
              Type the name of a program, folder or document, and Windows will open it for you.
            </p>
          </div>
        </div>

        <label className="block mt-5">
          <span className="sr-only">Program name</span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Open:"
            className="aero-input w-full !bg-white !text-black"
            autoComplete="off"
            spellCheck={false}
          />
        </label>

        {matches.length > 0 && (
          <ul className="mt-3 max-h-40 overflow-y-auto aero-surface rounded-lg divide-y divide-[var(--glass-border)]">
            {matches.map((app) => (
              <li key={app.id}>
                <button
                  type="button"
                  onClick={() => launch(app.id)}
                  className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-[var(--selection-blue)] transition-colors"
                >
                  <span aria-hidden="true">{app.icon}</span>
                  <span className="text-sm text-[var(--text-primary)] truncate">{app.title}</span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {query.trim() && matches.length === 0 && (
          <p className="mt-3 text-sm text-red-300">
            Windows cannot find &apos;{query.trim()}&apos;. Try a different name.
          </p>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="aero-button px-5 py-2">
            Cancel
          </button>
          <button type="submit" className="aero-button-primary px-5 py-2">
            OK
          </button>
        </div>
      </form>
    </DialogWindow>
  );
}
