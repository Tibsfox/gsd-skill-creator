/**
 * SCRIBE Round-Trip Persistence — barrel export.
 *
 * Consumers should import from this barrel rather than from individual files:
 *
 * ```ts
 * import {
 *   validateRoundTripPayload,
 *   insertRoundtripEvent,
 *   checkIdempotency,
 * } from '../roundtrip-persistence/index.js';
 * ```
 *
 * Component 05 (Wave 2). CAP-019 / CAP-042.
 *
 * @module scribe/roundtrip-persistence
 */

// event-shape: validation + normalisation
export {
  validateRoundTripPayload,
  isValidPayload,
  buildLabel,
  VALID_DIRECTIONS,
  VALID_LANGUAGES,
} from './event-shape.js';

export type { ValidationOk, ValidationErr, ValidationResult } from './event-shape.js';

// idempotency: SHA-4-tuple duplicate check
export { checkIdempotency } from './idempotency.js';
export type { IdempotencyCheckResult } from './idempotency.js';

// insert-event: SQL primitive
export { insertRoundtripEvent } from './insert-event.js';
export type { InsertEventResult } from './insert-event.js';
