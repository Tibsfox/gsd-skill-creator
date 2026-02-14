import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { WindowManager } from "../wm/window-manager";
import { DesktopShell } from "./desktop-shell";

describe("DesktopShell", () => {
  let desktop: HTMLDivElement;
  let iconArea: HTMLDivElement;
  let wm: WindowManager;
  let shell: DesktopShell;

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

    desktop = document.createElement("div");
    desktop.id = "desktop";
    iconArea = document.createElement("div");
    iconArea.id = "icon-area";
    desktop.appendChild(iconArea);
    document.body.appendChild(desktop);

    wm = new WindowManager(desktop, iconArea);
    shell = new DesktopShell({ desktop, wm });
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("init mounts desktop icons to the desktop", () => {
    shell.init();
    const iconColumn = desktop.querySelector(".shell-icon-column");
    expect(iconColumn).not.toBeNull();
  });

  it("init mounts taskbar to the desktop", () => {
    shell.init();
    const taskbar = desktop.querySelector(".shell-taskbar");
    expect(taskbar).not.toBeNull();
  });

  it("init mounts system menu to the desktop", () => {
    shell.init();
    const menu = desktop.querySelector(".shell-menu");
    expect(menu).not.toBeNull();
  });

  it("desktop icons render all 5 module types", () => {
    shell.init();
    const iconColumn = desktop.querySelector(".shell-icon-column");
    expect(iconColumn).not.toBeNull();
    const icons = iconColumn!.querySelectorAll(".shell-desktop-icon");
    expect(icons.length).toBe(5);
  });

  it("double-clicking dashboard icon opens a dashboard window", () => {
    shell.init();
    const iconColumn = desktop.querySelector(".shell-icon-column")!;
    const firstIcon = iconColumn.querySelector(".shell-desktop-icon")!;
    firstIcon.dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
    const windows = wm.getAllWindows();
    expect(windows.length).toBe(1);
    expect(windows[0].type).toBe("dashboard");
  });

  it("double-clicking same icon again focuses existing window", () => {
    shell.init();
    const iconColumn = desktop.querySelector(".shell-icon-column")!;
    const firstIcon = iconColumn.querySelector(".shell-desktop-icon")!;
    // Open dashboard
    firstIcon.dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
    // Click again -- should focus, not open new
    firstIcon.dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
    const windows = wm.getAllWindows();
    expect(windows.length).toBe(1);
    const stack = wm.getZStack();
    expect(stack[stack.length - 1]).toBe(windows[0].id);
  });

  it("double-clicking different icon opens different window", () => {
    shell.init();
    const iconColumn = desktop.querySelector(".shell-icon-column")!;
    const icons = iconColumn.querySelectorAll(".shell-desktop-icon");
    // Open dashboard (1st)
    icons[0].dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
    // Open terminal (2nd)
    icons[1].dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
    expect(wm.getAllWindows().length).toBe(2);
  });

  it("taskbar updates when window opens", () => {
    shell.init();
    const iconColumn = desktop.querySelector(".shell-icon-column")!;
    const firstIcon = iconColumn.querySelector(".shell-desktop-icon")!;
    firstIcon.dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
    const center = desktop.querySelector(".shell-taskbar__center")!;
    const entries = center.querySelectorAll(".shell-taskbar__entry");
    expect(entries.length).toBe(1);
    expect(entries[0].textContent).toBe("Dashboard");
  });

  it("taskbar updates when window closes", () => {
    shell.init();
    const iconColumn = desktop.querySelector(".shell-icon-column")!;
    const firstIcon = iconColumn.querySelector(".shell-desktop-icon")!;
    firstIcon.dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
    const windows = wm.getAllWindows();
    wm.closeWindow(windows[0].id);
    const center = desktop.querySelector(".shell-taskbar__center")!;
    const entries = center.querySelectorAll(".shell-taskbar__entry");
    expect(entries.length).toBe(0);
  });

  it("taskbar entry click on focused window minimizes it", () => {
    shell.init();
    const iconColumn = desktop.querySelector(".shell-icon-column")!;
    const firstIcon = iconColumn.querySelector(".shell-desktop-icon")!;
    firstIcon.dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
    const windowId = wm.getAllWindows()[0].id;
    // Click the taskbar entry for the focused window
    const center = desktop.querySelector(".shell-taskbar__center")!;
    const entryBtn = center.querySelector(".shell-taskbar__entry") as HTMLElement;
    entryBtn.click();
    const state = wm.getWindowState(windowId);
    expect(state?.minimized).toBe(true);
  });

  it("taskbar entry click on unfocused window focuses it", () => {
    shell.init();
    const iconColumn = desktop.querySelector(".shell-icon-column")!;
    const icons = iconColumn.querySelectorAll(".shell-desktop-icon");
    // Open dashboard then terminal (terminal gets focus)
    icons[0].dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
    icons[1].dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
    const dashboardId = wm.getAllWindows().find((w) => w.type === "dashboard")!.id;
    // Click dashboard taskbar entry (it is not focused)
    const center = desktop.querySelector(".shell-taskbar__center")!;
    const entries = center.querySelectorAll(".shell-taskbar__entry");
    // Dashboard entry should be the first one
    (entries[0] as HTMLElement).click();
    const stack = wm.getZStack();
    expect(stack[stack.length - 1]).toBe(dashboardId);
  });

  it("taskbar entry click on minimized window restores it", () => {
    shell.init();
    const iconColumn = desktop.querySelector(".shell-icon-column")!;
    const firstIcon = iconColumn.querySelector(".shell-desktop-icon")!;
    firstIcon.dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
    const windowId = wm.getAllWindows()[0].id;
    // Minimize
    wm.minimizeWindow(windowId);
    // Click taskbar entry to restore
    const center = desktop.querySelector(".shell-taskbar__center")!;
    const entryBtn = center.querySelector(".shell-taskbar__entry") as HTMLElement;
    entryBtn.click();
    const state = wm.getWindowState(windowId);
    expect(state?.minimized).toBe(false);
  });

  it("system menu opens on right-click on desktop", () => {
    shell.init();
    desktop.dispatchEvent(
      new MouseEvent("contextmenu", { bubbles: true, clientX: 100, clientY: 100 }),
    );
    const menu = desktop.querySelector(".shell-menu") as HTMLElement;
    expect(menu).not.toBeNull();
    expect(menu.style.display).not.toBe("none");
  });

  it("system menu has Windows section listing open windows", () => {
    shell.init();
    // Open a dashboard window
    const iconColumn = desktop.querySelector(".shell-icon-column")!;
    const firstIcon = iconColumn.querySelector(".shell-desktop-icon")!;
    firstIcon.dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
    // Open system menu
    desktop.dispatchEvent(
      new MouseEvent("contextmenu", { bubbles: true, clientX: 100, clientY: 100 }),
    );
    const menu = desktop.querySelector(".shell-menu") as HTMLElement;
    expect(menu.textContent).toContain("Windows");
    expect(menu.textContent).toContain("Dashboard");
  });

  it("system menu has Tools section with all module types", () => {
    shell.init();
    desktop.dispatchEvent(
      new MouseEvent("contextmenu", { bubbles: true, clientX: 100, clientY: 100 }),
    );
    const menu = desktop.querySelector(".shell-menu") as HTMLElement;
    expect(menu.textContent).toContain("Tools");
    expect(menu.textContent).toContain("Dashboard");
    expect(menu.textContent).toContain("Terminal");
    expect(menu.textContent).toContain("Console");
    expect(menu.textContent).toContain("Staging");
    expect(menu.textContent).toContain("Settings");
  });

  it("Alt+Tab cycles window focus", () => {
    shell.init();
    const iconColumn = desktop.querySelector(".shell-icon-column")!;
    const icons = iconColumn.querySelectorAll(".shell-desktop-icon");
    // Open 3 windows: dashboard, terminal, console
    icons[0].dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
    icons[1].dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
    icons[2].dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
    const consoleId = wm.getAllWindows().find((w) => w.type === "console")!.id;
    // Console is at front. Alt+Tab should cycle
    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Tab", altKey: true, bubbles: true }),
    );
    const stack = wm.getZStack();
    // Console should no longer be at front
    expect(stack[stack.length - 1]).not.toBe(consoleId);
  });

  it("F10 opens system menu", () => {
    shell.init();
    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "F10", bubbles: true }),
    );
    const menu = desktop.querySelector(".shell-menu") as HTMLElement;
    expect(menu).not.toBeNull();
    expect(menu.style.display).not.toBe("none");
  });

  it("updateProcessStatus updates taskbar indicators", () => {
    shell.init();
    shell.updateProcessStatus("claude", "running");
    const right = desktop.querySelector(".shell-taskbar__right")!;
    const indicators = right.querySelectorAll(".shell-indicator");
    // Should have indicators for claude, watcher, terminal
    expect(indicators.length).toBeGreaterThanOrEqual(1);
    // Claude indicator should have running class
    const claudeIndicator = right.querySelector(".shell-indicator--running");
    expect(claudeIndicator).not.toBeNull();
  });

  it("destroy cleans up all components", () => {
    shell.init();
    shell.destroy();
    expect(desktop.querySelector(".shell-taskbar")).toBeNull();
    expect(desktop.querySelector(".shell-icon-column")).toBeNull();
    expect(desktop.querySelector(".shell-menu")).toBeNull();
  });
});
