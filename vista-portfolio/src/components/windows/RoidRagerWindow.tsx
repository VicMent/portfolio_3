import { useState } from 'react';
import { portfolioData } from '../../data/portfolio';
import { AppWindow } from './AppWindow';
import { AuroraText } from '../magicui/AuroraText';
import { BorderBeam } from '../magicui/BorderBeam';
import { BentoCard, BentoGrid } from '../magicui/BentoGrid';
import { RetroGrid } from '../magicui/RetroGrid';
import { Lightbox, type LightboxMedia } from '../magicui/Lightbox';
import { Play } from 'lucide-react';

type Tab = 'media' | 'turntable' | 'tech';

const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'media', label: 'Gameplay' },
  { id: 'turntable', label: 'Model turntable' },
  { id: 'tech', label: 'Tech' },
];

export function RoidRagerWindow() {
  const project = portfolioData.projects[1];
  const [tab, setTab] = useState<Tab>('media');
  const [lightbox, setLightbox] = useState<number | null>(null);

  const media: LightboxMedia[] = [
    ...project.clips!.map((clip) => ({
      src: clip.src,
      kind: clip.kind,
      poster: clip.poster,
      alt: clip.label,
    })),
    { src: '/media/turntable.webm', kind: 'video', poster: '/media/turntable-poster.jpg', alt: '3D turntable of the Roid Rager alien' },
  ];

  return (
    <AppWindow scroll={false}>
      <div className="flex h-full min-h-0 flex-col">
        <header className="relative shrink-0 overflow-hidden border-b border-[var(--surface-border)] bg-[var(--surface-raised)] px-5 py-4">
          <RetroGrid className="opacity-70" cellSize={38} speed={1.4} fade={false} />
          <div className="relative flex flex-wrap items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="aero-surface relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl">
                🎯
                <BorderBeam size={2} duration={5} colorFrom="#e8563f" colorTo="#ffb900" />
              </div>
              <div className="min-w-0">
                <AuroraText className="block text-xl font-extrabold tracking-tight">
                  {project.title}
                </AuroraText>
                <p className="text-sm text-[var(--aero-blue-light)]">{project.tagline}</p>
              </div>
            </div>
            <span
              className="shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide"
              style={{ background: 'rgba(255,185,0,0.18)', color: '#ffcf5c' }}
            >
              {project.status}
            </span>
          </div>
          <p className="relative mt-3 max-w-3xl text-sm leading-relaxed text-[var(--text-secondary)]">
            {project.description}
          </p>
        </header>

        <div className="flex shrink-0 gap-1 border-b border-[var(--surface-border)] bg-[var(--surface-raised)] px-3 py-1.5">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              aria-current={tab === t.id}
              className={`rounded-md px-3 py-1.5 text-[12.5px] transition-colors ${
                tab === t.id
                  ? 'bg-[var(--selection-blue)] text-[var(--text-primary)] ring-1 ring-[var(--aero-blue)]'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--surface-raised)]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          <div className="mx-auto max-w-4xl space-y-5">
            {tab === 'media' && (
              <BentoGrid columns={2} gap={4}>
                {project.clips!.map((clip, i) => (
                  <BentoCard key={clip.src} hoverEffect="shine" onClick={() => setLightbox(i)}>
                    <figure className="space-y-2">
                      <div className="relative aspect-video overflow-hidden rounded-lg bg-black/50">
                        {clip.kind === 'video' ? (
                          <video
                            src={clip.src}
                            poster={clip.poster}
                            muted
                            loop
                            playsInline
                            preload="metadata"
                            className="h-full w-full object-cover"
                            onMouseEnter={(e) => void e.currentTarget.play().catch(() => undefined)}
                            onMouseLeave={(e) => e.currentTarget.pause()}
                          />
                        ) : (
                          <img
                            src={clip.src}
                            alt={clip.label}
                            loading="lazy"
                            className="h-full w-full object-cover"
                          />
                        )}
                        <span className="absolute inset-0 flex items-center justify-center bg-black/35 opacity-0 transition-opacity group-hover:opacity-100">
                          <span className="aero-surface flex h-12 w-12 items-center justify-center rounded-full text-[var(--text-primary)]">
                            <Play size={18} />
                          </span>
                        </span>
                      </div>
                      <figcaption className="text-[11.5px] text-[var(--text-muted)]">{clip.label}</figcaption>
                    </figure>
                  </BentoCard>
                ))}
              </BentoGrid>
            )}

            {tab === 'turntable' && (
              <div className="space-y-4">
                <p className="max-w-2xl text-sm leading-relaxed text-[var(--text-secondary)]">
                  A spinning render of the alien I modelled for Roid Rager. Hover to play, click to
                  open it full size.
                </p>
                <BentoCard hoverEffect="none" onClick={() => setLightbox(project.clips!.length)}>
                  <div className="relative aspect-video overflow-hidden rounded-lg bg-[#1c1c1c]">
                    <video
                      src="/media/turntable.webm"
                      poster="/media/turntable-poster.jpg"
                      muted
                      loop
                      playsInline
                      preload="metadata"
                      className="h-full w-full object-cover"
                      onMouseEnter={(e) => void e.currentTarget.play().catch(() => undefined)}
                      onMouseLeave={(e) => e.currentTarget.pause()}
                    />
                    <span className="absolute bottom-2 left-2 rounded-md bg-black/55 px-2 py-1 font-mono text-[11px] text-white/80">
                      3D turntable · hover to spin
                    </span>
                  </div>
                </BentoCard>
              </div>
            )}

            {tab === 'tech' && (
              <div>
                <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--aero-blue-light)]">
                  Tech
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {project.tech.map((t) => (
                    <span
                      key={t}
                      className="aero-surface rounded border px-2 py-1 text-[11.5px] text-[var(--text-secondary)]"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <Lightbox
          items={media}
          index={lightbox}
          onClose={() => setLightbox(null)}
          onIndexChange={setLightbox}
        />
      </div>
    </AppWindow>
  );
}
