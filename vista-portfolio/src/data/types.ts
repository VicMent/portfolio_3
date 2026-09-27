export type WindowType = 'app' | 'folder' | 'dialog' | 'gadget';

export interface WindowState {
  id: string;
  appId: string;
  title: string;
  type: WindowType;
  icon: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  /** Size to restore to when un-maximizing */
  restoreSize?: { width: number; height: number };
  isMinimized: boolean;
  isMaximized: boolean;
  isFocused: boolean;
  zIndex: number;
  isResizable: boolean;
  isMovable: boolean;
  showInTaskbar: boolean;
  minWidth: number;
  minHeight: number;
  props?: Record<string, unknown>;
}

export type WindowId = string;

export interface DesktopIcon {
  id: string;
  appId: string;
  label: string;
  icon: string;
  position: { x: number; y: number };
  isSelected?: boolean;
}

export interface Gadget {
  id: string;
  name: string;
  icon: string;
  component: string;
  isDocked: boolean;
}

export type ViewMode = 'icons' | 'list' | 'details' | 'tiles';
