import type { DesktopIconDef } from "./types";

/** Handle returned by createDesktopIcons for external interaction */
export interface DesktopIconsHandle {
  /** The container element holding all icons */
  element: HTMLDivElement;
  /** Destroy all icons and clean up listeners */
  destroy: () => void;
}

/**
 * Callback invoked when a desktop icon is double-clicked.
 * Receives the WindowType of the icon.
 */
export type IconActivateCallback = (type: string) => void;

/** CSS display size for pixel-art canvas (6x scale from 8px logical) */
const CANVAS_CSS_SIZE = "48px";

/**
 * Render an 8x8 pixel bitmap to a canvas element.
 * Each bit set in a row's bitmask draws a foreground pixel.
 */
function renderBitmap(canvas: HTMLCanvasElement, bitmap: readonly number[]): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.clearRect(0, 0, 8, 8);
  ctx.fillStyle = "#ffffff";

  for (let y = 0; y < 8; y++) {
    const row = bitmap[y];
    for (let x = 0; x < 8; x++) {
      // Bit 7 is leftmost pixel, bit 0 is rightmost
      if (row & (1 << (7 - x))) {
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }
}

/**
 * Create the desktop icon grid.
 *
 * Renders pixel-art icons for all registered modules.
 * Double-clicking an icon triggers the onActivate callback.
 *
 * @param icons - Icon definitions to render
 * @param onActivate - Called when an icon is double-clicked
 */
export function createDesktopIcons(
  icons: readonly DesktopIconDef[],
  onActivate: IconActivateCallback,
): DesktopIconsHandle {
  const container = document.createElement("div");
  container.className = "shell-icon-column";
  container.style.display = "flex";
  container.style.flexDirection = "column";
  container.style.gap = "12px";
  container.style.padding = "8px";

  // Track listeners for cleanup
  const cleanupFns: Array<() => void> = [];

  for (const icon of icons) {
    // Wrapper
    const wrapper = document.createElement("div");
    wrapper.className = "shell-desktop-icon";
    wrapper.style.cursor = "pointer";
    wrapper.style.textAlign = "center";
    wrapper.style.width = "64px";
    wrapper.style.userSelect = "none";

    // Canvas for pixel-art
    const canvas = document.createElement("canvas");
    canvas.width = 8;
    canvas.height = 8;
    canvas.style.width = CANVAS_CSS_SIZE;
    canvas.style.height = CANVAS_CSS_SIZE;
    canvas.style.imageRendering = "pixelated";

    renderBitmap(canvas, icon.bitmap);

    // Label
    const label = document.createElement("span");
    label.className = "shell-desktop-icon__label";
    label.style.fontFamily = "monospace";
    label.style.fontSize = "10px";
    label.style.color = "var(--wm-icon-text, #ffffff)";
    label.textContent = icon.label;

    // Double-click handler
    const handler = (): void => {
      onActivate(icon.type);
    };
    wrapper.addEventListener("dblclick", handler);
    cleanupFns.push(() => wrapper.removeEventListener("dblclick", handler));

    wrapper.appendChild(canvas);
    wrapper.appendChild(label);
    container.appendChild(wrapper);
  }

  function destroy(): void {
    // Remove all listeners
    for (const cleanup of cleanupFns) {
      cleanup();
    }
    cleanupFns.length = 0;
    // Empty the container
    container.innerHTML = "";
  }

  return { element: container, destroy };
}
