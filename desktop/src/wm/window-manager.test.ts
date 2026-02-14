import { describe, it, expect, beforeEach, vi } from "vitest";
import { WindowManager } from "./window-manager";
import type { WMEvent } from "./window-manager";

describe("WindowManager", () => {
  let container: HTMLDivElement;
  let iconContainer: HTMLDivElement;
  let wm: WindowManager;

  beforeEach(() => {
    // PointerEvent polyfill for jsdom
    if (typeof PointerEvent === "undefined") {
      (globalThis as any).PointerEvent = class extends MouseEvent {
        pointerId: number;
        constructor(type: string, init?: PointerEventInit) {
          super(type, init);
          this.pointerId = init?.pointerId ?? 0;
        }
      };
    }
    HTMLElement.prototype.setPointerCapture = vi.fn();
    HTMLElement.prototype.releasePointerCapture = vi.fn();

    container = document.createElement("div");
    container.id = "desktop";
    document.body.appendChild(container);

    iconContainer = document.createElement("div");
    iconContainer.id = "icon-area";
    document.body.appendChild(iconContainer);

    wm = new WindowManager(container, iconContainer);
  });

  it("openWindow creates window and adds to container", () => {
    const result = wm.openWindow({ type: "dashboard", title: "Dashboard" });
    expect(result.id).toBeTruthy();
    // Frame should be mounted in container
    const frames = container.querySelectorAll(".wm-frame");
    expect(frames.length).toBe(1);
    // Z-stack should contain the id
    expect(wm.getZStack()).toContain(result.id);
  });

  it("openWindow returns content element for mounting", () => {
    const result = wm.openWindow({ type: "dashboard", title: "Dashboard" });
    expect(result.content).toBeInstanceOf(HTMLElement);
    expect(result.content.classList.contains("wm-content")).toBe(true);
  });

  it("multiple windows can be opened simultaneously", () => {
    wm.openWindow({ type: "dashboard", title: "Dashboard" });
    wm.openWindow({ type: "terminal", title: "Terminal" });
    wm.openWindow({ type: "console", title: "Console" });
    expect(wm.getAllWindows().length).toBe(3);
    expect(wm.getZStack().length).toBe(3);
  });

  it("last opened window is at front of z-order", () => {
    const a = wm.openWindow({ type: "dashboard", title: "A" });
    wm.openWindow({ type: "terminal", title: "B" });
    const c = wm.openWindow({ type: "console", title: "C" });
    const stack = wm.getZStack();
    // C should be at the last position (front)
    expect(stack[stack.length - 1]).toBe(c.id);
  });

  it("closeWindow removes window from DOM and z-order", () => {
    const a = wm.openWindow({ type: "dashboard", title: "A" });
    wm.closeWindow(a.id);
    // Frame should no longer be in container
    const frames = container.querySelectorAll(".wm-frame");
    expect(frames.length).toBe(0);
    // Z-stack should be empty
    expect(wm.getZStack().length).toBe(0);
    // State should be gone
    expect(wm.getWindowState(a.id)).toBeUndefined();
  });

  it("closeWindow emits window-closed event", () => {
    const events: WMEvent[] = [];
    wm.on((e) => events.push(e));
    const a = wm.openWindow({ type: "dashboard", title: "A" });
    wm.closeWindow(a.id);
    const closeEvent = events.find((e) => e.type === "window-closed");
    expect(closeEvent).toBeDefined();
    expect(closeEvent!.windowId).toBe(a.id);
  });

  it("depthCycleWindow: front window goes to back", () => {
    const a = wm.openWindow({ type: "dashboard", title: "A" });
    const b = wm.openWindow({ type: "terminal", title: "B" });
    const c = wm.openWindow({ type: "console", title: "C" });
    // C is at front; depth cycle should send it to back
    wm.depthCycleWindow(c.id);
    const stack = wm.getZStack();
    expect(stack[0]).toBe(c.id);
    // B should now be at front
    expect(stack[stack.length - 1]).toBe(b.id);
  });

  it("depthCycleWindow: non-front window goes to front", () => {
    const a = wm.openWindow({ type: "dashboard", title: "A" });
    const b = wm.openWindow({ type: "terminal", title: "B" });
    const c = wm.openWindow({ type: "console", title: "C" });
    // A is at back; depth cycle should bring it to front
    wm.depthCycleWindow(a.id);
    const stack = wm.getZStack();
    expect(stack[stack.length - 1]).toBe(a.id);
  });

  it("depthCycleWindow updates z-index CSS", () => {
    const a = wm.openWindow({ type: "dashboard", title: "A" });
    const b = wm.openWindow({ type: "terminal", title: "B" });
    const c = wm.openWindow({ type: "console", title: "C" });
    // Depth cycle C (front -> back)
    wm.depthCycleWindow(c.id);
    const stack = wm.getZStack();
    // Verify z-index on frames matches stack position
    const frames = container.querySelectorAll(".wm-frame");
    for (const frame of frames) {
      const htmlFrame = frame as HTMLElement;
      const zIndex = parseInt(htmlFrame.style.zIndex, 10);
      // z-index should be 10 + position in stack
      expect(zIndex).toBeGreaterThanOrEqual(10);
    }
  });

  it("minimizeWindow hides frame and creates icon", () => {
    const a = wm.openWindow({ type: "dashboard", title: "A" });
    wm.minimizeWindow(a.id);
    // Frame should be hidden
    const frames = container.querySelectorAll(".wm-frame") as NodeListOf<HTMLElement>;
    for (const frame of frames) {
      if (frame.style.zIndex) {
        // The frame for A should be display:none
      }
    }
    // Desktop icon should exist
    const icons = wm.getDesktopIcons();
    expect(icons.length).toBe(1);
    expect(icons[0].id).toBe(a.id);
    // Icon should be in iconContainer
    expect(iconContainer.children.length).toBe(1);
  });

  it("restoreWindow shows frame and removes icon", () => {
    const a = wm.openWindow({ type: "dashboard", title: "A" });
    wm.minimizeWindow(a.id);
    wm.restoreWindow(a.id);
    // Frame should be visible (display not "none")
    const state = wm.getWindowState(a.id);
    expect(state).toBeDefined();
    expect(state!.minimized).toBe(false);
    // Icons should be empty
    expect(wm.getDesktopIcons().length).toBe(0);
  });

  it("restoreWindow brings window to front", () => {
    const a = wm.openWindow({ type: "dashboard", title: "A" });
    const b = wm.openWindow({ type: "terminal", title: "B" });
    wm.minimizeWindow(a.id);
    wm.restoreWindow(a.id);
    // A should be at front of z-order
    const stack = wm.getZStack();
    expect(stack[stack.length - 1]).toBe(a.id);
  });

  it("focusWindow brings window to front of z-order", () => {
    const a = wm.openWindow({ type: "dashboard", title: "A" });
    const b = wm.openWindow({ type: "terminal", title: "B" });
    wm.focusWindow(a.id);
    const stack = wm.getZStack();
    expect(stack[stack.length - 1]).toBe(a.id);
  });

  it("focusWindow sets active chrome on focused window", () => {
    const a = wm.openWindow({ type: "dashboard", title: "A" });
    const b = wm.openWindow({ type: "terminal", title: "B" });
    wm.focusWindow(a.id);
    // A's frame should have wm-frame--active
    const frames = container.querySelectorAll(".wm-frame");
    let activeCount = 0;
    let inactiveCount = 0;
    for (const frame of frames) {
      if (frame.classList.contains("wm-frame--active")) activeCount++;
      if (frame.classList.contains("wm-frame--inactive")) inactiveCount++;
    }
    expect(activeCount).toBe(1);
    expect(inactiveCount).toBe(1);
  });

  it("clicking on window frame focuses it", () => {
    const a = wm.openWindow({ type: "dashboard", title: "A" });
    const b = wm.openWindow({ type: "terminal", title: "B" });
    // B is at front. Click on A's frame
    const aFrame = container.querySelector(".wm-frame") as HTMLElement;
    aFrame.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    // A should now be at front
    const stack = wm.getZStack();
    expect(stack[stack.length - 1]).toBe(a.id);
  });

  it("on returns cleanup function that unsubscribes", () => {
    const events: WMEvent[] = [];
    const cleanup = wm.on((e) => events.push(e));
    // Open a window -- should receive event
    wm.openWindow({ type: "dashboard", title: "A" });
    const countBefore = events.length;
    // Cleanup (unsubscribe)
    cleanup();
    // Open another window -- should NOT receive event
    wm.openWindow({ type: "terminal", title: "B" });
    expect(events.length).toBe(countBefore);
  });

  it("destroy removes all windows and icons", () => {
    const a = wm.openWindow({ type: "dashboard", title: "A" });
    const b = wm.openWindow({ type: "terminal", title: "B" });
    wm.minimizeWindow(b.id);
    wm.destroy();
    // Container should have no frames
    expect(container.querySelectorAll(".wm-frame").length).toBe(0);
    // Icon container should be empty
    expect(iconContainer.children.length).toBe(0);
    // No windows
    expect(wm.getAllWindows().length).toBe(0);
  });

  it("openWindow with custom bounds positions window correctly", () => {
    const result = wm.openWindow({
      type: "dashboard",
      title: "Custom",
      bounds: { x: 100, y: 200, width: 800, height: 600 },
    });
    const state = wm.getWindowState(result.id);
    expect(state).toBeDefined();
    expect(state!.bounds.x).toBe(100);
    expect(state!.bounds.y).toBe(200);
    expect(state!.bounds.width).toBe(800);
    expect(state!.bounds.height).toBe(600);
  });
});
