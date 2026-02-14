import type { WindowType, WindowBounds, WindowId } from "../wm/types";

/** 8x8 pixel-art bitmap: array of 8 numbers, each an 8-bit bitmask for one row */
export type PixelBitmap = readonly [number, number, number, number, number, number, number, number];

/** Definition of a desktop icon for a module */
export interface DesktopIconDef {
  type: WindowType;
  label: string;
  bitmap: PixelBitmap;
  defaultBounds: WindowBounds;
}

/** Status of a background process (for taskbar indicators) */
export type ProcessStatus = "running" | "paused" | "idle" | "stopped" | "error";

/** A running process shown in the taskbar */
export interface ProcessIndicator {
  id: string;
  label: string;
  status: ProcessStatus;
}

/** Entry in the taskbar representing an open/minimized window */
export interface TaskbarEntry {
  windowId: WindowId;
  type: WindowType;
  title: string;
  minimized: boolean;
  focused: boolean;
}

/** Menu item in the system menu */
export interface MenuItem {
  id: string;
  label: string;
  shortcut?: string;
  action: () => void;
  separator?: boolean;
  disabled?: boolean;
}

/** Menu section with a header and items */
export interface MenuSection {
  title: string;
  items: MenuItem[];
}

/** Keyboard shortcut definition */
export interface KeyBinding {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  action: string;
  handler: () => void;
}
