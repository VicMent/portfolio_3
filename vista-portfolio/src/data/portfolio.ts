import type { DesktopIcon, Gadget } from './types';

export interface ProjectControl {
  key: string;
  action: string;
  warning?: boolean;
}

export interface ProjectClip {
  src: string;
  kind: 'video' | 'image';
  label: string;
}

export interface Project {
  id: string;
  title: string;
  tagline: string;
  year: string;
  summary: string;
  description: string;
  /** Preview asset — an image or a video; `isVideo` tells them apart. */
  video: string;
  role: string;
  status: string;
  tech: string[];
  features?: string[];
  controls?: ProjectControl[];
  clips?: ProjectClip[];
  scope?: string;
  team?: string;
  platform?: string;
  links: { itch?: string };
}

export const portfolioData: {
  personal: {
    name: string;
    title: string;
    location: string;
    email: string;
    bio: string;
    personalNote: string;
    photo: string;
    education: Array<{ name: string; school: string; logo: string }>;
    links: {
      github: string;
      githubOld: string;
      linkedin: string;
      itch: string;
      cv: string;
      email: string;
    };
  };
  skills: {
    engines: Array<{ name: string; icon: string }>;
    programming: string[];
    art: string[];
    interests: string[];
  };
  projects: Project[];
  contact: { headline: string; subtext: string; footer: string };
} = {
  personal: {
    name: 'Vic Menten',
    title: 'IT & Indie Game Programmer',
    location: 'Herselt, Belgium',
    email: 'vic.menten@gmail.com',
    bio: "I'm a 22-year-old aspiring developer with a Bachelor's degree in IT and a one-year specialisation in Indie Game Development from Syntra. I pair solid programming skills with hands-on 3D experience, so I can work on both the technical and the creative side of a game.",
    personalNote:
      "Outside of game dev I'm an active gym-goer and a scouts leader, which is where I sharpened my teamwork and leadership.",
    photo: '/me on a mountain top.jpeg',
    education: [
      { name: 'Bachelor IT', school: 'UCLL', logo: '/ucll_logo.png' },
      { name: 'Indie Game Development', school: 'Syntra', logo: '/Synta-logo.png' },
    ],
    links: {
      github: 'https://github.com/VicMent',
      githubOld: 'https://github.com/VicMenten',
      linkedin: 'https://www.linkedin.com/in/vicmenten',
      itch: 'https://vic-ment.itch.io',
      cv: '/Vic_Menten_CV.pdf',
      email: 'mailto:vic.menten@gmail.com',
    },
  },

  skills: {
    engines: [
      { name: 'Unreal Engine 5', icon: '/unreal-engine-white-icon.webp' },
      { name: 'Unity', icon: '/unity-game-engine-icon.webp' },
    ],
    programming: [
      'Gameplay systems',
      'C#',
      'Blueprints',
      'C++',
      'Server management',
      'Web development',
      'Version control',
    ],
    art: ['Modelling', 'Sculpting', 'Retopology', 'Rigging', 'Substance Painter'],
    interests: ['Junior programmer', 'QA / playtest'],
  },

  projects: [
    {
      id: 'ethical-labs',
      title: 'Totally Ethical Labs',
      tagline: 'Specimen 07',
      year: '2026',
      summary: 'Turn an invincible alien into your upgrade fund.',
      description:
        'A one-week game-jam build. You play a lab assistant harvesting an invincible alien for parts; every organ you sell funds the next upgrade. I wrote the majority of the gameplay, my fellow student Bert made the assets, and the tight scope left a few charming bugs in the Windows build.',
      video: '/ethicallabs_project.png',
      role: 'Gameplay programmer',
      team: 'Programming by me, assets by Bert',
      scope: 'One week · game jam',
      platform: 'Windows (no WebGL build)',
      status: 'Shipped',
      controls: [
        { key: 'WASD', action: 'Move' },
        { key: 'E', action: 'Pick up' },
        { key: 'V', action: 'Magnet', warning: true },
        { key: 'LMB', action: 'Attack' },
        { key: 'RMB', action: 'Aim' },
      ],
      tech: ['Unreal Engine 5', 'Blueprints', 'C++'],
      links: { itch: 'https://vic-ment.itch.io/totally-ethical-labs' },
    },
    {
      id: 'roid-rager',
      title: 'Roid Rager',
      tagline: 'Retro-styled FPS wave survival',
      year: '2025 → now',
      summary: 'A wave-survival shooter I am building to stretch my C++ and gameplay-systems ability.',
      description:
        'I learned Unreal at Syntra and Roid Rager is where I put it to work: procedural wave spawning, weapon feel, enemy AI, Niagara VFX and a power system built on the Gameplay Ability System.',
      video: '/RoidRager2.png',
      role: 'Solo developer',
      clips: [
        { src: '/RoidRager3.mp4', kind: 'video', label: 'Gameplay clip' },
        { src: '/RoidRager4.mp4', kind: 'video', label: 'Gameplay clip' },
        { src: '/RoidRager2.png', kind: 'image', label: 'Title screen' },
        { src: '/RoidRager1.png', kind: 'image', label: 'In-game still' },
      ],
      status: 'In progress',
      tech: ['Unreal Engine 5', 'C++', 'Blueprints', 'Niagara', 'Gameplay Ability System'],
      links: {},
    },
    {
      id: 'voxel-terrain',
      title: 'Procedural Voxel Terrain',
      tagline: 'Unity · C# · Perlin noise',
      year: '2024',
      summary: 'An infinite, chunk-based voxel world with caves, water and custom meshing.',
      description:
        'A Bachelor project: chunks stream in and out around the player, terrain comes from layered Perlin noise with procedurally carved caves, meshes are built with exposed-face culling, and I wrote the animated water and portal shaders on top.',
      video: '/unity_project.mp4',
      features: [
        'Chunk streaming around the player',
        'Layered terrain and carved caves',
        'Custom meshes with exposed-face culling',
        'First-person walking and flying',
        'Animated water and portal shaders',
      ],
      tech: ['Unity', 'C#', 'Perlin noise', 'Chunk streaming', 'Compute shaders', 'URP'],
      role: 'Solo developer · Bachelor project',
      status: 'Completed',
      links: {},
    },
    {
      id: 'web-dev',
      title: 'Web Development',
      tagline: 'React · TypeScript · Three.js',
      year: '2023 → now',
      summary: 'Responsive, accessible web experiences — this desktop is one of them.',
      description:
        'I build modular, accessible front-ends with React, TypeScript and Three.js, backed by Node. This portfolio is a windowed desktop environment: real drag-and-resize windows, a taskbar, a Start menu and a sidebar, all on a synthetic audio API and a canvas globe.',
      video: '/website.mp4',
      tech: ['React', 'TypeScript', 'Three.js', 'Node.js', 'Tailwind CSS', 'Vite', 'Zustand'],
      role: 'Freelance / personal',
      status: 'Ongoing',
      links: {},
    },
  ],

  contact: {
    headline: "Let's talk",
    subtext: 'Open to junior and entry-level roles: gameplay programming, generalist IT, QA.',
    footer: '© 2026 Vic Menten · Herselt, Belgium',
  },
};

