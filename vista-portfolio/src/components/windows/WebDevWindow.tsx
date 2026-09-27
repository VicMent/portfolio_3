import { useMemo, useState } from 'react';
import { portfolioData } from '../../data/portfolio';
import { AppWindow } from './AppWindow';
import { AuroraText } from '../magicui/AuroraText';
import { BorderBeam } from '../magicui/BorderBeam';
import { Globe } from '../magicui/Globe';
import { Terminal } from '../magicui/Terminal';
import { TechChips } from './VoxelTerrainWindow';

const COLORS: Record<string, string> = {
  React: '#61dafb',
  TypeScript: '#4d8fd6',
  'Three.js': '#e0c07a',
  'Node.js': '#7cc98d',
  'Tailwind CSS': '#4dc4d6',
  Vite: '#9a8cf0',
  Zustand: '#e0a35c',
};

export function WebDevWindow() {
  const project = portfolioData.projects[3];
  const [tab, setTab] = useState<'showcase' | 'stack'>('showcase');

  const orbit = useMemo(
    () =>
      project.tech
        .filter((t) => COLORS[t])
        .map((t, i, arr) => ({
          label: t,
          color: COLORS[t],
          angle: (i / arr.length) * Math.PI * 2,
          distance: 70,
        })),
    [project.tech]
  );

  return (
    <AppWindow scroll={false}>
      <div className="flex h-full min-h-0 flex-col">
        <header className="relative shrink-0 border-b border-[var(--glass-border)] bg-white/5 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl aero-surface">
              <span aria-hidden="true" className="text-2xl">🌐</span>
              <BorderBeam size={2} duration={5} colorFrom="#61dafb" colorTo="#00b4b4" />
            </div>
            <div className="min-w-0">
              <AuroraText className="block text-xl font-extrabold tracking-tight">
                {project.title}
              </AuroraText>
              <p className="text-sm text-[var(--aero-blue-light)]">{project.tagline}</p>
            </div>
          </div>
        </header>

        <div className="flex shrink-0 gap-1 border-b border-[var(--glass-border)] bg-black/15 px-3 py-1.5">
          {([['showcase', 'Showcase'], ['stack', 'Stack']] as const).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              aria-current={tab === id}
              className={`rounded-md px-3 py-1.5 text-[12.5px] transition-colors ${
                tab === id
                  ? 'bg-[var(--selection-blue)] text-white ring-1 ring-[var(--aero-blue)]'
                  : 'text-gray-300 hover:bg-white/10'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          <div className="mx-auto max-w-3xl space-y-5">
            <p className="text-sm leading-relaxed text-gray-300">{project.description}</p>

            {tab === 'showcase' ? (
              <>
                <div className="aspect-video overflow-hidden rounded-xl bg-black">
                  <video
                    src={project.video}
                    controls
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    className="h-full w-full object-cover"
                  />
                </div>

                <div className="aero-surface flex flex-col items-center gap-3 rounded-xl px-5 py-6">
                  <Globe size={260} orbitItems={orbit} />
                  <p className="max-w-md text-center text-[12.5px] text-gray-400">
                    A small canvas globe I use to visualise a stack — no WebGL dependency, just
                    2D context and a requestAnimationFrame loop.
                  </p>
                </div>
              </>
            ) : (
              <div className="space-y-5">
                <TechChips items={project.tech} />

                <Terminal
                  title="build"
                  speed={0.012}
                  lines={[
                    { text: '$ npm run build', tone: 'accent' },
                    { text: 'vite v8.3.0 building for production...', tone: 'muted' },
                    { text: '✓ 1937 modules transformed', tone: 'success' },
                    { text: 'dist/index.html          2.56 kB │ gzip:  0.96 kB', tone: 'default' },
                    { text: 'dist/assets/index.css   49.6 kB │ gzip:  8.9 kB', tone: 'default' },
                    { text: 'dist/assets/index.js   415.5 kB │ gzip: 115.6 kB', tone: 'default' },
                    { text: '✓ built in 0.8s', tone: 'success' },
                  ]}
                />

                <div className="aero-surface rounded-xl px-5 py-4">
                  <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--aero-blue-light)]">
                    About this portfolio
                  </h3>
                  <ul className="space-y-1.5 text-[13px] text-gray-300">
                    <li>· Real window manager: drag, resize from 8 handles, edge-snap, tile, cascade</li>
                    <li>· Zustand stores for windows, desktop and theme</li>
                    <li>· System sounds synthesised with the Web Audio API — no audio files</li>
                    <li>· Canvas globe, rAF-driven, reduced-motion aware</li>
                    <li>· Fully keyboard operable and responsive down to a phone</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppWindow>
  );
}
