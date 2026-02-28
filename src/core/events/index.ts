/**
 * Events module barrel exports.
 *
 * Provides the complete inter-skill communication infrastructure:
 * - Types and schemas for event validation
 * - JSONL append-log store for event persistence
 * - Lifecycle helpers for emit/consume/expire convenience
 */

// Types and schemas
export { EventNameSchema, SkillEventsSchema, EventEntrySchema } from './types.js';
export type { SkillEvents, EventEntry, EventConnectionSuggestion } from './types.js';

// Store
export { EventStore } from './event-store.js';

// Lifecycle
export { emitEvent, consumeEvent, expireStaleEvents } from './event-lifecycle.js';

// Event boost
export { applyEventBoost } from './event-boost.js';
export type { EventAwareSkill } from './event-boost.js';

// Event suggestions
export { EventSuggester } from './event-suggester.js';
export type { EventSuggesterConfig } from './event-suggester.js';
