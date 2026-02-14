import type { WindowBounds } from "./types";
import { MIN_WINDOW_WIDTH, MIN_WINDOW_HEIGHT } from "./types";

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
  dragHandle: HTMLElement,
  getFrame: () => HTMLElement,
  getBounds: () => WindowBounds,
  onUpdate: BoundsUpdateCallback,
): Cleanup {
  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let startBounds: WindowBounds = { x: 0, y: 0, width: 0, height: 0 };

  const onPointerDown = (e: PointerEvent): void => {
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    startBounds = { ...getBounds() };
    dragHandle.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: PointerEvent): void => {
    if (!isDragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    const newBounds: WindowBounds = {
      ...startBounds,
      x: startBounds.x + dx,
      y: startBounds.y + dy,
    };
    const frame = getFrame();
    frame.style.left = `${newBounds.x}px`;
    frame.style.top = `${newBounds.y}px`;
    onUpdate(newBounds);
  };

  const onPointerUp = (e: PointerEvent): void => {
    if (!isDragging) return;
    isDragging = false;
    try {
      dragHandle.releasePointerCapture(e.pointerId);
    } catch {
      // pointerId might not match if capture was lost
    }
  };

  dragHandle.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerUp);

  return () => {
    isDragging = false;
    dragHandle.removeEventListener("pointerdown", onPointerDown);
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
  };
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
  resizeHandle: HTMLElement,
  getFrame: () => HTMLElement,
  getBounds: () => WindowBounds,
  onUpdate: BoundsUpdateCallback,
): Cleanup {
  let isResizing = false;
  let startX = 0;
  let startY = 0;
  let startBounds: WindowBounds = { x: 0, y: 0, width: 0, height: 0 };

  const onPointerDown = (e: PointerEvent): void => {
    isResizing = true;
    startX = e.clientX;
    startY = e.clientY;
    startBounds = { ...getBounds() };
    resizeHandle.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: PointerEvent): void => {
    if (!isResizing) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    const newBounds: WindowBounds = {
      x: startBounds.x,
      y: startBounds.y,
      width: Math.max(startBounds.width + dx, MIN_WINDOW_WIDTH),
      height: Math.max(startBounds.height + dy, MIN_WINDOW_HEIGHT),
    };
    const frame = getFrame();
    frame.style.width = `${newBounds.width}px`;
    frame.style.height = `${newBounds.height}px`;
    onUpdate(newBounds);
  };

  const onPointerUp = (e: PointerEvent): void => {
    if (!isResizing) return;
    isResizing = false;
    try {
      resizeHandle.releasePointerCapture(e.pointerId);
    } catch {
      // pointerId might not match if capture was lost
    }
  };

  resizeHandle.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerUp);

  return () => {
    isResizing = false;
    resizeHandle.removeEventListener("pointerdown", onPointerDown);
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
  };
}
