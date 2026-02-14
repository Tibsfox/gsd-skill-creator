import { Engine } from "./engine";
import { WindowManager } from "./wm";
import "./styles/main.css";

async function init(): Promise<void> {
  const app = document.getElementById("app");
  if (!app) return;

  // Build DOM structure: app titlebar + desktop + icon area
  app.innerHTML = "";

  // App-level titlebar (Amiga-style, Tauri frameless drag)
  const appTitlebar = document.createElement("div");
  appTitlebar.className = "wm-app-titlebar";
  appTitlebar.setAttribute("data-tauri-drag-region", "");

  const titleLeft = document.createElement("div");
  titleLeft.className = "wm-titlebar__left";

  const appCloseBtn = document.createElement("button");
  appCloseBtn.className = "wm-gadget wm-gadget--close";
  appCloseBtn.id = "app-close";
  titleLeft.appendChild(appCloseBtn);

  const titleCenter = document.createElement("div");
  titleCenter.className = "wm-titlebar__center";
  titleCenter.setAttribute("data-tauri-drag-region", "");
  titleCenter.textContent = "GSD-OS v0.1.0";

  const titleRight = document.createElement("div");
  titleRight.className = "wm-titlebar__right";

  const appDepthBtn = document.createElement("button");
  appDepthBtn.className = "wm-gadget wm-gadget--depth";
  appDepthBtn.id = "app-depth";

  const appZoomBtn = document.createElement("button");
  appZoomBtn.className = "wm-gadget wm-gadget--zoom";
  appZoomBtn.id = "app-zoom";

  titleRight.appendChild(appDepthBtn);
  titleRight.appendChild(appZoomBtn);

  appTitlebar.appendChild(titleLeft);
  appTitlebar.appendChild(titleCenter);
  appTitlebar.appendChild(titleRight);

  // Desktop area
  const desktop = document.createElement("div");
  desktop.className = "wm-desktop";
  desktop.id = "desktop";

  // Icon area for minimized windows
  const iconArea = document.createElement("div");
  iconArea.className = "wm-icon-area";
  iconArea.id = "icon-area";
  desktop.appendChild(iconArea);

  app.appendChild(appTitlebar);
  app.appendChild(desktop);

  // Wire Tauri window controls (only in Tauri runtime)
  try {
    const { getCurrentWindow } = await import("@tauri-apps/api/window");
    appCloseBtn.addEventListener("click", () => getCurrentWindow().close());
    appZoomBtn.addEventListener("click", () => getCurrentWindow().toggleMaximize());
  } catch {
    // Not running in Tauri (dev mode or tests)
  }

  // WebGL CRT Engine -- canvas behind desktop at z-index 0
  const engine = Engine.create(document.body);
  engine.start();

  // Window Manager
  const wm = new WindowManager(desktop, iconArea);

  // Open 3 demo windows staggered
  const dashboard = wm.openWindow({
    type: "dashboard",
    title: "Dashboard",
    bounds: { x: 20, y: 20, width: 600, height: 400 },
  });
  dashboard.content.innerHTML =
    "<h2>Dashboard</h2><p>Dashboard content will render here in Phase 166</p>";

  const terminal = wm.openWindow({
    type: "terminal",
    title: "Terminal",
    bounds: { x: 80, y: 80, width: 640, height: 480 },
  });
  terminal.content.innerHTML =
    "<h2>Terminal</h2><p>Terminal will attach here in Phase 165</p>";

  const consoleWin = wm.openWindow({
    type: "console",
    title: "Console",
    bounds: { x: 140, y: 140, width: 500, height: 350 },
  });
  consoleWin.content.innerHTML =
    "<h2>Console</h2><p>Console will mount here in Phase 166</p>";
}

document.addEventListener("DOMContentLoaded", init);
