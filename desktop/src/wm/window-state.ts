import type { WindowState, CreateWindowOptions, WindowBounds } from "./types";

/** Create a new window state from options */
export function createWindow(_options: CreateWindowOptions): WindowState {
  throw new Error("Not implemented");
}

/** Update window bounds (position and/or size) */
export function updateBounds(
  _window: WindowState,
  _partial: Partial<WindowBounds>,
): WindowState {
  throw new Error("Not implemented");
}

/** Minimize a window (save current bounds for restore) */
export function minimizeWindow(_window: WindowState): WindowState {
  throw new Error("Not implemented");
}

/** Restore a minimized window to its previous bounds */
export function restoreWindow(_window: WindowState): WindowState {
  throw new Error("Not implemented");
}
