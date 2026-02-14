import type { TaskbarEntry, ProcessIndicator } from "./types";

/** Callback when a taskbar window entry is clicked */
export type TaskbarClickCallback = (windowId: string) => void;

/** Handle for interacting with the taskbar after creation */
export interface TaskbarHandle {
  /** The taskbar DOM element */
  element: HTMLDivElement;
  /** Update the window entries displayed */
  updateEntries: (entries: readonly TaskbarEntry[]) => void;
  /** Update the process indicators displayed */
  updateIndicators: (indicators: readonly ProcessIndicator[]) => void;
  /** Destroy and clean up */
  destroy: () => void;
}

/**
 * Create the taskbar component.
 *
 * Renders at the bottom of the desktop with:
 * - Left: System menu button (placeholder for Plan 03)
 * - Center: Window entry buttons (open/minimized windows)
 * - Right: Process indicators (Claude, watcher, terminal)
 *
 * @param onClick - Called when a window entry is clicked
 */
export function createTaskbar(
  onClick: TaskbarClickCallback,
): TaskbarHandle {
  let destroyed = false;
  let currentOnClick = onClick;

  // Container
  const container = document.createElement("div");
  container.className = "shell-taskbar";
  container.style.position = "fixed";
  container.style.bottom = "0";
  container.style.left = "0";
  container.style.right = "0";
  container.style.height = "32px";
  container.style.display = "flex";
  container.style.background = "var(--wm-titlebar-active, #6688bb)";
  container.style.borderTop = "2px solid var(--wm-border, #000)";
  container.style.zIndex = "9998";

  // Left section (system menu)
  const left = document.createElement("div");
  left.className = "shell-taskbar__left";
  const menuBtn = document.createElement("button");
  menuBtn.className = "shell-taskbar__menu-btn";
  menuBtn.textContent = "\u2261";
  menuBtn.style.width = "24px";
  menuBtn.style.height = "24px";
  left.appendChild(menuBtn);

  // Center section (window entries)
  const center = document.createElement("div");
  center.className = "shell-taskbar__center";
  center.style.display = "flex";
  center.style.gap = "2px";
  center.style.flex = "1";
  center.style.overflowX = "auto";

  // Right section (process indicators)
  const right = document.createElement("div");
  right.className = "shell-taskbar__right";
  right.style.display = "flex";
  right.style.gap = "4px";
  right.style.alignItems = "center";
  right.style.padding = "0 8px";

  container.appendChild(left);
  container.appendChild(center);
  container.appendChild(right);

  function updateEntries(entries: readonly TaskbarEntry[]): void {
    center.innerHTML = "";
    if (destroyed) return;
    for (const entry of entries) {
      const btn = document.createElement("button");
      btn.className = "shell-taskbar__entry";
      if (entry.focused) {
        btn.classList.add("shell-taskbar__entry--active");
      }
      if (entry.minimized) {
        btn.classList.add("shell-taskbar__entry--minimized");
      }
      btn.textContent = entry.title.length > 20
        ? entry.title.slice(0, 20) + "\u2026"
        : entry.title;
      btn.addEventListener("click", () => currentOnClick(entry.windowId));
      center.appendChild(btn);
    }
  }

  function updateIndicators(indicators: readonly ProcessIndicator[]): void {
    right.innerHTML = "";
    for (const indicator of indicators) {
      const el = document.createElement("div");
      el.className = `shell-indicator shell-indicator--${indicator.status}`;

      const dot = document.createElement("span");
      dot.className = "shell-indicator__dot";
      dot.style.display = "inline-block";
      dot.style.width = "8px";
      dot.style.height = "8px";
      dot.style.borderRadius = "50%";

      const label = document.createElement("span");
      label.style.fontFamily = "monospace";
      label.style.fontSize = "10px";
      label.textContent = indicator.label;

      el.appendChild(dot);
      el.appendChild(label);
      right.appendChild(el);
    }
  }

  function destroy(): void {
    destroyed = true;
    container.innerHTML = "";
  }

  return {
    element: container,
    updateEntries,
    updateIndicators,
    destroy,
  };
}
