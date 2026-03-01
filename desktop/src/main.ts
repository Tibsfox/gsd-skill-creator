import { Engine } from "./engine";
import { WindowManager } from "./wm";
import { DesktopShell } from "./shell";
import { DashboardHost, WatcherRefresh, applyPalette, DEFAULT_PALETTE } from "./dashboard";
import { startWatcher } from "./ipc/watcher";
import { CalibrationWizard, loadUserStyle, isFirstBoot, applyUserStyleCSS } from "./calibration";
import {
  shouldSkipBoot,
  createBootRenderer,
  createDesktopBackground,
  detectAccessibilityPreferences,
  applyAccessibilityMode,
  watchAccessibilityChanges,
} from "./boot";
import "@xterm/xterm/css/xterm.css";
import "./styles/main.css";
import "./styles/boot.css";

const terminalHandles = new Map<string, { dispose: () => Promise<void> }>();

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

  // --- Load user style ---
  let userStyle = loadUserStyle();

  // --- Accessibility check (before engine starts) ---
  const a11y = detectAccessibilityPreferences();
  if (a11y.isAccessibilityMode) {
    applyAccessibilityMode(engine, document.body);
  }

  // --- First-boot calibration gate ---
  if (isFirstBoot(userStyle.calibrated)) {
    // Show calibration wizard; desktop loads after completion
    await new Promise<void>((resolve) => {
      const wizard = new CalibrationWizard({
        container: desktop,
        engine,
        onComplete: (style) => {
          userStyle = style;
          if (!a11y.isAccessibilityMode) {
            engine.setPaletteColors(style.palette.colors);
            engine.updateConfig(style.crt);
          }
          resolve();
        },
      });
      wizard.start();
    });
  } else if (!a11y.isAccessibilityMode) {
    // Apply saved style immediately (only if not in accessibility mode)
    applyUserStyleCSS(userStyle);
    if (userStyle.palette.colors.length === 32) {
      engine.setPaletteColors(userStyle.palette.colors);
    }
    engine.updateConfig(userStyle.crt);
  }

  engine.start();

  // --- Watch for accessibility changes at runtime ---
  watchAccessibilityChanges(
    engine,
    document.body,
    () => userStyle,
  );

  // --- Boot sequence ---
  if (!a11y.isAccessibilityMode && !shouldSkipBoot(userStyle.boot)) {
    const bootRenderer = createBootRenderer({
      container: app,
      palette: userStyle.palette.colors.length === 32 ? userStyle.palette.colors : undefined,
    });
    await bootRenderer.start();
    // Boot complete -- renderer auto-destroys
  }

  // --- Desktop background ---
  createDesktopBackground(engine, userStyle.boot.background);

  // --- Apply palette CSS custom properties (fallback for dashboard) ---
  applyPalette(DEFAULT_PALETTE);

  // --- Window Manager ---
  const wm = new WindowManager(desktop, iconArea);

  // --- Desktop Shell (icons, taskbar, menu, keyboard) ---
  const shell = new DesktopShell({ desktop, wm });
  shell.init();

  // --- Full Pipeline Wiring (Phase 383: Integration) ---
  try {
    const {
      ChatPipeline, LedBridge, StagingBridge,
      BootstrapFlow, ErrorRecoveryManager, PersistenceManager,
    } = await import("./pipeline");
    const ipcCommands = await import("./ipc/commands");

    // PersistenceManager: load magic level from config
    const persistence = new PersistenceManager({
      setMagicLevel: ipcCommands.setMagicLevel,
      getMagicLevel: ipcCommands.getMagicLevel,
      getConversationHistory: ipcCommands.getConversationHistory,
    });
    const initialLevel = await persistence.loadMagicLevel();
    console.log(`[Bootstrap] Magic level: ${initialLevel}`);

    // Pipeline classes and BootstrapFlow are ready. Actual ChatRenderer
    // and MagicFilter instances are connected when the CLI Chat window
    // opens. The bootstrap sequence runs from there.
    console.log("[Bootstrap] Integration pipeline ready");
  } catch (err) {
    console.warn("[Bootstrap] Integration deferred:", err);
  }

  // --- Dashboard integration: mount DashboardHost when dashboard window opens ---
  const planningDir = ".planning";
  let dashHost: DashboardHost | null = null;
  let watcherRefresh: WatcherRefresh | null = null;

  wm.on(async (event) => {
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

      // v1.49.7 (PR #24 @PatrickRobotham): detect tmux availability and fall
      // back to raw PTY terminal when tmux is not installed.
      if (state?.type === "terminal") {
        const content = wm.getContentElement(event.windowId);
        if (content) {
          try {
            const { tmuxHasTmux, createTmuxTerminal } = await import("./tmux");
            const hasTmux = await tmuxHasTmux();
            if (hasTmux) {
              const handle = await createTmuxTerminal(content, event.windowId);
              shell.updateProcessStatus("terminal", "running");
              terminalHandles.set(event.windowId, handle);
            } else {
              // Fallback: raw PTY terminal without tmux
              console.warn("[Terminal] tmux not available, falling back to raw PTY");
              const { createTerminal } = await import("./terminal/terminal-emulator");
              const handle = await createTerminal(content, event.windowId);
              shell.updateProcessStatus("terminal", "running");
              terminalHandles.set(event.windowId, handle);
            }
          } catch (err) {
            console.error("[Terminal] Failed to create terminal:", err);
            content.textContent = `Terminal error: ${err}`;
            shell.updateProcessStatus("terminal", "stopped");
          }
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

      // Clean up terminal resources when terminal window closes
      if (terminalHandles.has(event.windowId)) {
        const handle = terminalHandles.get(event.windowId)!;
        await handle.dispose();
        terminalHandles.delete(event.windowId);
        if (terminalHandles.size === 0) {
          shell.updateProcessStatus("terminal", "stopped");
        }
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
      const statusMap: Record<string, string> = {
        active: "running",
        paused: "paused",
        idle: "idle",
        starting: "idle",
        stopped: "stopped",
      };
      shell.updateProcessStatus("claude", statusMap[event.status] ?? "idle");
    });
  } catch {
    // SessionMonitor requires Tauri runtime
  }
}

document.addEventListener("DOMContentLoaded", init);
