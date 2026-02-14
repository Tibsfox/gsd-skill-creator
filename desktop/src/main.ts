import { Engine } from "./engine";
import { WindowManager } from "./wm";
import { DesktopShell } from "./shell";
import { DashboardHost, WatcherRefresh, applyPalette, DEFAULT_PALETTE } from "./dashboard";
import { startWatcher } from "./ipc/watcher";
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

  // --- Apply palette CSS custom properties (defaults; Phase 167 reads user-style.yaml) ---
  applyPalette(DEFAULT_PALETTE);

  // --- Window Manager ---
  const wm = new WindowManager(desktop, iconArea);

  // --- Desktop Shell (icons, taskbar, menu, keyboard) ---
  const shell = new DesktopShell({ desktop, wm });
  shell.init();

  // --- Dashboard integration: mount DashboardHost when dashboard window opens ---
  const planningDir = ".planning";
  let dashHost: DashboardHost | null = null;
  let watcherRefresh: WatcherRefresh | null = null;

  wm.on((event) => {
    if (event.type === "window-opened") {
      const state = wm.getWindowState(event.windowId);
      if (state?.type === "dashboard") {
        const content = wm.getContentElement(event.windowId);
        if (content) {
          dashHost = new DashboardHost({
            container: content,
            planningDir,
            onError: (err) => console.error("[Dashboard]", err),
            onLoading: (loading) => {
              if (loading) {
                content.classList.add("dash-loading");
              } else {
                content.classList.remove("dash-loading");
              }
            },
          });

          // Load initial dashboard page
          dashHost.loadPage("index").catch((err) => {
            console.error("[Dashboard] Failed to load initial page:", err);
            dashHost?.setHtml("index", `
              <div class="dash-host-error">
                <h3>Dashboard unavailable</h3>
                <p>Dashboard generation requires Tauri runtime. Run with <code>npm run desktop:dev</code>.</p>
                <p>Error: ${err instanceof Error ? err.message : String(err)}</p>
              </div>
            `);
          });

          // Connect watcher refresh to this dashboard host
          watcherRefresh = new WatcherRefresh({
            invalidateCache: (page) => dashHost?.invalidateCache(page),
            reloadCurrentPage: () => dashHost?.loadPage(dashHost.currentPage) ?? Promise.resolve(),
            debounceMs: 300,
            onRefresh: () => console.log("[Dashboard] Refreshed via file watcher"),
          });
          watcherRefresh.start().catch((err) =>
            console.warn("[Dashboard] WatcherRefresh failed to start:", err),
          );
        }
      }
    }

    if (event.type === "window-closed") {
      // Clean up dashboard resources when dashboard window closes
      const closedState = wm.getWindowState(event.windowId);
      if (closedState?.type === "dashboard" || (dashHost && !closedState)) {
        dashHost?.destroy();
        dashHost = null;
        watcherRefresh?.stop();
        watcherRefresh = null;
      }
    }
  });

  // --- Start file watcher (fire-and-forget; graceful failure if not in Tauri) ---
  startWatcher(planningDir, ".")
    .then(() => shell.updateProcessStatus("watcher", "running"))
    .catch((err) => console.warn("[Watcher] Failed to start:", err));

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
}

document.addEventListener("DOMContentLoaded", init);
