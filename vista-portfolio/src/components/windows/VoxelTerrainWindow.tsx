import { useState } from 'react';
import { portfolioData } from '../../data/portfolio';
import { AppWindow } from './AppWindow';
import { AuroraText } from '../magicui/AuroraText';
import { BorderBeam } from '../magicui/BorderBeam';
import { Terminal } from '../magicui/Terminal';
import { AnimatedList } from '../magicui/AnimatedList';

type Tab = 'overview' | 'features' | 'code';

const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'overview', label: 'Overview' },
  { id: 'features', label: 'Features' },
  { id: 'code', label: 'How it works' },
];

const SNIPPETS = [
  {
    file: 'PerlinNoise.cs',
    language: 'csharp',
    code: `public static float Sample(float x, float y, int octaves, float persistence, float lacunarity)
{
    float noise = 0f, amplitude = 1f, frequency = 1f, max = 0f;

    for (int i = 0; i < octaves; i++)
    {
        noise += Mathf.PerlinNoise(x * frequency, y * frequency) * amplitude;
        max += amplitude;
        amplitude *= persistence;
        frequency *= lacunarity;
    }

    return noise / max;   // normalised 0..1
}`,
  },
  {
    file: 'ChunkStreamer.cs',
    language: 'csharp',
    code: `void Update()
{
    var wanted = ChunkKey.From(player.position, viewDistance);

    foreach (var key in wanted)
        if (!loaded.Contains(key))
            RequestChunk(key);      // built on a worker thread

    foreach (var key in loaded.Except(wanted))
        ReleaseChunk(key);          // returns memory to the pool
}`,
  },
  {
    file: 'ChunkMesher.cs',
    language: 'csharp',
    code: `// Only emit a face when the neighbour is empty — culls ~90% of the faces
for (int y = 0; y < Size; y++)
for (int z = 0; z < Size; z++)
for (int x = 0; x < Size; x++)
{
    if (!IsSolid(x, y, z)) continue;

    if (!IsSolid(x + 1, y, z)) AddFace(FaceId.Right,  x, y, z);
    if (!IsSolid(x - 1, y, z)) AddFace(FaceId.Left,   x, y, z);
    if (!IsSolid(x, y, z + 1)) AddFace(FaceId.Front,  x, y, z);
    if (!IsSolid(x, y, z - 1)) AddFace(FaceId.Back,   x, y, z);
    if (!IsSolid(x, y + 1, z)) AddFace(FaceId.Top,    x, y, z);
}`,
  },
];

export function VoxelTerrainWindow() {
  const project = portfolioData.projects[2];
  const [tab, setTab] = useState<Tab>('overview');
  const [snippet, setSnippet] = useState(0);

  return (
    <AppWindow scroll={false}>
      <div className="flex h-full min-h-0 flex-col">
        <header className="relative shrink-0 border-b border-[var(--glass-border)] bg-white/5 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl aero-surface">
              <span aria-hidden="true" className="text-2xl">🧊</span>
              <BorderBeam size={2} duration={5} colorFrom="#00b4b4" colorTo="#61dafb" />
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
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              aria-current={tab === t.id}
              className={`rounded-md px-3 py-1.5 text-[12.5px] transition-colors ${
                tab === t.id
                  ? 'bg-[var(--selection-blue)] text-white ring-1 ring-[var(--aero-blue)]'
                  : 'text-gray-300 hover:bg-white/10'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          <div className="mx-auto max-w-3xl space-y-5">
            {tab === 'overview' && (
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
                <p className="text-sm leading-relaxed text-gray-300">{project.description}</p>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { v: '∞', l: 'World size', c: 'var(--aero-teal)' },
                    { v: '16³', l: 'Chunk size', c: 'var(--aero-blue)' },
                    { v: '~90%', l: 'Faces culled', c: 'var(--progress-green)' },
                  ].map((s) => (
                    <div key={s.l} className="aero-surface rounded-xl px-3 py-3 text-center">
                      <div className="text-xl font-bold" style={{ color: s.c }}>{s.v}</div>
                      <div className="mt-0.5 text-[11px] uppercase tracking-wide text-gray-400">{s.l}</div>
                    </div>
                  ))}
                </div>
                <TechChips items={project.tech} />
              </>
            )}

            {tab === 'features' && (
              <AnimatedList>
                <ul className="space-y-2">
                  {project.features.map((feature) => (
                    <li key={feature} className="aero-surface flex items-start gap-3 rounded-lg px-4 py-3">
                      <span
                        aria-hidden="true"
                        className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                        style={{ background: 'var(--aero-teal)' }}
                      />
                      <span className="text-[13.5px] text-gray-200">{feature}</span>
                    </li>
                  ))}
                </ul>
              </AnimatedList>
            )}

            {tab === 'code' && (
              <div className="space-y-4">
                <Terminal
                  title="Unity — chunk build log"
                  speed={0.012}
                  lines={[
                    { text: 'unity-orchestrator — build pipeline', tone: 'accent' },
                    { text: 'chunk (128, -4, 64) ... 12,288 blocks', tone: 'default' },
                    { text: 'cave carve ......... ok', tone: 'success' },
                    { text: 'mesh ............... ok  (612 quads, 6,144 tris)', tone: 'success' },
                    { text: 'upload to GPU ....... ok', tone: 'success' },
                    { text: '3 chunks streamed in, 1 released', tone: 'muted' },
                    { text: 'build time 41ms · no GC spikes', tone: 'accent' },
                  ]}
                />

                <div className="space-y-2">
                  <div className="flex flex-wrap gap-1.5">
                    {SNIPPETS.map((s, i) => (
                      <button
                        key={s.file}
                        type="button"
                        onClick={() => setSnippet(i)}
                        className={`rounded-md px-2.5 py-1.5 font-mono text-[11.5px] transition-colors ${
                          snippet === i
                            ? 'bg-[var(--aero-blue)] text-white'
                            : 'aero-surface text-gray-300 hover:bg-white/10'
                        }`}
                      >
                        {s.file}
                      </button>
                    ))}
                  </div>

                  <div className="overflow-hidden rounded-xl border border-white/12 bg-[#0d1117]">
                    <div className="flex items-center justify-between border-b border-white/10 bg-black/40 px-3 py-1.5">
                      <span className="font-mono text-[11px] text-gray-400">
                        {SNIPPETS[snippet].file}
                      </span>
                      <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-gray-400">
                        {SNIPPETS[snippet].language}
                      </span>
                    </div>
                    <pre className="overflow-x-auto p-4 text-[12px] leading-relaxed">
                      <code className="text-gray-200">{SNIPPETS[snippet].code}</code>
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppWindow>
  );
}

export function TechChips({ items }: { items: readonly string[] }) {
  return (
    <div>
      <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--aero-blue-light)]">
        Tech
      </h3>
      <div className="flex flex-wrap gap-1.5">
        {items.map((t) => (
          <span
            key={t}
            className="rounded border border-white/12 bg-black/25 px-2 py-1 text-[11.5px] text-gray-200"
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}
