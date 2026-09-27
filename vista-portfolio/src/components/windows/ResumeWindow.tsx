import { useState } from 'react';
import { portfolioData } from '../../data/portfolio';
import { AppWindow } from './AppWindow';
import { AuroraText } from '../magicui/AuroraText';
import { BorderBeam } from '../magicui/BorderBeam';
import { Github, Linkedin } from '../vista/BrandIcons';
import { Gamepad2, Mail, FileText, Download, Printer, ExternalLink } from 'lucide-react';

type SectionId = 'profile' | 'experience' | 'skills' | 'projects';

const SECTIONS: Array<{ id: SectionId; label: string; icon: string }> = [
  { id: 'profile', label: 'Profile', icon: '👤' },
  { id: 'experience', label: 'Experience', icon: '💼' },
  { id: 'skills', label: 'Skills', icon: '⚡' },
  { id: 'projects', label: 'Projects', icon: '📁' },
];

const SKILLS: Array<{ name: string; level: number; color: string }> = [
  { name: 'C# / .NET', level: 90, color: '#5cc98d' },
  { name: 'Git / Version Control', level: 90, color: '#f0817a' },
  { name: 'React / TypeScript', level: 88, color: '#5cc9f0' },
  { name: 'Unity', level: 85, color: '#cfd8e3' },
  { name: 'Blueprints', level: 85, color: '#6cb6ff' },
  { name: 'Node.js / Backend', level: 80, color: '#7cc98d' },
  { name: 'Unreal Engine 5', level: 80, color: '#8ab4f8' },
  { name: 'Three.js / WebGL', level: 75, color: '#e0c07a' },
  { name: 'Blender / 3D Art', level: 70, color: '#f0a35c' },
  { name: 'Substance Painter', level: 68, color: '#d69cf0' },
];

const CREATIVE: Array<{ name: string; level: number }> = [
  { name: '3D modelling (Blender)', level: 75 },
  { name: 'Sculpting & retopology', level: 68 },
  { name: 'Rigging & animation', level: 58 },
  { name: 'Texturing / materials', level: 70 },
  { name: 'Shader authoring (HLSL / ShaderGraph)', level: 65 },
  { name: 'Procedural generation', level: 82 },
  { name: 'VFX (Niagara / particles)', level: 70 },
];

const EXPERIENCE = [
  {
    role: 'Gameplay Programmer',
    org: 'Totally Ethical Labs',
    when: '2026 · One-week game jam',
    stack: 'Unreal Engine 5 · Blueprints · C++',
    body: 'Built the majority of the gameplay for a Windows build: player controls, enemy AI, the upgrade economy and the magnet mechanic. Collaborated with a fellow student who produced the assets. Shipped in a week, so a few charming bugs remain.',
  },
  {
    role: 'Game Developer — Roid Rager',
    org: 'Personal project',
    when: '2025 → present',
    stack: 'Unreal Engine 5 · C++ · Niagara · Gameplay Ability System',
    body: 'A retro-styled FPS wave-survival game. Implementing procedural wave spawning, weapon feel, enemy AI, particle VFX and a power system built on the Gameplay Ability System.',
  },
  {
    role: 'Unity Developer',
    org: 'Procedural Voxel Terrain Generator',
    when: '2024 · Bachelor project, UCLL',
    stack: 'Unity · C# · URP · Compute Shaders',
    body: 'An infinite, chunk-based voxel world: streaming chunks around the player, Perlin-noise terrain with carved caves, custom mesh generation with face culling, animated water and portal shaders, plus first-person walk and fly modes.',
  },
  {
    role: 'Web Developer',
    org: 'Freelance / personal',
    when: '2023 → present',
    stack: 'React · TypeScript · Three.js · Node.js · Tailwind',
    body: 'Responsive, accessible web experiences. This desktop portfolio is the most recent one — a windowed desktop environment built with React, Zustand and Tailwind.',
  },
];

