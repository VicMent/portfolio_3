import { portfolioData } from '../../data/portfolio';
import { Github } from '../vista/BrandIcons';

const GROUPS = [
  { title: 'Engines', items: portfolioData.skills.engines.map((e) => e.name), color: 'var(--aero-blue)' },
  { title: 'Code', items: portfolioData.skills.programming.slice(0, 5), color: '#7cc98d' },
  { title: 'Art', items: portfolioData.skills.art.slice(0, 4), color: '#f0a35c' },
];

export function SkillsGadget({ compact = true }: { compact?: boolean }) {
  if (!compact) {
    return <SkillsGadget compact />;
  }

  return (
    <div className="space-y-2.5">
      {GROUPS.map((group) => (
        <div key={group.title}>
          <p
            className="mb-1 text-[10px] font-semibold uppercase tracking-wider"
            style={{ color: group.color }}
          >
            {group.title}
          </p>
          <div className="flex flex-wrap gap-1">
            {group.items.map((item) => (
              <span
                key={item}
                className="rounded border border-white/12 bg-black/25 px-1.5 py-0.5 text-[10.5px] text-white/85"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      ))}

      <a
        href={portfolioData.personal.links.github}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 pt-1 text-[11px] text-white/75 transition-colors hover:text-white"
      >
        <Github size={12} /> @VicMent
      </a>
    </div>
  );
}
