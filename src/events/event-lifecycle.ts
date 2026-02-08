/**
 * Event lifecycle convenience functions.
 *
 * Provides high-level API for emitting, consuming, and expiring events
 * without requiring direct EventStore construction.
 *
 * - emitEvent: creates a pending event, optionally validates against declared emits
 * - consumeEvent: marks the first matching pending event as consumed
 * - expireStaleEvents: transitions all TTL-exceeded pending events to expired
 */

import { EventStore } from './event-store.js';
import type { EventEntry } from './types.js';

/**
 * Emit an event to the event store.
 *
 * Constructs an EventEntry with status 'pending' and current timestamp,
 * then delegates to EventStore.emit().
 *
 * If skillEvents.emits is provided, validates that eventName is in the
 * declared emits list. Warns to stderr if not (but does NOT throw).
 *
 * @param patternsDir - Directory containing the events.jsonl file
 * @param eventName - Event name in category:action format
 * @param emittedBy - Name of the skill emitting the event
 * @param options - Optional TTL and skill events for validation
 */
export async function emitEvent(
  patternsDir: string,
  eventName: string,
  emittedBy: string,
  options?: {
    ttlHours?: number;
    skillEvents?: { emits?: string[] };
  },
): Promise<void> {
  // Validate against declared emits if provided
  if (options?.skillEvents?.emits) {
    if (!options.skillEvents.emits.includes(eventName)) {
      console.warn(
        `Warning: ${emittedBy} emitting ${eventName} but it is not in declared emits list: [${options.skillEvents.emits.join(', ')}]`,
      );
    }
  }

  const entry: EventEntry = {
    event_name: eventName,
    emitted_by: emittedBy,
    status: 'pending',
    emitted_at: new Date().toISOString(),
    consumed_by: null,
    consumed_at: null,
    ttl_hours: options?.ttlHours ?? 24,
  };

  const store = new EventStore(patternsDir);
  await store.emit(entry);
}

/**
 * Consume the first matching pending event.
 *
 * Delegates to EventStore.consume().
 *
 * @param patternsDir - Directory containing the events.jsonl file
 * @param eventName - Event name to consume
 * @param consumedBy - Name of the skill consuming the event
 */
export async function consumeEvent(
  patternsDir: string,
  eventName: string,
  consumedBy: string,
): Promise<void> {
  const store = new EventStore(patternsDir);
  await store.consume(eventName, consumedBy);
}

/**
 * Expire all TTL-exceeded pending events.
 *
 * Delegates to EventStore.markExpired().
 *
 * @param patternsDir - Directory containing the events.jsonl file
 */
export async function expireStaleEvents(patternsDir: string): Promise<void> {
  const store = new EventStore(patternsDir);
  await store.markExpired();
}
