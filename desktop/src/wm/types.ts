/** Unique window identifier */
export type WindowId = string;

/** Supported window types in GSD-OS */
export type WindowType =
  | "dashboard"
  | "terminal"
  | "console"
  | "staging"
  | "settings"
  | "aminet";

/** Window position and dimensions */
export interface WindowBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Minimum window dimensions */
export const MIN_WINDOW_WIDTH = 200;
export const MIN_WINDOW_HEIGHT = 150;

/** Default window dimensions */
export const DEFAULT_WINDOW_BOUNDS: WindowBounds = {
  x: 50,
  y: 50,
  width: 640,
  height: 480,
};

/** State of a single managed window */
export interface WindowState {
  id: WindowId;
  type: WindowType;
  title: string;
  bounds: WindowBounds;
  minimized: boolean;
  /** Bounds before minimize (for restore) */
  restoreBounds: WindowBounds | null;
}

/** Options for creating a new window */
export interface CreateWindowOptions {
  id: WindowId;
  type: WindowType;
  title: string;
  bounds?: Partial<WindowBounds>;
}

/** The z-order stack: array of WindowIds from back (index 0) to front (last index) */
export type ZStack = readonly WindowId[];
