import type { WindowBounds } from "./types";

/** Gadget action types emitted by titlebar buttons */
export type GadgetAction = "close" | "depth" | "zoom";

/** Callback for gadget actions */
export type GadgetCallback = (action: GadgetAction) => void;

/** Chrome elements returned by createWindowChrome */
export interface WindowChromeElements {
  /** Outer container (the window frame) */
  frame: HTMLDivElement;
  /** The titlebar element (drag handle) */
  titlebar: HTMLDivElement;
  /** The content area inside the frame (mount point for window content) */
  content: HTMLDivElement;
  /** The resize handle at bottom-right corner */
  resizeHandle: HTMLDivElement;
  /** Update the title text */
  setTitle: (title: string) => void;
  /** Set active/inactive visual state */
  setActive: (active: boolean) => void;
}

/**
 * Create Amiga-style window chrome DOM elements.
 *
 * Layout:
 * +--[close]----[ title ]----[depth][zoom]--+
 * |                                          |
 * |              content area                |
 * |                                          |
 * +--------------------------------------[//]+
 *                                        ^ resize handle
 *
 * Gadget layout (Amiga Workbench style):
 * - Close gadget: left side of titlebar (small square button)
 * - Title: centered text in titlebar
 * - Depth gadget: right side, cycles z-order (front <-> back)
 * - Zoom gadget: rightmost, toggles maximize
 *
 * @param title - Window title text
 * @param bounds - Initial window position and size
 * @param onGadget - Callback when a titlebar gadget is clicked
 */
export function createWindowChrome(
  title: string,
  bounds: WindowBounds,
  onGadget: GadgetCallback,
): WindowChromeElements {
  // Frame (the window container)
  const frame = document.createElement("div");
  frame.className = "wm-frame";
  frame.style.position = "absolute";
  frame.style.left = `${bounds.x}px`;
  frame.style.top = `${bounds.y}px`;
  frame.style.width = `${bounds.width}px`;
  frame.style.height = `${bounds.height}px`;
  frame.style.display = "flex";
  frame.style.flexDirection = "column";

  // Titlebar
  const titlebar = document.createElement("div");
  titlebar.className = "wm-titlebar";
  titlebar.style.display = "flex";
  titlebar.style.alignItems = "center";

  // Left section: close gadget
  const leftSection = document.createElement("div");
  leftSection.dataset.section = "left";

  const closeBtn = document.createElement("button");
  closeBtn.className = "wm-gadget wm-gadget--close";
  closeBtn.dataset.gadget = "close";
  closeBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    onGadget("close");
  });
  leftSection.appendChild(closeBtn);

  // Center section: title
  const titleSpan = document.createElement("span");
  titleSpan.className = "wm-title";
  titleSpan.style.flex = "1";
  titleSpan.style.textAlign = "center";
  titleSpan.textContent = title;

  // Right section: depth + zoom gadgets
  const rightSection = document.createElement("div");
  rightSection.dataset.section = "right";

  const depthBtn = document.createElement("button");
  depthBtn.className = "wm-gadget wm-gadget--depth";
  depthBtn.dataset.gadget = "depth";
  depthBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    onGadget("depth");
  });

  const zoomBtn = document.createElement("button");
  zoomBtn.className = "wm-gadget wm-gadget--zoom";
  zoomBtn.dataset.gadget = "zoom";
  zoomBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    onGadget("zoom");
  });

  rightSection.appendChild(depthBtn);
  rightSection.appendChild(zoomBtn);

  titlebar.appendChild(leftSection);
  titlebar.appendChild(titleSpan);
  titlebar.appendChild(rightSection);

  // Content area
  const content = document.createElement("div");
  content.className = "wm-content";
  content.style.flex = "1";
  content.style.overflow = "hidden";

  // Resize handle
  const resizeHandle = document.createElement("div");
  resizeHandle.className = "wm-resize-handle";
  resizeHandle.style.position = "absolute";
  resizeHandle.style.bottom = "0";
  resizeHandle.style.right = "0";
  resizeHandle.style.width = "16px";
  resizeHandle.style.height = "16px";
  resizeHandle.style.cursor = "nwse-resize";

  // Assemble
  frame.appendChild(titlebar);
  frame.appendChild(content);
  frame.appendChild(resizeHandle);

  return {
    frame,
    titlebar,
    content,
    resizeHandle,
    setTitle(newTitle: string) {
      titleSpan.textContent = newTitle;
    },
    setActive(active: boolean) {
      if (active) {
        frame.classList.add("wm-frame--active");
        frame.classList.remove("wm-frame--inactive");
      } else {
        frame.classList.remove("wm-frame--active");
        frame.classList.add("wm-frame--inactive");
      }
    },
  };
}
