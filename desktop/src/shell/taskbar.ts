import type { TaskbarEntry, ProcessIndicator } from "./types";

/** Callback when a taskbar window entry is clicked */
export type TaskbarClickCallback = (windowId: string) => void;

/** Handle for interacting with the taskbar after creation */
export interface TaskbarHandle {
  /** The taskbar DOM element */
  element: HTMLDivElement;
  /** Update the window entries displayed */
  updateEntries: (entries: readonly TaskbarEntry[]) => void;
  /** Update the process indicators displayed */
  updateIndicators: (indicators: readonly ProcessIndicator[]) => void;
  /** Destroy and clean up */
  destroy: () => void;
}

/**
 * Create the taskbar component.
 *
 * Renders at the bottom of the desktop with:
 * - Left: System menu button (placeholder for Plan 03)
 * - Center: Window entry buttons (open/minimized windows)
 * - Right: Process indicators (Claude, watcher, terminal)
 *
 * @param onClick - Called when a window entry is clicked
 */
export function createTaskbar(
  _onClick: TaskbarClickCallback,
): TaskbarHandle {
  throw new Error("Not implemented");
}
