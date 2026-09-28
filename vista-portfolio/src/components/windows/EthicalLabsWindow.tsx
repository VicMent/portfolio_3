import { useRef, useState } from 'react';
import { portfolioData } from '../../data/portfolio';
import { AppWindow } from './AppWindow';
import { AuroraText } from '../magicui/AuroraText';
import { BorderBeam } from '../magicui/BorderBeam';
import { ExternalLink, Play, Pause, Volume2, VolumeX, Maximize } from 'lucide-react';

export function EthicalLabsWindow() {
  const project = portfolioData.projects[0];
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(true);

  const toggle = () => {
    const el = videoRef.current;
    if (!el) return;
    if (el.paused) void el.play().catch(() => undefined);
    else el.pause();
    setPlaying(!el.paused);
  };

  return (
    <AppWindow scroll={false}>
      <div className="flex h-full min-h-0 flex-col">
        {/* Hero */}
        <div className="relative aspect-video shrink-0 overflow-hidden bg-black">
          <img
            src="/ethicallabs_project.png"
            alt="Totally Ethical Labs gameplay"
            className="h-full w-full object-cover"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{ background: 'linear-gradient(180deg,transparent 45%,rgba(0,0,0,0.75) 100%)' }}
          />
          <div className="absolute right-3 bottom-3 flex items-center gap-1.5">
            <button
              type="button"
              onClick={toggle}
              aria-label={playing ? 'Pause' : 'Play'}
              className="aero-surface flex h-9 w-9 items-center justify-center rounded-lg text-[var(--text-primary)] transition-colors hover:bg-white/20"
            >
              {playing ? <Pause size={15} /> : <Play size={15} />}
            </button>
            <button
              type="button"
              onClick={() => {
                const el = videoRef.current;
                if (!el) return;
                el.muted = !el.muted;
                setMuted(el.muted);
              }}
              aria-label={muted ? 'Unmute' : 'Mute'}
              className="aero-surface flex h-9 w-9 items-center justify-center rounded-lg text-[var(--text-primary)] transition-colors hover:bg-white/20"
            >
              {muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
            </button>
            <button
              type="button"
              onClick={() => videoRef.current?.requestFullscreen?.().catch(() => undefined)}
              aria-label="Fullscreen"
              className="aero-surface flex h-9 w-9 items-center justify-center rounded-lg text-[var(--text-primary)] transition-colors hover:bg-white/20"
            >
              <Maximize size={15} />
            </button>
          </div>
          <span className="absolute bottom-3 left-3 rounded-md bg-black/50 px-2 py-1 font-mono text-[11px] text-red-300">
            ● REC · Specimen 07
          </span>
        </div>

        {/* Body */}
        <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-5 lg:flex-row">
          <div className="min-w-0 flex-1 space-y-4">
            <header className="flex items-start gap-3">
              <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl aero-surface text-2xl">
                🎮
                <BorderBeam size={2} duration={5} />
              </div>
              <div className="min-w-0">
                <AuroraText className="block text-xl font-extrabold tracking-tight">
                  {project.title}
                </AuroraText>
                <p className="text-sm text-[var(--aero-blue-light)]">{project.tagline}</p>
              </div>
            </header>

            <p className="text-sm leading-relaxed text-[var(--text-secondary)]">{project.description}</p>

            <div>
              <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--aero-blue-light)]">
                Controls
              </h3>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {project.controls.map((control) => (
                  <div
                    key={control.key}
                    className={`aero-surface flex items-center gap-2 rounded-lg px-2.5 py-2 ${
                      control.warning ? 'ring-1 ring-amber-400/40' : ''
                    }`}
                  >
                    <kbd className="shrink-0 rounded border border-white/20 bg-black/40 px-1.5 py-0.5 font-mono text-[10.5px] text-[var(--text-primary)]">
                      {control.key}
                    </kbd>
                    <span className="truncate text-[12px] text-[var(--text-secondary)]">{control.action}</span>
                    {control.warning && <span className="text-[10px] text-amber-300">⚠</span>}
                  </div>
                ))}
              </div>
            </div>

            <a
              href={project.links.itch}
              target="_blank"
              rel="noopener noreferrer"
              className="aero-button-primary inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium"
            >
              <Play size={15} /> Play / download on itch.io
              <ExternalLink size={13} className="opacity-70" />
            </a>
          </div>

          {/* Facts rail */}
          <aside className="w-full shrink-0 space-y-3 lg:w-64">
            <Rail title="Credits" rows={[
              ['Programming', 'Vic Menten'],
              ['Assets', 'Bert'],
            ]} />
            <Rail title="Scope" rows={[
              ['Timeline', project.scope],
              ['Team', '2 people'],
            ]} />
            <Rail title="Details" rows={[
              ['Platform', project.platform],
              ['Status', project.status],
            ]} />
            <div>
              <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--aero-blue-light)]">
                Tech
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {project.tech.map((t) => (
                  <span key={t} className="rounded border border-[var(--surface-border)] bg-[var(--surface-raised)] px-2 py-1 text-[11.5px] text-[var(--text-primary)]">
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <p className="aero-surface rounded-lg px-3 py-2.5 text-[11.5px] text-amber-200/80">
              One-week scope, so a few charming bugs made it into the build.
            </p>
          </aside>
        </div>
      </div>
    </AppWindow>
  );
}

function Rail({ title, rows }: { title: string; rows: Array<[string, string]> }) {
  return (
    <div className="aero-surface rounded-lg px-3.5 py-3">
      <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--aero-blue-light)]">
        {title}
      </h3>
      <dl className="space-y-1.5">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-baseline justify-between gap-3">
            <dt className="shrink-0 text-[11.5px] text-[var(--text-muted)]">{k}</dt>
            <dd className="truncate text-right text-[12px] text-[var(--text-primary)]">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
