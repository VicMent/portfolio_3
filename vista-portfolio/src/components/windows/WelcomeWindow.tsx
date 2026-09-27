import { useWindowStore } from '../../stores/windowStore';
import { portfolioData } from '../../data/portfolio';
import { AppWindow } from './AppWindow';
import { AuroraText } from '../magicui/AuroraText';
import { IconCloud } from '../magicui/IconCloud';
import { BorderBeam } from '../magicui/BorderBeam';
import { Github, Linkedin } from '../vista/BrandIcons';
import { Gamepad2, Mail, FileText, FolderOpen } from 'lucide-react';

const STATS = [
  { value: '3', label: 'Engines', color: 'var(--aero-blue)' },
  { value: '4', label: 'Projects', color: 'var(--aero-teal)' },
  { value: '2', label: 'Degrees', color: 'var(--progress-green)' },
];

const SOCIALS = [
  { label: 'GitHub', href: portfolioData.personal.links.github, Icon: Github },
  { label: 'LinkedIn', href: portfolioData.personal.links.linkedin, Icon: Linkedin },
  { label: 'itch.io', href: portfolioData.personal.links.itch, Icon: Gamepad2 },
  { label: 'Email', href: portfolioData.personal.links.email, Icon: Mail },
];

export function WelcomeWindow({ window: win }: { window: any }) {
  const openWindow = useWindowStore((s) => s.openWindow);
  const { personal } = portfolioData;

  return (
    <AppWindow scroll={false}>
      <div className="relative flex h-full flex-col items-center justify-center gap-4 overflow-y-auto px-6 py-6 text-center sm:px-8">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <BorderBeam size={3} duration={6} />
        </div>

        <div className="relative z-10 w-full max-w-md space-y-5">
          <div className="relative mx-auto h-20 w-20">
            <div className="aero-surface flex h-full w-full items-center justify-center rounded-2xl text-4xl shadow-[0_0_24px_var(--aero-glow)]">
              👨‍💻
            </div>
            <BorderBeam size={2} duration={4} colorFrom="#00b4b4" colorTo="#0078d7" />
          </div>

          <div>
            <AuroraText className="block text-4xl font-extrabold tracking-tight">
              {personal.name}
            </AuroraText>
            <p className="mt-2 text-lg font-medium text-[var(--aero-blue-light)]">{personal.title}</p>
            <p className="mt-1 text-sm text-gray-400">{personal.location}</p>
          </div>

          <p className="text-sm leading-relaxed text-gray-300">{personal.bio}</p>

          <div className="grid grid-cols-3 gap-3">
            {STATS.map((stat) => (
              <div key={stat.label} className="aero-surface rounded-xl px-2 py-3">
                <div className="text-2xl font-bold" style={{ color: stat.color }}>
                  {stat.value}
                </div>
                <div className="mt-0.5 text-[11px] uppercase tracking-wide text-gray-400">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => openWindow('portfolio')}
              className="aero-button-primary inline-flex items-center gap-2 rounded-lg px-6 py-3 font-medium transition-transform hover:scale-105"
            >
              <FolderOpen size={17} />
              Launch Portfolio
            </button>
            <button
              type="button"
              onClick={() => openWindow('resume')}
              className="aero-button inline-flex items-center gap-2 rounded-lg px-6 py-3 font-medium transition-transform hover:scale-105"
            >
              <FileText size={17} />
              View Résumé
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            {SOCIALS.map(({ label, href, Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="aero-surface flex h-10 w-10 items-center justify-center rounded-lg transition-colors hover:border-[var(--aero-blue)]"
              >
                <Icon size={18} className="text-gray-200" />
              </a>
            ))}
          </div>

          <div>
            <IconCloud
              gap={2}
              icons={[
                { name: 'Unreal Engine 5', color: '#8ab4f8', size: 'sm' },
                { name: 'Unity', color: '#cfd8e3', size: 'sm' },
                { name: 'C#', color: '#5cc98d', size: 'sm' },
                { name: 'TypeScript', color: '#5cc9f0', size: 'sm' },
                { name: 'React', color: '#5cc9f0', size: 'sm' },
                { name: 'Blender', color: '#f0a35c', size: 'sm' },
              ]}
            />
          </div>

          <p className="rounded-lg aero-surface px-4 py-2.5 text-xs text-gray-400">
            <span className="text-[var(--aero-blue-light)]">Tip:</span> double-click desktop icons, press{' '}
            <kbd className="rounded aero-surface px-1">Start</kbd> to browse, or hit{' '}
            <kbd className="rounded aero-surface px-1">Win</kbd> + <kbd className="rounded aero-surface px-1">Tab</kbd>{' '}
            for Flip 3D.
          </p>
        </div>
      </div>
    </AppWindow>
  );
}
