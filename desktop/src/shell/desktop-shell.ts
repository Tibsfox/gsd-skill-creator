import type { WindowManager } from "../wm/window-manager";
import type { WindowType } from "../wm/types";
import type { TaskbarEntry, ProcessStatus, MenuSection } from "./types";
import type { DesktopIconsHandle } from "./desktop-icons";
import type { TaskbarHandle } from "./taskbar";
import type { SystemMenuHandle } from "./system-menu";
import { createDesktopIcons } from "./desktop-icons";
import { createTaskbar } from "./taskbar";
import { createSystemMenu } from "./system-menu";
import { KeyboardManager } from "./keyboard-nav";
import { ProcessMonitor } from "./process-monitor";
import { ALL_MODULE_TYPES, getIconDef } from "./icon-registry";

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
  private readonly wm: WindowManager;
  private readonly desktop: HTMLElement;
  private desktopIcons: DesktopIconsHandle | null = null;
  private taskbar: TaskbarHandle | null = null;
  private systemMenu: SystemMenuHandle | null = null;
  private keyboard: KeyboardManager;
  private processMonitor: ProcessMonitor;
  private wmUnsubscribe: (() => void) | null = null;
  private readonly openWindowTypes = new Map<string, string>();
  private contextMenuHandler: ((e: MouseEvent) => void) | null = null;

  constructor(config: DesktopShellConfig) {
    this.wm = config.wm;
    this.desktop = config.desktop;
    this.keyboard = new KeyboardManager();
    this.processMonitor = new ProcessMonitor();
  }

  /** Initialize all shell components and mount to DOM */
  init(): void {
    // 1. Create desktop icons
    const iconDefs = ALL_MODULE_TYPES.map((t) => getIconDef(t)!);
    this.desktopIcons = createDesktopIcons(iconDefs, (type) =>
      this.openOrFocus(type),
    );
    this.desktop.appendChild(this.desktopIcons.element);

    // 2. Create taskbar
    this.taskbar = createTaskbar((windowId) => this.handleTaskbarClick(windowId));
    this.desktop.appendChild(this.taskbar.element);

    // 3. Create system menu
    this.systemMenu = createSystemMenu();
    this.desktop.appendChild(this.systemMenu.element);

    // Wire taskbar menu button
    const menuBtn = this.desktop.querySelector(
      ".shell-taskbar__menu-btn",
    ) as HTMLElement | null;
    if (menuBtn) {
      menuBtn.addEventListener("click", () => {
        if (this.systemMenu) {
          this.rebuildMenuSections();
          this.systemMenu.showAnchored(menuBtn);
        }
      });
    }

    // 4. Set up process monitor
    this.processMonitor.registerProcess("claude", "Claude", "idle");
    this.processMonitor.registerProcess("watcher", "File Watcher", "stopped");
    this.processMonitor.registerProcess("terminal", "Terminal", "stopped");
    this.processMonitor.onChange((indicators) => {
      this.taskbar?.updateIndicators(indicators);
    });
    // Trigger initial update
    this.taskbar.updateIndicators(this.processMonitor.getIndicators());

    // 5. Subscribe to WindowManager events
    this.wmUnsubscribe = this.wm.on((event) => {
      this.syncTaskbar();
      if (event.type === "window-opened") {
        const state = this.wm.getWindowState(event.windowId);
        if (state) {
          this.openWindowTypes.set(state.type, event.windowId);
        }
      }
      if (event.type === "window-closed") {
        for (const [type, id] of this.openWindowTypes) {
          if (id === event.windowId) {
            this.openWindowTypes.delete(type);
            break;
          }
        }
      }
    });

    // 6. Set up keyboard shortcuts
    this.keyboard.register([
      {
        key: "Tab",
        alt: true,
        action: "cycle-focus-forward",
        handler: () => this.cycleFocus(1),
      },
      {
        key: "Tab",
        alt: true,
        shift: true,
        action: "cycle-focus-backward",
        handler: () => this.cycleFocus(-1),
      },
      {
        key: "F10",
        action: "open-menu",
        handler: () => {
          if (!this.systemMenu) return;
          this.rebuildMenuSections();
          const btn = this.desktop.querySelector(
            ".shell-taskbar__menu-btn",
          ) as HTMLElement | null;
          if (btn) {
            this.systemMenu.showAnchored(btn);
          } else {
            this.systemMenu.show(0, this.desktop.clientHeight - 200);
          }
        },
      },
      {
        key: "q",
        ctrl: true,
        action: "quit",
        handler: () => this.requestQuit(),
      },
    ]);

    // 7. Wire context menu (right-click) on desktop
    this.contextMenuHandler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target === this.desktop ||
        target.closest(".shell-icon-column") ||
        target.closest(".wm-icon-area")
      ) {
        e.preventDefault();
        this.rebuildMenuSections();
        this.systemMenu!.show(e.clientX, e.clientY);
      }
    };
    this.desktop.addEventListener("contextmenu", this.contextMenuHandler);
  }

  /** Open or focus a window of the given type */
  openOrFocus(type: string): void {
    const existingId = this.openWindowTypes.get(type);
    if (existingId) {
      this.wm.focusWindow(existingId);
      return;
    }
    const iconDef = getIconDef(type as WindowType);
    if (!iconDef) return;
    const result = this.wm.openWindow({
      type: type as WindowType,
      title: iconDef.label,
      bounds: iconDef.defaultBounds,
    });
    this.openWindowTypes.set(type, result.id);
  }

  /** Update a process indicator status */
  updateProcessStatus(id: string, status: string): void {
    this.processMonitor.updateStatus(id, status as ProcessStatus);
  }

  /** Get the system menu handle (for external menu button wiring) */
  getMenuHandle(): SystemMenuHandle | null {
    return this.systemMenu;
  }

  /** Get the keyboard manager (for external binding additions) */
  getKeyboardManager(): KeyboardManager {
    return this.keyboard;
  }

  /** Destroy all shell components and clean up */
  destroy(): void {
    if (this.desktopIcons) {
      this.desktopIcons.element.remove();
      this.desktopIcons.destroy();
      this.desktopIcons = null;
    }
    if (this.taskbar) {
      this.taskbar.element.remove();
      this.taskbar.destroy();
      this.taskbar = null;
    }
    if (this.systemMenu) {
      this.systemMenu.element.remove();
      this.systemMenu.destroy();
      this.systemMenu = null;
    }
    this.keyboard.destroy();
    this.processMonitor.destroy();
    if (this.wmUnsubscribe) {
      this.wmUnsubscribe();
      this.wmUnsubscribe = null;
    }
    if (this.contextMenuHandler) {
      this.desktop.removeEventListener("contextmenu", this.contextMenuHandler);
      this.contextMenuHandler = null;
    }
    this.openWindowTypes.clear();
  }

  /** Handle taskbar entry click: toggle focus/minimize */
  private handleTaskbarClick(windowId: string): void {
    const state = this.wm.getWindowState(windowId);
    if (!state) return;

    if (state.minimized) {
      this.wm.restoreWindow(windowId);
    } else {
      // Check if this window is focused (at front of z-stack)
      const zStack = this.wm.getZStack();
      const front = zStack.length > 0 ? zStack[zStack.length - 1] : null;
      if (windowId === front) {
        this.wm.minimizeWindow(windowId);
      } else {
        this.wm.focusWindow(windowId);
      }
    }
  }

  /** Synchronize taskbar entries with current WindowManager state */
  private syncTaskbar(): void {
    if (!this.taskbar) return;
    const zStack = this.wm.getZStack();
    const front = zStack.length > 0 ? zStack[zStack.length - 1] : null;
    const entries: TaskbarEntry[] = this.wm.getAllWindows().map((win) => ({
      windowId: win.id,
      type: win.type,
      title: win.title,
      minimized: win.minimized,
      focused: win.id === front && !win.minimized,
    }));
    this.taskbar.updateEntries(entries);
  }

  /** Cycle window focus in the given direction */
  private cycleFocus(direction: 1 | -1): void {
    const zStack = this.wm.getZStack();
    if (zStack.length < 2) return;

    if (direction === 1) {
      // Bring the window behind the front to the front
      // (effectively: focus the second-from-top)
      const nextId = zStack[zStack.length - 2];
      this.wm.focusWindow(nextId);
    } else {
      // Reverse: bring the back window to front
      const nextId = zStack[0];
      this.wm.focusWindow(nextId);
    }
  }

  /** Rebuild menu sections from current state */
  private rebuildMenuSections(): void {
    if (!this.systemMenu) return;

    const sections: MenuSection[] = [
      {
        title: "Windows",
        items: this.wm
          .getAllWindows()
          .filter((w) => !w.minimized)
          .map((w) => ({
            id: `focus-${w.id}`,
            label: w.title,
            action: () => this.wm.focusWindow(w.id),
          })),
      },
      {
        title: "Tools",
        items: ALL_MODULE_TYPES.map((type) => {
          const def = getIconDef(type)!;
          return {
            id: `open-${type}`,
            label: def.label,
            action: () => this.openOrFocus(type),
          };
        }),
      },
      {
        title: "Settings",
        items: [
          {
            id: "recalibrate",
            label: "Recalibrate...",
            action: () => {
              /* Phase 167 */
            },
          },
        ],
      },
      {
        title: "Application",
        items: [
          {
            id: "quit",
            label: "Quit",
            shortcut: "Ctrl+Q",
            action: () => this.requestQuit(),
          },
        ],
      },
    ];

    this.systemMenu.updateSections(sections);
  }

  /** Request application quit */
  private requestQuit(): void {
    import("@tauri-apps/api/window")
      .then(({ getCurrentWindow }) => getCurrentWindow().close())
      .catch(() => {
        // Not running in Tauri
      });
  }
}