const PROJECTS = [
  {
    title: 'Totally Ethical Labs',
    meta: 'UE5 jam · 1 week · team of 2',
    body: 'A game-jam entry where you turn an invincible alien into your upgrade fund. I owned programming; Bert made the assets.',
    href: 'https://vic-ment.itch.io/totally-ethical-labs',
  },
  {
    title: 'Roid Rager',
    meta: 'Unreal Engine 5 · in progress',
    body: 'A retro-styled FPS wave-survival game I am building to push my C++ and gameplay-systems ability.',
    href: null,
  },
  {
    title: 'Procedural Voxel Terrain Generator',
    meta: 'Unity · C# · bachelor project',
    body: 'Infinite chunk-based voxel terrain with caves, custom meshing and water/portal shaders.',
    href: null,
  },
];

export function ResumeWindow({ window: win }: { window: any }) {
  const [section, setSection] = useState<SectionId>('profile');
  const { personal, projects } = portfolioData;
  const { links } = personal;

  const print = () => window.open(links.cv, '_blank', 'noopener');

  const contactRow = [
    { Icon: Mail, label: 'vic.menten@gmail.com', href: `mailto:${personal.email}` },
    { Icon: Linkedin, label: 'linkedin.com/in/vicmenten', href: links.linkedin },
    { Icon: Github, label: 'github.com/VicMent', href: links.github },
    { Icon: Gamepad2, label: 'vic-ment.itch.io', href: links.itch },
  ];

  return (
    <AppWindow scroll={false}>
      <div className="flex h-full min-h-0">
        {/* Sidebar */}
        <nav className="hidden w-52 shrink-0 flex-col border-r border-[var(--glass-border)] bg-black/25 p-2 sm:flex">
          {SECTIONS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSection(item.id)}
              aria-current={section === item.id}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                section === item.id
                  ? 'bg-[var(--selection-blue)] font-medium text-white ring-1 ring-[var(--aero-blue)]'
                  : 'text-gray-300 hover:bg-white/10'
              }`}
            >
              <span aria-hidden="true">{item.icon}</span>
              {item.label}
            </button>
          ))}

          <div className="mt-auto space-y-1 pt-4">
            <button type="button" onClick={() => window.open(links.cv, '_blank', 'noopener')} className="aero-button flex w-full items-center justify-center gap-2 rounded-lg text-xs">
              <Download size={13} /> Download PDF
            </button>
            <button type="button" onClick={print} className="aero-button flex w-full items-center justify-center gap-2 rounded-lg text-xs">
              <Printer size={13} /> Open CV
            </button>
          </div>
        </nav>

        {/* Content */}
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="relative shrink-0 border-b border-[var(--glass-border)] bg-white/5 px-6 py-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-center gap-4">
                <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-xl aero-surface">
                  <FileText size={26} className="text-[var(--aero-teal)]" />
                  <BorderBeam size={2} duration={4} />
                </div>
                <div className="min-w-0">
                  <AuroraText className="block text-2xl font-extrabold tracking-tight">
                    {personal.name}
                  </AuroraText>
                  <p className="text-sm font-medium text-[var(--aero-blue-light)]">{personal.title}</p>
                  <p className="text-xs text-gray-400">{personal.location}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => window.open(links.cv, '_blank', 'noopener')}
                className="aero-button-primary hidden shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-xs sm:inline-flex"
              >
                <Download size={13} /> PDF
              </button>
            </div>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
            <div className="mx-auto max-w-2xl space-y-6">
              {/* Mobile section switcher */}
              <div className="flex flex-wrap gap-1 sm:hidden">
                {SECTIONS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSection(item.id)}
                    className={`rounded-full px-3 py-1 text-xs transition-colors ${
                      section === item.id ? 'bg-[var(--aero-blue)] text-white' : 'aero-surface text-gray-300'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {section === 'profile' && (
                <div className="space-y-5">
                  <div className="flex flex-col gap-5 sm:flex-row">
                    <img
                      src={personal.photo}
                      alt={`${personal.name}`}
                      className="h-40 w-40 shrink-0 rounded-xl object-cover ring-1 ring-white/15"
                      loading="lazy"
                    />
                    <div className="min-w-0 space-y-3 text-sm leading-relaxed text-gray-300">
                      <p>{personal.bio}</p>
                      <p className="text-gray-400">{personal.personalNote}</p>
                    </div>
                  </div>

                  <div className="aero-surface rounded-xl px-5 py-4">
                    <h3 className="mb-3 text-sm font-semibold text-white">Contact</h3>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {contactRow.map(({ Icon, label, href }) => (
                        <a
                          key={label}
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-[13px] text-gray-300 transition-colors hover:text-white"
                        >
                          <Icon size={14} className="shrink-0 text-[var(--aero-blue)]" />
                          <span className="truncate">{label}</span>
                        </a>
                      ))}
                    </div>
                  </div>

                  <div className="aero-surface rounded-xl px-5 py-4">
                    <h3 className="mb-3 text-sm font-semibold text-white">Education</h3>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {personal.education.map((edu) => (
                        <div key={edu.school} className="flex items-center gap-3">
                          <img
                            src={edu.logo}
                            alt=""
                            className="h-12 w-12 shrink-0 rounded-lg bg-white/90 object-contain p-1"
                            loading="lazy"
                          />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-white">{edu.name}</p>
                            <p className="text-xs text-[var(--aero-blue-light)]">{edu.school}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {section === 'experience' && (
                <ol className="space-y-4">
                  {EXPERIENCE.map((job) => (
                    <li key={job.role} className="aero-surface rounded-xl border-l-2 border-l-[var(--aero-blue)] px-5 py-4">
                      <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                        <h3 className="text-base font-semibold text-white">{job.role}</h3>
                        <span className="text-[11px] text-gray-400">{job.when}</span>
                      </div>
                      <p className="text-sm text-[var(--aero-blue-light)]">{job.org}</p>
                      <p className="mt-1 font-mono text-[11px] text-gray-500">{job.stack}</p>
                      <p className="mt-2 text-sm leading-relaxed text-gray-300">{job.body}</p>
                    </li>
                  ))}
                </ol>
              )}

              {section === 'skills' && (
                <div className="space-y-6">
                  <div className="aero-surface rounded-xl px-5 py-4">
                    <h3 className="mb-4 text-sm font-semibold text-white">Technical</h3>
                    <div className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
                      {SKILLS.map((skill) => (
                        <div key={skill.name}>
                          <div className="mb-1 flex items-center justify-between text-[13px]">
                            <span className="truncate text-gray-300">{skill.name}</span>
                            <span className="ml-2 shrink-0 font-mono text-[11px] text-gray-400">
                              {skill.level}
                            </span>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-black/40">
                            <div
                              className="h-full rounded-full transition-[width] duration-700"
                              style={{
                                width: `${skill.level}%`,
                                background: `linear-gradient(90deg, ${skill.color}, ${skill.color}aa)`,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="aero-surface rounded-xl px-5 py-4">
                    <h3 className="mb-4 text-sm font-semibold text-white">Creative</h3>
                    <div className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
                      {CREATIVE.map((skill) => (
                        <div key={skill.name}>
                          <div className="mb-1 flex items-center justify-between text-[13px]">
                            <span className="truncate text-gray-300">{skill.name}</span>
                            <span className="ml-2 shrink-0 font-mono text-[11px] text-gray-400">
                              {skill.level}
                            </span>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-black/40">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-[var(--aero-teal)] to-[#5cb85c]"
                              style={{ width: `${skill.level}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {section === 'projects' && (
                <div className="space-y-3">
                  {PROJECTS.map((project) => (
                    <article key={project.title} className="aero-surface rounded-xl px-5 py-4">
                      <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                        <h3 className="text-base font-semibold text-white">{project.title}</h3>
                        <span className="text-[11px] text-gray-400">{project.meta}</span>
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-gray-300">{project.body}</p>
                      {project.href && (
                        <a
                          href={project.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 inline-flex items-center gap-1.5 text-xs text-[var(--aero-blue-light)] hover:underline"
                        >
                          Play on itch.io <ExternalLink size={12} />
                        </a>
                      )}
                    </article>
                  ))}

                  <div className="aero-surface rounded-xl px-5 py-4">
                    <h3 className="mb-2 text-sm font-semibold text-white">In this portfolio</h3>
                    <p className="text-sm text-gray-400">
                      {projects.length} projects, each opening as a window you can drag, resize,
                      minimise and tile inside this desktop.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppWindow>
  );
}
