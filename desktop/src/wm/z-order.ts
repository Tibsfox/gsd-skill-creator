import type { WindowId, ZStack } from "./types";

/** Create an empty z-order stack */
export function createZStack(): ZStack {
  return [];
}

/** Bring a window to the front (top of stack) */
export function bringToFront(stack: ZStack, id: WindowId): ZStack {
  const idx = stack.indexOf(id);
  if (idx === -1) return stack;
  if (idx === stack.length - 1) return [...stack];
  return [...stack.filter((w) => w !== id), id];
}

/** Send a window to the back (bottom of stack) */
export function sendToBack(stack: ZStack, id: WindowId): ZStack {
  const idx = stack.indexOf(id);
  if (idx === -1) return stack;
  if (idx === 0) return [...stack];
  return [id, ...stack.filter((w) => w !== id)];
}

/**
 * Amiga-style depth cycling:
 * - If window is at front -> send to back
 * - If window is NOT at front -> bring to front
 */
export function depthCycle(stack: ZStack, id: WindowId): ZStack {
  const idx = stack.indexOf(id);
  if (idx === -1) return stack;
  if (idx === stack.length - 1) return sendToBack(stack, id);
  return bringToFront(stack, id);
}

/** Remove a window from the stack */
export function removeFromStack(stack: ZStack, id: WindowId): ZStack {
  const idx = stack.indexOf(id);
  if (idx === -1) return stack;
  return stack.filter((w) => w !== id);
}

/** Insert a window at the front of the stack */
export function insertAtFront(stack: ZStack, id: WindowId): ZStack {
  return [...stack, id];
}

/** Get the z-index for a given window (position in stack, 0 = back) */
export function getZIndex(stack: ZStack, id: WindowId): number {
  return stack.indexOf(id);
}

/** Get the frontmost window id, or null if stack is empty */
export function getFront(stack: ZStack): WindowId | null {
  return stack.length > 0 ? stack[stack.length - 1] : null;
}
