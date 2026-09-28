import { useState } from 'react';
import { cn } from '../../utils/helpers';
import { portfolioData } from '../../data/portfolio';
import { useWindowStore } from '../../stores/windowStore';
import { FolderWindow } from './FolderWindow';
import { AuroraText } from '../magicui/AuroraText';
import { BorderBeam } from '../magicui/BorderBeam';
import { AnimatedList } from '../magicui/AnimatedList';
import { Github, Linkedin } from '../vista/BrandIcons';
import { Gamepad2, Mail, FileText, ExternalLink } from 'lucide-react';

type Tab = 'profile' | 'skills' | 'education';

const TABS: Array<{ id: Tab; label: string; icon: string }> = [
  { id: 'profile', label: 'Profile', icon: '👤' },
  { id: 'skills', label: 'Skills', icon: '⚡' },
  { id: 'education', label: 'Education', icon: '🎓' },
];

export function AboutWindow() {
  const [tab, setTab] = useState<Tab>('profile');
  const openWindow = useWindowStore((s) => s.openWindow);
  const { personal, skills } = portfolioData;

  const navigation = (
    <ul className="space-y-0.5">
      {TABS.map((item) => (
        <li key={item.id}>
          <button
            type="button"
            onClick={() => setTab(item.id)}
            aria-current={tab === item.id}
            className={cn(
              'flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-[13px] transition-colors',
              tab === item.id
                ? 'bg-[var(--selection-blue)] font-medium text-[var(--text-primary)] ring-1 ring-[var(--aero-blue)]'
                : 'text-[var(--text-secondary)] hover:bg-white/10'
            )}
          >
            <span aria-hidden="true">{item.icon}</span>
            {item.label}
          </button>
        </li>
      ))}
    </ul>
  );

  const contactRow = [
    { label: 'LinkedIn', href: personal.links.linkedin, Icon: Linkedin, tint: '#0a66c2' },
    { label: 'GitHub', href: personal.links.github, Icon: Github, tint: '#e6edf3' },
    { label: 'itch.io', href: personal.links.itch, Icon: Gamepad2, tint: '#fa5c5c' },
    { label: 'Email', href: personal.links.email, Icon: Mail, tint: '#ea4335' },
  ];

  return (
    <FolderWindow navigation={navigation} breadcrumb="Vic Menten ▸ About Me" status="About">
      {tab === 'profile' && (
        <div className="max-w-3xl space-y-6">
          <div className="flex flex-col items-center gap-6 sm:flex-row">
            <div className="relative h-32 w-32 shrink-0">
              <div className="aero-surface absolute inset-0 rounded-xl" aria-hidden="true">
                <BorderBeam size={2} duration={5} />
              </div>
              <img
                src={personal.photo}
                alt={personal.name}
                className="relative h-full w-full rounded-xl object-cover"
              />
            </div>

            <div className="min-w-0 flex-1 text-center sm:text-left">
              <AuroraText className="block text-2xl font-extrabold tracking-tight">
                {personal.name}
              </AuroraText>
              <p className="mt-1 font-medium text-[var(--aero-blue-light)]">{personal.title}</p>
              <p className="mt-1 text-sm text-[var(--text-muted)]">{personal.location}</p>

              <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
                {contactRow.map(({ label, href, Icon, tint }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="aero-surface flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] text-[var(--text-primary)] transition-colors hover:border-[var(--aero-blue)] hover:text-[var(--text-primary)]"
                  >
                    <Icon size={12} style={{ color: tint }} />
                    {label}
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div className="aero-surface rounded-xl px-5 py-4">
            <h3 className="mb-2 text-sm font-semibold text-[var(--text-primary)]">About me</h3>
            <p className="text-sm leading-relaxed text-[var(--text-secondary)]">{personal.bio}</p>
            <p className="mt-3 text-sm leading-relaxed text-[var(--text-muted)]">{personal.personalNote}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { value: '22', label: 'Years old', color: 'var(--aero-blue)' },
              { value: '2', label: 'Programmes', color: 'var(--aero-teal)' },
              { value: '4', label: 'Projects', color: 'var(--progress-green)' },
            ].map((stat) => (
              <div key={stat.label} className="aero-surface rounded-xl px-3 py-4 text-center">
                <div className="text-2xl font-bold" style={{ color: stat.color }}>
                  {stat.value}
                </div>
                <div className="mt-0.5 text-[11px] uppercase tracking-wide text-[var(--text-muted)]">{stat.label}</div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => openWindow('contact')}
            className="aero-button-primary flex w-full items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium"
          >
            <Mail size={15} /> Get in touch
          </button>
        </div>
      )}

      {tab === 'skills' && (
        <div className="max-w-3xl space-y-5">
          <AuroraText className="block text-lg font-bold">Technical &amp; creative skills</AuroraText>

          <AnimatedList>
            <div className="aero-surface rounded-xl px-5 py-4">
              <h4 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--aero-blue-light)]">
                Game engines
              </h4>
              <div className="flex flex-wrap gap-3">
                {skills.engines.map((engine) => (
                  <div
                    key={engine.name}
                    className="flex items-center gap-2 rounded-lg border border-white/15 bg-[var(--surface-raised)] px-3 py-2"
                  >
                    <img src={engine.icon} alt="" className="h-6 w-6 object-contain" loading="lazy" />
                    <span className="text-[13px] text-[var(--text-primary)]">{engine.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <SkillRow title="Programming" items={skills.programming} />
            <SkillRow title="3D & art" items={skills.art} />
            <SkillRow title="Interested in" items={skills.interests} accent="var(--progress-green)" />

            <div className="aero-surface rounded-xl px-5 py-4">
              <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--aero-blue-light)]">
                Code
              </h4>
              <div className="flex flex-wrap gap-2">
                <a
                  href={personal.links.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-full border border-white/15 bg-[var(--surface-raised)] px-3 py-1.5 text-[12px] text-[var(--text-primary)] transition-colors hover:border-[var(--aero-blue)]"
                >
                  <Github size={13} /> @VicMent
                </a>
                <a
                  href={personal.links.githubOld}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-full border border-white/15 bg-[var(--surface-raised)] px-3 py-1.5 text-[12px] text-[var(--text-muted)] transition-colors hover:border-[var(--aero-blue)]"
                >
                  <Github size={13} /> Older account
                </a>
              </div>
            </div>
          </AnimatedList>
        </div>
      )}

      {tab === 'education' && (
        <div className="max-w-3xl space-y-5">
          <AuroraText className="block text-lg font-bold">Education</AuroraText>

          <AnimatedList>
            {personal.education.map((edu) => (
              <div key={edu.school} className="aero-surface flex items-center gap-4 rounded-xl px-5 py-4">
                <img
                  src={edu.logo}
                  alt=""
                  className="h-14 w-14 shrink-0 rounded-lg bg-white/90 object-contain p-1.5"
                  loading="lazy"
                />
                <div className="min-w-0">
                  <p className="font-semibold text-[var(--text-primary)]">{edu.name}</p>
                  <p className="text-sm text-[var(--aero-blue-light)]">{edu.school}</p>
                </div>
              </div>
            ))}

            <div className="aero-surface rounded-xl px-5 py-4">
              <h4 className="mb-2 text-sm font-semibold text-[var(--text-primary)]">Also studied</h4>
              <ul className="space-y-1.5 text-sm text-[var(--text-secondary)]">
                <li>· One-year specialisation in Indie Game Development (Syntra)</li>
                <li>· Self-taught web development — React, TypeScript, Node</li>
                <li>· 3D art through Blender and Substance Painter</li>
              </ul>
            </div>

            <button
              type="button"
              onClick={() => openWindow('resume')}
              className="aero-button flex w-full items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm"
            >
              <FileText size={15} /> See the full résumé <ExternalLink size={13} />
            </button>
          </AnimatedList>
        </div>
      )}
    </FolderWindow>
  );
}

function SkillRow({
  title,
  items,
  accent = 'var(--aero-blue-light)',
}: {
  title: string;
  items: readonly string[];
  accent?: string;
}) {
  return (
    <div className="aero-surface rounded-xl px-5 py-4">
      <h4
        className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider"
        style={{ color: accent }}
      >
        {title}
      </h4>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item) => (
          <span
            key={item}
            className="rounded-md border border-[var(--surface-border)] bg-[var(--surface-raised)] px-2 py-1 text-[12px] text-[var(--text-primary)]"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
