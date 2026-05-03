/**
 * Request ID generation for vision seeds.
 *
 * Format: `req_${YYYY-MM-DD}_${HHMM}_${nanoid4}` per D-25-18.
 *
 * The 4-char nanoid suffix guarantees uniqueness even at sub-second emission
 * cadence (the Rust side has the equivalent generator at server.rs:
 * `generate_request_id`).
 */

import { customAlphabet } from 'nanoid';

const NANOID_CHARS = '0123456789abcdefghijklmnopqrstuvwxyz';
const nanoid4 = customAlphabet(NANOID_CHARS, 4);

export function generateRequestId(now: Date = new Date()): string {
  const y = now.getUTCFullYear().toString().padStart(4, '0');
  const m = (now.getUTCMonth() + 1).toString().padStart(2, '0');
  const d = now.getUTCDate().toString().padStart(2, '0');
  const hh = now.getUTCHours().toString().padStart(2, '0');
  const mm = now.getUTCMinutes().toString().padStart(2, '0');
  return `req_${y}-${m}-${d}_${hh}${mm}_${nanoid4()}`;
}