export const desktopIcons: DesktopIcon[] = [
  { id: 'ethical-labs', appId: 'ethical-labs', label: 'Ethical Labs', icon: '🎮', position: { x: 12, y: 12 } },
  { id: 'roid-rager', appId: 'roid-rager', label: 'Roid Rager', icon: '🎯', position: { x: 12, y: 104 } },
  { id: 'voxel-terrain', appId: 'voxel-terrain', label: 'Voxel Terrain', icon: '🧊', position: { x: 12, y: 196 } },
  { id: 'web-dev', appId: 'web-dev', label: 'Web Dev', icon: '🌐', position: { x: 12, y: 288 } },
  { id: 'about', appId: 'about', label: 'About Me', icon: '👤', position: { x: 12, y: 380 } },
  { id: 'resume', appId: 'resume', label: 'Résumé', icon: '📄', position: { x: 12, y: 472 } },
  { id: 'contact', appId: 'contact', label: 'Contact', icon: '✉️', position: { x: 12, y: 564 } },
];

export const sidebarGadgets: Gadget[] = [
  { id: 'clock', name: 'Clock', icon: '🕐', component: 'ClockGadget', isDocked: true },
  { id: 'skills', name: 'Skills', icon: '⚡', component: 'SkillsGadget', isDocked: true },
  { id: 'system', name: 'System', icon: '📈', component: 'SystemGadget', isDocked: true },
  { id: 'weather', name: 'Weather', icon: '⛅', component: 'WeatherGadget', isDocked: true },
];
