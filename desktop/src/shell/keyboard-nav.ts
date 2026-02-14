import type { KeyBinding } from "./types";

/**
 * Global keyboard shortcut manager.
 *
 * Listens for keydown events on the document and dispatches
 * to registered handlers based on key + modifier matching.
 */
export class KeyboardManager {
  /**
   * Register a set of key bindings.
   * Starts listening for keyboard events.
   */
  register(_bindings: readonly KeyBinding[]): void {
    throw new Error("Not implemented");
  }

  /** Add a single binding at runtime */
  addBinding(_binding: KeyBinding): void {
    throw new Error("Not implemented");
  }

  /** Remove a binding by action name */
  removeBinding(_action: string): void {
    throw new Error("Not implemented");
  }

  /** Get all registered bindings (for menu shortcut hints) */
  getBindings(): readonly KeyBinding[] {
    throw new Error("Not implemented");
  }

  /** Temporarily disable all keyboard handling (e.g., when text input is focused) */
  disable(): void {
    throw new Error("Not implemented");
  }

  /** Re-enable keyboard handling */
  enable(): void {
    throw new Error("Not implemented");
  }

  /** Whether keyboard handling is currently enabled */
  isEnabled(): boolean {
    throw new Error("Not implemented");
  }

  /** Remove all bindings and stop listening */
  destroy(): void {
    throw new Error("Not implemented");
  }
}
