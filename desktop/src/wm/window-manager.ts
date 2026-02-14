import type { WindowId, WindowType, WindowState, WindowBounds, ZStack } from "./types";
import type { WindowChromeElements, GadgetAction } from "./window-chrome";
import type { Cleanup } from "./drag-resize";
import { createWindow, updateBounds, minimizeWindow as minimizeState, restoreWindow as restoreState } from "./window-state";
import { createZStack, insertAtFront, removeFromStack, bringToFront, depthCycle, getFront } from "./z-order";
import { createWindowChrome } from "./window-chrome";
import { enableDrag, enableResize } from "./drag-resize";

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
  private readonly container: HTMLElement;
  private readonly iconContainer: HTMLElement;
  private windows = new Map<WindowId, WindowState>();
  private chromeMap = new Map<WindowId, WindowChromeElements>();
  private cleanupMap = new Map<WindowId, Cleanup[]>();
  private zStack: ZStack = createZStack();
  private icons = new Map<WindowId, DesktopIcon>();
  private listeners = new Set<WMEventListener>();
  private nextId = 0;

  /**
   * @param container - The desktop container element where windows are mounted
   * @param iconContainer - The area where minimized window icons appear
   */
  constructor(
    container: HTMLElement,
    iconContainer: HTMLElement,
  ) {
    this.container = container;
    this.iconContainer = iconContainer;
  }

  /** Open a new window. Returns the window ID and the content container. */
  openWindow(options: OpenWindowOptions): { id: WindowId; content: HTMLElement } {
    const id: WindowId = `wm-${this.nextId++}`;

    // Create window state
    const state = createWindow({
      id,
      type: options.type,
      title: options.title,
      bounds: options.bounds,
    });
    this.windows.set(id, state);

    // Create chrome DOM elements
    const chrome = createWindowChrome(
      options.title,
      state.bounds,
      (action: GadgetAction) => this.handleGadget(id, action),
    );
    this.chromeMap.set(id, chrome);

    // Wire drag on titlebar
    const dragCleanup = enableDrag(
      chrome.titlebar,
      () => chrome.frame,
      () => this.windows.get(id)!.bounds,
      (newBounds: WindowBounds) => {
        const current = this.windows.get(id);
        if (current) {
          this.windows.set(id, updateBounds(current, newBounds));
          this.emit({ type: "window-moved", windowId: id, bounds: newBounds });
        }
      },
    );

    // Wire resize on resizeHandle
    const resizeCleanup = enableResize(
      chrome.resizeHandle,
      () => chrome.frame,
      () => this.windows.get(id)!.bounds,
      (newBounds: WindowBounds) => {
        const current = this.windows.get(id);
        if (current) {
          this.windows.set(id, updateBounds(current, newBounds));
          this.emit({ type: "window-resized", windowId: id, bounds: newBounds });
        }
      },
    );

    // Store cleanups
    const cleanups: Cleanup[] = [dragCleanup, resizeCleanup];

    // Focus-on-click: pointerdown on frame brings to front
    const onFramePointerDown = (): void => {
      this.focusWindow(id);
    };
    chrome.frame.addEventListener("pointerdown", onFramePointerDown);
    cleanups.push(() => chrome.frame.removeEventListener("pointerdown", onFramePointerDown));

    this.cleanupMap.set(id, cleanups);

    // Mount frame in container
    this.container.appendChild(chrome.frame);

    // Update z-order: new window goes to front
    this.zStack = insertAtFront(this.zStack, id);
    this.applyZIndices();
    this.updateActiveChrome();

    this.emit({ type: "window-opened", windowId: id });

    return { id, content: chrome.content };
  }

  /** Close a window by ID */
  closeWindow(id: WindowId): void {
    const chrome = this.chromeMap.get(id);
    if (!chrome) return;

    // Remove frame from DOM
    chrome.frame.remove();

    // Call all cleanups
    const cleanups = this.cleanupMap.get(id);
    if (cleanups) {
      for (const cleanup of cleanups) cleanup();
    }

    // Remove from all maps
    this.windows.delete(id);
    this.chromeMap.delete(id);
    this.cleanupMap.delete(id);

    // Remove from z-order
    this.zStack = removeFromStack(this.zStack, id);

    // Remove icon if minimized
    const icon = this.icons.get(id);
    if (icon) {
      icon.element.remove();
      this.icons.delete(id);
    }

    this.applyZIndices();
    this.updateActiveChrome();

    this.emit({ type: "window-closed", windowId: id });
  }

  /** Get a window's current state */
  getWindowState(id: WindowId): WindowState | undefined {
    return this.windows.get(id);
  }

  /** Get all window states */
  getAllWindows(): WindowState[] {
    return Array.from(this.windows.values());
  }

  /** Get the current z-order stack */
  getZStack(): ZStack {
    return this.zStack;
  }

  /** Get content element for a window */
  getContentElement(id: WindowId): HTMLElement | undefined {
    return this.chromeMap.get(id)?.content;
  }

  /** Depth-cycle a window (Amiga-style) */
  depthCycleWindow(id: WindowId): void {
    this.zStack = depthCycle(this.zStack, id);
    this.applyZIndices();
    this.updateActiveChrome();
    this.emit({ type: "depth-cycled", windowId: id });
  }

  /** Minimize a window to desktop icon */
  minimizeWindow(id: WindowId): void {
    const state = this.windows.get(id);
    const chrome = this.chromeMap.get(id);
    if (!state || !chrome) return;

    // Update window state
    this.windows.set(id, minimizeState(state));

    // Hide frame
    chrome.frame.style.display = "none";

    // Remove from z-order
    this.zStack = removeFromStack(this.zStack, id);

    // Create desktop icon
    const iconEl = document.createElement("div");
    iconEl.className = "wm-desktop-icon";
    iconEl.dataset.windowId = id;
    iconEl.dataset.type = state.type;

    const graphic = document.createElement("div");
    graphic.className = "wm-desktop-icon__graphic";
    graphic.textContent = state.type.charAt(0).toUpperCase();

    const label = document.createElement("div");
    label.className = "wm-desktop-icon__label";
    label.textContent = state.title;

    iconEl.appendChild(graphic);
    iconEl.appendChild(label);

    // Double-click on icon restores
    iconEl.addEventListener("dblclick", () => this.restoreWindow(id));

    // Mount icon
    this.iconContainer.appendChild(iconEl);

    const desktopIcon: DesktopIcon = {
      id,
      type: state.type,
      title: state.title,
      element: iconEl,
    };
    this.icons.set(id, desktopIcon);

    this.applyZIndices();
    this.updateActiveChrome();

    this.emit({ type: "window-minimized", windowId: id });
  }

  /** Restore a minimized window */
  restoreWindow(id: WindowId): void {
    const state = this.windows.get(id);
    const chrome = this.chromeMap.get(id);
    if (!state || !chrome) return;

    // Update window state
    const restored = restoreState(state);
    this.windows.set(id, restored);

    // Show frame
    chrome.frame.style.display = "";

    // Apply restored bounds to frame
    chrome.frame.style.left = `${restored.bounds.x}px`;
    chrome.frame.style.top = `${restored.bounds.y}px`;
    chrome.frame.style.width = `${restored.bounds.width}px`;
    chrome.frame.style.height = `${restored.bounds.height}px`;

    // Add to z-order at front
    this.zStack = insertAtFront(this.zStack, id);

    // Remove desktop icon
    const icon = this.icons.get(id);
    if (icon) {
      icon.element.remove();
      this.icons.delete(id);
    }

    this.applyZIndices();
    this.updateActiveChrome();

    this.emit({ type: "window-restored", windowId: id });
  }

  /** Focus a window (bring to front) */
  focusWindow(id: WindowId): void {
    const front = getFront(this.zStack);
    if (front === id) return;

    this.zStack = bringToFront(this.zStack, id);
    this.applyZIndices();
    this.updateActiveChrome();
    this.emit({ type: "window-focused", windowId: id });
  }

  /** Subscribe to window manager events */
  on(listener: WMEventListener): Cleanup {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /** Get all desktop icons (minimized windows) */
  getDesktopIcons(): DesktopIcon[] {
    return Array.from(this.icons.values());
  }

  /** Destroy all windows and clean up */
  destroy(): void {
    // Close all windows (collect IDs first to avoid mutation during iteration)
    const ids = Array.from(this.windows.keys());
    for (const id of ids) {
      const chrome = this.chromeMap.get(id);
      if (chrome) chrome.frame.remove();

      const cleanups = this.cleanupMap.get(id);
      if (cleanups) {
        for (const cleanup of cleanups) cleanup();
      }

      const icon = this.icons.get(id);
      if (icon) icon.element.remove();
    }

    this.windows.clear();
    this.chromeMap.clear();
    this.cleanupMap.clear();
    this.icons.clear();
    this.zStack = createZStack();
    this.listeners.clear();
  }

  /** Apply z-index CSS to all frames based on stack position */
  private applyZIndices(): void {
    for (let i = 0; i < this.zStack.length; i++) {
      const chrome = this.chromeMap.get(this.zStack[i]);
      if (chrome) {
        chrome.frame.style.zIndex = `${10 + i}`;
      }
    }
  }

  /** Update active/inactive chrome state for all windows */
  private updateActiveChrome(): void {
    const front = getFront(this.zStack);
    for (const [id, chrome] of this.chromeMap) {
      chrome.setActive(id === front);
    }
  }

  /** Handle gadget actions from window chrome */
  private handleGadget(id: WindowId, action: GadgetAction): void {
    switch (action) {
      case "close":
        this.closeWindow(id);
        break;
      case "depth":
        this.depthCycleWindow(id);
        break;
      case "zoom":
        // Future: toggle maximize. No-op for now.
        break;
    }
  }

  /** Emit an event to all listeners */
  private emit(event: WMEvent): void {
    for (const listener of this.listeners) {
      listener(event);
    }
  }
}
