import type { WindowManager } from "../wm/window-manager";

/** Configuration for DesktopShell */
export interface DesktopShellConfig {
  /** The desktop container (where icons and windows live) */
  desktop: HTMLElement;
  /** The WindowManager instance to orchestrate */
  wm: WindowManager;
}

/**
 * DesktopShell: orchestrates the complete desktop environment.
 *
 * Wires together:
 * - Desktop icons (icon-registry + desktop-icons component)
 * - Taskbar (window list + process indicators)
 * - System menu (sectioned popup)
 * - Keyboard shortcuts (focus cycling, menu, actions)
 * - Process monitor (Claude, watcher, terminal status)
 *
 * Subscribes to WindowManager events to keep taskbar in sync.
 * Maps icon double-clicks to window open/focus operations.
 */
export class DesktopShell {
  constructor(_config: DesktopShellConfig) {
    // stub
  }

  /** Initialize all shell components and mount to DOM */
  init(): void {
    throw new Error("Not implemented");
  }

  /** Update a process indicator status */
  updateProcessStatus(_id: string, _status: string): void {
    throw new Error("Not implemented");
  }

  /** Get the system menu handle (for external menu button wiring) */
  getMenuHandle(): unknown {
    throw new Error("Not implemented");
  }

  /** Get the keyboard manager (for external binding additions) */
  getKeyboardManager(): unknown {
    throw new Error("Not implemented");
  }

  /** Open or focus a window of the given type */
  openOrFocus(_type: string): void {
    throw new Error("Not implemented");
  }

  /** Destroy all shell components and clean up */
  destroy(): void {
    throw new Error("Not implemented");
  }
}
