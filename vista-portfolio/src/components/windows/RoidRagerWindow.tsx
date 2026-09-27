import { useState } from 'react';
import { portfolioData } from '../../data/portfolio';
import { AppWindow } from './AppWindow';
import { AuroraText } from '../magicui/AuroraText';
import { BorderBeam } from '../magicui/BorderBeam';
import { BentoCard, BentoGrid } from '../magicui/BentoGrid';
import { X, Play } from 'lucide-react';

export function RoidRagerWindow() {
  const project = portfolioData.projects[1];
  const [lightbox, setLightbox] = useState<number | null>(null);

  return (
    <AppWindow scroll={false}>
      <div className="flex h-full min-h-0 flex-col">
        <header className="relative shrink-0 border-b border-[var(--glass-border)] bg-white/5 px-5 py-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl aero-surface text-2xl">
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
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-gray-300">{project.description}</p>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          <div className="mx-auto max-w-4xl space-y-5">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--aero-blue-light)]">
              Media
            </h3>

            <BentoGrid columns={2} gap={4}>
              {project.clips.map((clip, i) => (
                <BentoCard key={clip.src} hoverEffect="shine" onClick={() => setLightbox(i)}>
                  <figure className="space-y-2">
                    <div className="relative aspect-video overflow-hidden rounded-lg bg-black/50">
                      {clip.kind === 'video' ? (
                        <video
                          src={clip.src}
                          muted
                          loop
                          playsInline
                          preload="metadata"
                          className="h-full w-full object-cover"
                          onMouseEnter={(e) => void e.currentTarget.play().catch(() => undefined)}
                          onMouseLeave={(e) => e.currentTarget.pause()}
                        />
                      ) : (
                        <img src={clip.src} alt={clip.label} loading="lazy" className="h-full w-full object-cover" />
                      )}
                      <span className="absolute inset-0 flex items-center justify-center bg-black/35 opacity-0 transition-opacity group-hover:opacity-100">
                        <span className="flex h-12 w-12 items-center justify-center rounded-full aero-surface text-white">
                          <Play size={18} />
                        </span>
                      </span>
                    </div>
                    <figcaption className="text-[11.5px] text-gray-400">{clip.label}</figcaption>
                  </figure>
                </BentoCard>
              ))}
            </BentoGrid>

            <div>
              <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--aero-blue-light)]">
                Tech
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {project.tech.map((t) => (
                  <span key={t} className="rounded border border-white/12 bg-black/25 px-2 py-1 text-[11.5px] text-gray-200">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {lightbox !== null && (
          <MediaLightbox
            clip={project.clips[lightbox]}
            onClose={() => setLightbox(null)}
          />
        )}
      </div>
    </AppWindow>
  );
}

function MediaLightbox({
  clip,
  onClose,
}: {
  clip: { src: string; kind: string; label: string };
  onClose: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-label={clip.label}
      className="fixed inset-0 z-[9995] flex items-center justify-center bg-black/85 p-6"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl overflow-hidden rounded-xl border border-[var(--aero-blue)]/60 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/15 bg-black/40 px-4 py-2.5">
          <span className="text-sm font-medium text-white">{clip.label}</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-7 w-7 items-center justify-center rounded text-white/80 transition-colors hover:bg-white/15 hover:text-white"
          >
            <X size={15} />
          </button>
        </div>
        <div className="aspect-video bg-black">
          {clip.kind === 'video' ? (
            <video src={clip.src} controls autoPlay playsInline className="h-full w-full" />
          ) : (
            <img src={clip.src} alt={clip.label} className="h-full w-full object-contain" />
          )}
        </div>
      </div>
    </div>
  );
}
