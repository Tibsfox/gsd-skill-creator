import type { WindowBounds } from "./types";

/** Callback invoked during drag/resize with updated bounds */
export type BoundsUpdateCallback = (bounds: WindowBounds) => void;

/** Cleanup function to remove event listeners */
export type Cleanup = () => void;

/**
 * Enable drag behavior on an element (typically the titlebar).
 *
 * Uses pointer events (pointerdown/pointermove/pointerup) for unified
 * mouse and touch support. Captures pointer on drag start for reliable
 * tracking even if cursor leaves the element.
 *
 * @param dragHandle - Element to listen for drag start (e.g., titlebar)
 * @param getFrame - Returns the frame element to move
 * @param getBounds - Returns current window bounds
 * @param onUpdate - Called with new bounds during drag
 * @returns Cleanup function to remove listeners
 */
export function enableDrag(
  _dragHandle: HTMLElement,
  _getFrame: () => HTMLElement,
  _getBounds: () => WindowBounds,
  _onUpdate: BoundsUpdateCallback,
): Cleanup {
  throw new Error("Not implemented");
}

/**
 * Enable resize behavior on an element (typically the resize handle).
 *
 * Uses pointer events for unified input. Clamps to minimum dimensions.
 *
 * @param resizeHandle - Element to listen for resize start
 * @param getFrame - Returns the frame element to resize
 * @param getBounds - Returns current window bounds
 * @param onUpdate - Called with new bounds during resize
 * @returns Cleanup function to remove listeners
 */
export function enableResize(
  _resizeHandle: HTMLElement,
  _getFrame: () => HTMLElement,
  _getBounds: () => WindowBounds,
  _onUpdate: BoundsUpdateCallback,
): Cleanup {
  throw new Error("Not implemented");
}
