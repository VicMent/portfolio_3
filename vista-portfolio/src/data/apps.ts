import {
  WelcomeWindow,
  AboutWindow,
  PortfolioWindow,
  EthicalLabsWindow,
  RoidRagerWindow,
  VoxelTerrainWindow,
  WebDevWindow,
  ContactWindow,
  ResumeWindow,
  SettingsWindow,
  RunWindow,
} from '../components/windows';
import { APP_META, type AppMeta } from './appMeta';

/**
 * Wires each app's metadata to its React component.
 *
 * Import this only from the render layer (App.tsx). The window store uses
 * `data/appMeta` instead so it never pulls the whole component tree in.
 */
const COMPONENTS: Record<string, React.ComponentType<any>> = {
  welcome: WelcomeWindow,
  portfolio: PortfolioWindow,
  'ethical-labs': EthicalLabsWindow,
  'roid-rager': RoidRagerWindow,
  'voxel-terrain': VoxelTerrainWindow,
  'web-dev': WebDevWindow,
  about: AboutWindow,
  resume: ResumeWindow,
  contact: ContactWindow,
  settings: SettingsWindow,
  run: RunWindow,
};

export type AppDefinition = AppMeta & { component: React.ComponentType<any> };

export const APPS: Record<string, AppDefinition> = Object.fromEntries(
  Object.entries(APP_META).map(([id, meta]) => [id, { ...meta, component: COMPONENTS[id] }])
);

export function getApp(appId: string): AppDefinition | undefined {
  return APPS[appId];
}

export { APP_META, getAppMeta, START_MENU_APPS, START_MENU_CATEGORIES, APP_IDS } from './appMeta';
