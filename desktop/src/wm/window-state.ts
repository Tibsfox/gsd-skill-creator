import type { WindowState, CreateWindowOptions, WindowBounds } from "./types";
import { DEFAULT_WINDOW_BOUNDS, MIN_WINDOW_WIDTH, MIN_WINDOW_HEIGHT } from "./types";

/** Create a new window state from options */
export function createWindow(options: CreateWindowOptions): WindowState {
  return {
    id: options.id,
    type: options.type,
    title: options.title,
    bounds: {
      ...DEFAULT_WINDOW_BOUNDS,
      ...options.bounds,
    },
    minimized: false,
    restoreBounds: null,
  };
}

/** Update window bounds (position and/or size) */
export function updateBounds(
  window: WindowState,
  partial: Partial<WindowBounds>,
): WindowState {
  return {
    ...window,
    bounds: {
      x: partial.x ?? window.bounds.x,
      y: partial.y ?? window.bounds.y,
      width: Math.max(partial.width ?? window.bounds.width, MIN_WINDOW_WIDTH),
      height: Math.max(partial.height ?? window.bounds.height, MIN_WINDOW_HEIGHT),
    },
  };
}

/** Minimize a window (save current bounds for restore) */
export function minimizeWindow(window: WindowState): WindowState {
  if (window.minimized) {
    return window;
  }
  return {
    ...window,
    minimized: true,
    restoreBounds: window.bounds,
  };
}

/** Restore a minimized window to its previous bounds */
export function restoreWindow(window: WindowState): WindowState {
  if (!window.minimized) {
    return window;
  }
  return {
    ...window,
    minimized: false,
    bounds: window.restoreBounds ?? window.bounds,
    restoreBounds: null,
  };
}
