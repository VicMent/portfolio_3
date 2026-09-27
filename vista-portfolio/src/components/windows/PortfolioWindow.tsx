import { portfolioData } from '../../data/portfolio';
import { useWindowStore } from '../../stores/windowStore';
import { FolderWindow } from './FolderWindow';
import { BentoCard, BentoGrid } from '../magicui/BentoGrid';
import { AuroraText } from '../magicui/AuroraText';
import { playOpenSound } from '../../utils/sound';
import { ArrowUpRight } from 'lucide-react';

const ACCENTS: Record<string, string> = {
  'ethical-labs': '#4a90d9',
  'roid-rager': '#e8563f',
  'voxel-terrain': '#00b4b4',
  'web-dev': '#61dafb',
};

/** Some project "previews" are still images rather than clips. */
function isVideo(src: string): boolean {
  return /\.(mp4|webm|mov)$/i.test(src);
}

export function PortfolioWindow() {
  const openWindow = useWindowStore((s) => s.openWindow);
  const { projects } = portfolioData;

  const navigation = (
    <ul className="space-y-0.5">
      <li>
        <span className="block rounded-md bg-[var(--selection-blue)] px-2.5 py-2 text-[13px] font-medium text-white ring-1 ring-[var(--aero-blue)]">
          📁 All projects
        </span>
      </li>
      {['Games', 'Development'].map((group) => (
        <li key={group} className="pt-1.5">
          <p className="px-2.5 pb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
            {group}
          </p>
          {projects
            .filter((p) => (group === 'Games' ? p.id !== 'web-dev' : p.id === 'web-dev'))
            .map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  playOpenSound();
                  openWindow(p.id);
                }}
                className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-[12.5px] text-gray-300 transition-colors hover:bg-white/10"
              >
                {p.title}
              </button>
            ))}
        </li>
      ))}
    </ul>
  );

  return (
    <FolderWindow navigation={navigation} breadcrumb="Vic Menten ▸ Projects" status={`${projects.length} projects`}>
      <div className="mx-auto max-w-4xl space-y-5">
        <header>
          <AuroraText className="block text-xl font-extrabold tracking-tight">Selected work</AuroraText>
          <p className="mt-1 text-sm text-gray-400">
            Every project opens as its own window — drag, resize and tile it like any other app.
          </p>
        </header>

        <BentoGrid columns={2} gap={4}>
          {projects.map((project) => {
            const accent = ACCENTS[project.id] ?? 'var(--aero-blue)';
            return (
              <BentoCard
                key={project.id}
                hoverEffect="shine"
                onClick={() => {
                  playOpenSound();
                  openWindow(project.id);
                }}
              >
                <article className="flex h-full flex-col">
                  <div className="relative mb-3 aspect-video overflow-hidden rounded-lg bg-black/40">
                    {isVideo(project.video) ? (
                      <video
                        src={project.video}
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
                        src={project.video}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    )}

                    <span
                      className="absolute top-2 left-2 rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide backdrop-blur-sm"
                      style={{ background: `${accent}33`, color: accent }}
                    >
                      {project.year}
                    </span>
                  </div>

                  <h3 className="text-base font-semibold text-white">{project.title}</h3>
                  <p className="text-[12px] text-[var(--aero-blue-light)]">{project.tagline}</p>
                  <p className="mt-2 flex-1 text-[13px] leading-relaxed text-gray-300">{project.summary}</p>

                  <div className="mt-3 flex flex-wrap gap-1">
                    {project.tech.slice(0, 4).map((t) => (
                      <span
                        key={t}
                        className="rounded border border-white/12 bg-black/25 px-1.5 py-0.5 text-[10.5px] text-gray-300"
                      >
                        {t}
                      </span>
                    ))}
                  </div>

                  <span className="mt-3 inline-flex items-center gap-1 text-[12px] font-medium text-[var(--aero-blue-light)]">
                    Open window <ArrowUpRight size={12} />
                  </span>
                </article>
              </BentoCard>
            );
          })}
        </BentoGrid>
      </div>
    </FolderWindow>
  );
}
