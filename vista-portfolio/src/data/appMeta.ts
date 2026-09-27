import type { WindowType } from './types';

/**
 * Pure metadata for every app on the desktop.
 *
 * Deliberately contains NO React imports: the window store depends on this
 * module, and the window components depend on the store. Keeping components
 * out of here breaks that cycle.
 */
export interface AppMeta {
  id: string;
  title: string;
  icon: string;
  type?: WindowType;
  size?: { width: number; height: number };
  minSize?: { width: number; height: number };
  resizable?: boolean;
  showInTaskbar?: boolean;
  /** Appears on the Start menu */
  inStartMenu?: boolean;
  /** Section in the Start menu's All Programs */
  category?: 'Games' | 'Development' | 'System';
  /** Extra search keywords */
  keywords?: string[];
}

export const APP_META: Record<string, AppMeta> = {
  welcome: {
    id: 'welcome',
    title: 'Welcome Center',
    icon: '🏠',
    size: { width: 560, height: 620 },
    minSize: { width: 360, height: 420 },
    inStartMenu: true,
    keywords: ['welcome', 'home', 'start'],
  },
  portfolio: {
    id: 'portfolio',
    title: 'Portfolio',
    icon: '📁',
    type: 'folder',
    size: { width: 1060, height: 700 },
    minSize: { width: 420, height: 380 },
    inStartMenu: true,
    keywords: ['portfolio', 'projects', 'work'],
  },
  'ethical-labs': {
    id: 'ethical-labs',
    title: 'Totally Ethical Labs',
    icon: '🎮',
    size: { width: 1020, height: 680 },
    minSize: { width: 420, height: 420 },
    inStartMenu: true,
    category: 'Games',
    keywords: ['game', 'ue5', 'unreal', 'jam', 'alien'],
  },
  'roid-rager': {
    id: 'roid-rager',
    title: 'Roid Rager',
    icon: '🎯',
    size: { width: 1060, height: 700 },
    minSize: { width: 420, height: 420 },
    inStartMenu: true,
    category: 'Games',
    keywords: ['game', 'fps', 'unreal', 'c++', 'wave survival'],
  },
  'voxel-terrain': {
    id: 'voxel-terrain',
    title: 'Voxel Terrain Generator',
    icon: '🧊',
    size: { width: 1060, height: 700 },
    minSize: { width: 420, height: 420 },
    inStartMenu: true,
    category: 'Development',
    keywords: ['unity', 'c#', 'procedural', 'voxel', 'terrain'],
  },
  'web-dev': {
    id: 'web-dev',
    title: 'Web Development',
    icon: '🌐',
    size: { width: 1060, height: 700 },
    minSize: { width: 420, height: 420 },
    inStartMenu: true,
    category: 'Development',
    keywords: ['react', 'typescript', 'threejs', 'web', 'frontend'],
  },
  about: {
    id: 'about',
    title: 'About Me',
    icon: '👤',
    type: 'folder',
    size: { width: 960, height: 680 },
    minSize: { width: 420, height: 380 },
    inStartMenu: true,
    keywords: ['about', 'bio', 'skills', 'education', 'me'],
  },
  resume: {
    id: 'resume',
    title: 'Résumé',
    icon: '📄',
    size: { width: 1000, height: 700 },
    minSize: { width: 420, height: 400 },
    inStartMenu: true,
    keywords: ['cv', 'resume', 'résumé', 'experience', 'education'],
  },
  contact: {
    id: 'contact',
    title: 'Contact',
    icon: '✉️',
    type: 'dialog',
    size: { width: 540, height: 640 },
    minSize: { width: 340, height: 420 },
    inStartMenu: true,
    keywords: ['contact', 'hire', 'email', 'linkedin', 'reach'],
  },
  settings: {
    id: 'settings',
    title: 'Settings',
    icon: '⚙️',
    size: { width: 760, height: 580 },
    minSize: { width: 400, height: 360 },
    inStartMenu: true,
    category: 'System',
    keywords: ['settings', 'preferences', 'theme', 'accessibility', 'sound'],
  },
  run: {
    id: 'run',
    title: 'Run',
    icon: '⌨️',
    type: 'dialog',
    size: { width: 480, height: 340 },
    minSize: { width: 340, height: 280 },
    resizable: false,
    inStartMenu: true,
    category: 'System',
    keywords: ['run', 'command', 'open'],
  },
};

export const APP_IDS = Object.keys(APP_META);

export function getAppMeta(appId: string): AppMeta | undefined {
  return APP_META[appId];
}

export const START_MENU_APPS = APP_IDS.map((id) => APP_META[id]).filter((app) => app.inStartMenu);

export const START_MENU_CATEGORIES: Array<AppMeta['category']> = ['Games', 'Development', 'System'];
