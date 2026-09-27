import type { ReactNode } from 'react';
import { ChevronUp, LayoutGrid, Rows3, RefreshCw } from 'lucide-react';

/**
 * Explorer-style content pane: toolbar, optional navigation rail, body, status bar.
 * Window chrome is provided by `BaseWindow`.
 */
export function FolderWindow({
  children,
  navigation,
  breadcrumb = 'Vic Menten',
  status = '1 item',
}: {
  children: ReactNode;
  navigation?: ReactNode;
  breadcrumb?: string;
  status?: string;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center gap-2 border-b border-[var(--glass-border)] bg-white/5 px-2 py-1.5">
        <button
          type="button"
          aria-label="Up one level"
          className="flex h-7 w-7 items-center justify-center rounded-md text-gray-200 transition-colors hover:bg-white/10"
        >
          <ChevronUp size={16} />
        </button>

        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-md border border-[var(--glass-border)] bg-black/25 px-2 py-1">
          <span aria-hidden="true" className="text-[13px]">📁</span>
          <span className="truncate text-[13px] text-gray-200">{breadcrumb}</span>
        </div>

        <div className="flex shrink-0 items-center gap-0.5">
          {[LayoutGrid, Rows3, RefreshCw].map((Icon, i) => (
            <button
              key={i}
              type="button"
              aria-label={['Icon view', 'Details view', 'Refresh'][i]}
              className="flex h-7 w-7 items-center justify-center rounded-md text-gray-200 transition-colors hover:bg-white/10"
            >
              <Icon size={14} />
            </button>
          ))}
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        {navigation && (
          <nav
            aria-label="Folder navigation"
            className="hidden w-48 shrink-0 overflow-y-auto border-r border-[var(--glass-border)] bg-black/25 p-2 sm:block"
          >
            {navigation}
          </nav>
        )}
        <div className="min-w-0 flex-1 overflow-y-auto p-5">{children}</div>
      </div>

      <div className="flex shrink-0 items-center justify-between border-t border-[var(--glass-border)] bg-white/5 px-3 py-1 text-[11px] text-gray-400">
        <span>{status}</span>
        <span className="hidden sm:inline">This folder</span>
      </div>
    </div>
  );
}
