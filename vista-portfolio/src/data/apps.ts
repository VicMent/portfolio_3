import { lazy } from 'react';
// Imported directly rather than through the barrel: re-exporting them from
// `windows/index.ts` would make them statically reachable and defeat the
// code splitting below.
import { WelcomeWindow } from '../components/windows/WelcomeWindow';
import { AboutWindow } from '../components/windows/AboutWindow';
import { PortfolioWindow } from '../components/windows/PortfolioWindow';
import { ContactWindow } from '../components/windows/ContactWindow';
import { SettingsWindow } from '../components/windows/SettingsWindow';
import { APP_META, type AppMeta } from './appMeta';

/**
 * Wires each app's metadata to its React component.
 *
 * Import this only from the render layer (App.tsx). The window store uses
 * `data/appMeta` instead so it never pulls the whole component tree in.
 *
 * The heavier windows (code viewer, canvas globe, media players) are lazily
 * loaded so they land in their own chunks and only download when opened.
 */
const lazyFrom = (loader: () => Promise<Record<string, unknown>>, name: string) =>
  lazy(async () => ({ default: (await loader())[name] as React.ComponentType<any> }));

const COMPONENTS: Record<string, React.ComponentType<any>> = {
  welcome: WelcomeWindow,
  about: AboutWindow,
  portfolio: PortfolioWindow,
  contact: ContactWindow,
  settings: SettingsWindow,
  'ethical-labs': lazyFrom(() => import('../components/windows/EthicalLabsWindow'), 'EthicalLabsWindow'),
  'roid-rager': lazyFrom(() => import('../components/windows/RoidRagerWindow'), 'RoidRagerWindow'),
  'voxel-terrain': lazyFrom(() => import('../components/windows/VoxelTerrainWindow'), 'VoxelTerrainWindow'),
  'web-dev': lazyFrom(() => import('../components/windows/WebDevWindow'), 'WebDevWindow'),
  resume: lazyFrom(() => import('../components/windows/ResumeWindow'), 'ResumeWindow'),
  run: lazyFrom(() => import('../components/windows/RunWindow'), 'RunWindow'),
};

export type AppDefinition = AppMeta & { component: React.ComponentType<any> };

export const APPS: Record<string, AppDefinition> = Object.fromEntries(
  Object.entries(APP_META).map(([id, meta]) => [id, { ...meta, component: COMPONENTS[id] }])
);

export function getApp(appId: string): AppDefinition | undefined {
  return APPS[appId];
}

export { APP_META, getAppMeta, START_MENU_APPS, START_MENU_CATEGORIES, APP_IDS } from './appMeta';
