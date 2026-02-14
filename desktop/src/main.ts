import { Engine } from "./engine";
import { WindowManager } from "./wm";
import { DesktopShell } from "./shell";
import "./styles/main.css";

async function init(): Promise<void> {
  const app = document.getElementById("app");
  if (!app) return;

  // Clear demo content
  app.innerHTML = "";

  // --- App-level titlebar (Tauri frameless chrome) ---
  const appTitlebar = document.createElement("div");
  appTitlebar.className = "wm-app-titlebar";
  appTitlebar.setAttribute("data-tauri-drag-region", "");

  const titlebarLeft = document.createElement("div");
  titlebarLeft.className = "wm-titlebar__left";
  const closeBtn = document.createElement("button");
  closeBtn.className = "wm-gadget wm-gadget--close";
  closeBtn.id = "app-close";
  titlebarLeft.appendChild(closeBtn);

  const titlebarCenter = document.createElement("div");
  titlebarCenter.className = "wm-titlebar__center";
  titlebarCenter.setAttribute("data-tauri-drag-region", "");
  titlebarCenter.textContent = "GSD-OS v0.1.0";

  const titlebarRight = document.createElement("div");
  titlebarRight.className = "wm-titlebar__right";
  const depthBtn = document.createElement("button");
  depthBtn.className = "wm-gadget wm-gadget--depth";
  depthBtn.id = "app-depth";
  const zoomBtn = document.createElement("button");
  zoomBtn.className = "wm-gadget wm-gadget--zoom";
  zoomBtn.id = "app-zoom";
  titlebarRight.appendChild(depthBtn);
  titlebarRight.appendChild(zoomBtn);

  appTitlebar.appendChild(titlebarLeft);
  appTitlebar.appendChild(titlebarCenter);
  appTitlebar.appendChild(titlebarRight);

  // --- Desktop area ---
  const desktop = document.createElement("div");
  desktop.className = "wm-desktop";
  desktop.id = "desktop";

  const iconArea = document.createElement("div");
  iconArea.className = "wm-icon-area";
  iconArea.id = "icon-area";
  desktop.appendChild(iconArea);

  app.appendChild(appTitlebar);
  app.appendChild(desktop);

  // --- Wire Tauri window controls ---
  try {
    const { getCurrentWindow } = await import("@tauri-apps/api/window");
    closeBtn.addEventListener("click", () => getCurrentWindow().close());
    zoomBtn.addEventListener("click", () => getCurrentWindow().toggleMaximize());
  } catch {
    // Not running in Tauri (dev mode or tests)
  }

  // --- WebGL CRT Engine ---
  const engine = Engine.create(document.body);
  engine.start();

  // --- Window Manager ---
  const wm = new WindowManager(desktop, iconArea);

  // --- Desktop Shell (icons, taskbar, menu, keyboard) ---
  const shell = new DesktopShell({ desktop, wm });
  shell.init();

  // --- Wire process indicators to real services ---
  // Claude session status (from SessionMonitor)
  try {
    const { SessionMonitor } = await import("./claude");
    const monitor = new SessionMonitor();
    await monitor.start();
    monitor.subscribe((event) => {
      shell.updateProcessStatus("claude", event.status);
    });
  } catch {
    // SessionMonitor requires Tauri runtime
  }

  // File watcher status
  try {
    const { watcherStatus } = await import("./ipc/watcher");
    const isRunning = await watcherStatus();
    shell.updateProcessStatus("watcher", isRunning ? "running" : "stopped");
  } catch {
    // Watcher requires Tauri runtime
  }
}

document.addEventListener("DOMContentLoaded", init);
