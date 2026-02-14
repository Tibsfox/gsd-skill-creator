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
  _title: string,
  _bounds: WindowBounds,
  _onGadget: GadgetCallback,
): WindowChromeElements {
  throw new Error("Not implemented");
}
