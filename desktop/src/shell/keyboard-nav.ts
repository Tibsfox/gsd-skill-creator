import type { KeyBinding } from "./types";

/** Check if a keyboard event matches a binding's key + modifiers */
function matchKey(event: KeyboardEvent, binding: KeyBinding): boolean {
  if (event.key.toLowerCase() !== binding.key.toLowerCase()) return false;
  if (event.ctrlKey !== (binding.ctrl ?? false)) return false;
  if (event.altKey !== (binding.alt ?? false)) return false;
  if (event.shiftKey !== (binding.shift ?? false)) return false;
  return true;
}

/**
 * Global keyboard shortcut manager.
 *
 * Listens for keydown events on the document and dispatches
 * to registered handlers based on key + modifier matching.
 */
export class KeyboardManager {
  private bindings = new Map<string, KeyBinding>();
  private enabled = true;
  private listening = false;

  private readonly keydownHandler = (e: KeyboardEvent): void => {
    if (!this.enabled) return;

    for (const binding of this.bindings.values()) {
      if (matchKey(e, binding)) {
        e.preventDefault();
        binding.handler();
        return;
      }
    }
  };

  /**
   * Register a set of key bindings.
   * Starts listening for keyboard events.
   */
  register(bindings: readonly KeyBinding[]): void {
    for (const b of bindings) {
      this.bindings.set(b.action, b);
    }
    if (!this.listening) {
      document.addEventListener("keydown", this.keydownHandler);
      this.listening = true;
    }
  }

  /** Add a single binding at runtime */
  addBinding(binding: KeyBinding): void {
    this.bindings.set(binding.action, binding);
    if (!this.listening) {
      document.addEventListener("keydown", this.keydownHandler);
      this.listening = true;
    }
  }

  /** Remove a binding by action name */
  removeBinding(action: string): void {
    this.bindings.delete(action);
  }

  /** Get all registered bindings (for menu shortcut hints) */
  getBindings(): readonly KeyBinding[] {
    return Array.from(this.bindings.values());
  }

  /** Temporarily disable all keyboard handling (e.g., when text input is focused) */
  disable(): void {
    this.enabled = false;
  }

  /** Re-enable keyboard handling */
  enable(): void {
    this.enabled = true;
  }

  /** Whether keyboard handling is currently enabled */
  isEnabled(): boolean {
    return this.enabled;
  }

  /** Remove all bindings and stop listening */
  destroy(): void {
    document.removeEventListener("keydown", this.keydownHandler);
    this.bindings.clear();
    this.enabled = true;
    this.listening = false;
  }
}
