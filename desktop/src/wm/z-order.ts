import type { WindowId, ZStack } from "./types";

/** Create an empty z-order stack */
export function createZStack(): ZStack {
  throw new Error("Not implemented");
}

/** Bring a window to the front (top of stack) */
export function bringToFront(_stack: ZStack, _id: WindowId): ZStack {
  throw new Error("Not implemented");
}

/** Send a window to the back (bottom of stack) */
export function sendToBack(_stack: ZStack, _id: WindowId): ZStack {
  throw new Error("Not implemented");
}

/**
 * Amiga-style depth cycling:
 * - If window is at front -> send to back
 * - If window is NOT at front -> bring to front
 */
export function depthCycle(_stack: ZStack, _id: WindowId): ZStack {
  throw new Error("Not implemented");
}

/** Remove a window from the stack */
export function removeFromStack(_stack: ZStack, _id: WindowId): ZStack {
  throw new Error("Not implemented");
}

/** Insert a window at the front of the stack */
export function insertAtFront(_stack: ZStack, _id: WindowId): ZStack {
  throw new Error("Not implemented");
}

/** Get the z-index for a given window (position in stack, 0 = back) */
export function getZIndex(_stack: ZStack, _id: WindowId): number {
  throw new Error("Not implemented");
}

/** Get the frontmost window id, or null if stack is empty */
export function getFront(_stack: ZStack): WindowId | null {
  throw new Error("Not implemented");
}
