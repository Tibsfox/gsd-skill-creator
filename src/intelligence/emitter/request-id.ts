/**
 * Request ID generation for vision seeds.
 *
 * Format: `req_${YYYY-MM-DD}_${HHMM}_${nanoid8}` per D-25-18.
 *
 * The 8-char nanoid suffix guarantees uniqueness even at sub-second emission
 * cadence (the Rust side has the equivalent generator at server.rs:
 * `generate_request_id`).
 *
 * Suffix length history: was 4 chars (36^4 = 1.68M space → ~0.3% birthday-paradox
 * collision at 100 calls in a tight loop — surfaced as CI flake on
 * src/intelligence/__tests__/edge/emitter-edge-cases.test.ts E13 in v1.49.621).
 * Bumped to 8 chars (36^8 = 2.8 trillion space → effectively never collides).
 * Lesson 10 in docs/release-notes/v1.49.621/chapter/03-retrospective.md.
 */

import { customAlphabet } from 'nanoid';

const NANOID_CHARS = '0123456789abcdefghijklmnopqrstuvwxyz';
const nanoid8 = customAlphabet(NANOID_CHARS, 8);

export function generateRequestId(now: Date = new Date()): string {
  const y = now.getUTCFullYear().toString().padStart(4, '0');
  const m = (now.getUTCMonth() + 1).toString().padStart(2, '0');
  const d = now.getUTCDate().toString().padStart(2, '0');
  const hh = now.getUTCHours().toString().padStart(2, '0');
  const mm = now.getUTCMinutes().toString().padStart(2, '0');
  return `req_${y}-${m}-${d}_${hh}${mm}_${nanoid8()}`;
}
