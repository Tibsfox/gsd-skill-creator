/**
 * IntelligenceEventBus — singleton in-process pub/sub.
 *
 * Phase 827 / C02 — SSE event emitter.
 *
 * The bus is the single source of truth for intelligence events inside the
 * dashboard server process. Any code that writes to KB can call
 * `intelligenceEventBus.publish(event)` and every SSE client (browser tab)
 * will receive it via the `scripts/serve-dashboard.mjs` subscription wired
 * at startup.
 *
 * Subscriber isolation: a throwing subscriber does NOT interrupt delivery to
 * subsequent subscribers (catch-and-log pattern).
 *
 * This module does NOT import `@tauri-apps/api` and is safe to import from
 * store-layer code (`src/intelligence/kb/store.ts`).
 */

import type { EventBus, IntelligenceEvent } from './types.js';

class IntelligenceEventBusImpl implements EventBus<IntelligenceEvent> {
  private readonly subscribers: Set<(event: IntelligenceEvent) => void> = new Set();

  subscribe(cb: (event: IntelligenceEvent) => void): () => void {
    this.subscribers.add(cb);
    return () => {
      this.subscribers.delete(cb);
    };
  }

  publish(event: IntelligenceEvent): void {
    // Iterate over a snapshot so that any subscribe/unsubscribe inside a
    // callback doesn't affect the current delivery round.
    const snapshot = Array.from(this.subscribers);
    for (const cb of snapshot) {
      try {
        cb(event);
      } catch (err) {
        // Subscriber errors must NOT block sibling subscribers.
        // eslint-disable-next-line no-console
        console.error('[intelligence-event-bus] subscriber threw:', err);
      }
    }
  }

  /** Test-only: clear all subscribers without replacing the singleton. */
  _clear(): void {
    this.subscribers.clear();
  }

  /** Test-only: return subscriber count. */
  _count(): number {
    return this.subscribers.size;
  }
}

// ---------------------------------------------------------------------------
// Singleton — one instance per process
// ---------------------------------------------------------------------------

let _singleton: IntelligenceEventBusImpl | null = null;

/**
 * Returns the process-level singleton `IntelligenceEventBus`.
 *
 * Always use this function rather than constructing a new bus; multiple callers
 * must share the same instance so that publish/subscribe are visible across
 * the codebase.
 */
export function getIntelligenceEventBus(): EventBus<IntelligenceEvent> & {
  _clear(): void;
  _count(): number;
} {
  if (!_singleton) {
    _singleton = new IntelligenceEventBusImpl();
  }
  return _singleton;
}

/**
 * TEST-ONLY: reset the singleton so each test starts with a fresh bus.
 *
 * Not re-exported via index.ts — only available to tests via direct import.
 */
export function _resetIntelligenceEventBusForTesting(): void {
  _singleton = null;
}
