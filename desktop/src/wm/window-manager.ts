import type { WindowId, WindowType, WindowState, WindowBounds, ZStack, CreateWindowOptions } from "./types";
import type { WindowChromeElements, GadgetAction } from "./window-chrome";
import type { Cleanup } from "./drag-resize";

/** Options for opening a window */
export interface OpenWindowOptions {
  type: WindowType;
  title: string;
  bounds?: Partial<WindowBounds>;
}

/** Desktop icon for a minimized window */
export interface DesktopIcon {
  id: WindowId;
  type: WindowType;
  title: string;
  element: HTMLDivElement;
}

/** Event types emitted by WindowManager */
export type WMEvent =
  | { type: "window-opened"; windowId: WindowId }
  | { type: "window-closed"; windowId: WindowId }
  | { type: "window-focused"; windowId: WindowId }
  | { type: "window-minimized"; windowId: WindowId }
  | { type: "window-restored"; windowId: WindowId }
  | { type: "window-moved"; windowId: WindowId; bounds: WindowBounds }
  | { type: "window-resized"; windowId: WindowId; bounds: WindowBounds }
  | { type: "depth-cycled"; windowId: WindowId };

export type WMEventListener = (event: WMEvent) => void;

/**
 * Window Manager: orchestrates multiple in-app windows with Amiga-style chrome.
 *
 * Manages window state, z-order, chrome creation/destruction, drag/resize
 * wiring, minimize-to-icon, and depth cycling.
 */
export class WindowManager {
  /**
   * @param container - The desktop container element where windows are mounted
   * @param iconContainer - The area where minimized window icons appear
   */
  constructor(
    _container: HTMLElement,
    _iconContainer: HTMLElement,
  ) {
    // stub
  }

  /** Open a new window. Returns the window ID and the content container. */
  openWindow(_options: OpenWindowOptions): { id: WindowId; content: HTMLElement } {
    throw new Error("Not implemented");
  }

  /** Close a window by ID */
  closeWindow(_id: WindowId): void {
    throw new Error("Not implemented");
  }

  /** Get a window's current state */
  getWindowState(_id: WindowId): WindowState | undefined {
    throw new Error("Not implemented");
  }

  /** Get all window states */
  getAllWindows(): WindowState[] {
    throw new Error("Not implemented");
  }

  /** Get the current z-order stack */
  getZStack(): ZStack {
    throw new Error("Not implemented");
  }

  /** Get content element for a window */
  getContentElement(_id: WindowId): HTMLElement | undefined {
    throw new Error("Not implemented");
  }

  /** Depth-cycle a window (Amiga-style) */
  depthCycleWindow(_id: WindowId): void {
    throw new Error("Not implemented");
  }

  /** Minimize a window to desktop icon */
  minimizeWindow(_id: WindowId): void {
    throw new Error("Not implemented");
  }

  /** Restore a minimized window */
  restoreWindow(_id: WindowId): void {
    throw new Error("Not implemented");
  }

  /** Focus a window (bring to front) */
  focusWindow(_id: WindowId): void {
    throw new Error("Not implemented");
  }

  /** Subscribe to window manager events */
  on(_listener: WMEventListener): Cleanup {
    throw new Error("Not implemented");
  }

  /** Get all desktop icons (minimized windows) */
  getDesktopIcons(): DesktopIcon[] {
    throw new Error("Not implemented");
  }

  /** Destroy all windows and clean up */
  destroy(): void {
    throw new Error("Not implemented");
  }
}
