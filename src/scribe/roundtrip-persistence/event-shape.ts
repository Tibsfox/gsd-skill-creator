/**
 * SCRIBE Round-Trip Persistence — event-shape.ts
 *
 * Validates and normalises a raw `RoundTripMetadata` payload before it is
 * handed to the SQL layer. All field-level invariants (SHA hex length, direction
 * closed-set, required fields, etc.) are enforced here so that `insert-event.ts`
 * can assume a clean payload.
 *
 * Component 05 (Wave 2). CAP-019 / CAP-042.
 *
 * @module scribe/roundtrip-persistence/event-shape
 */

import type { RoundTripMetadata, SourceLanguage } from '../types/metadata-namespace.js';
import { SOURCE_LANGUAGES } from '../types/metadata-namespace.js';

// ---------------------------------------------------------------------------
// Validation result type
// ---------------------------------------------------------------------------

export type ValidationOk = { ok: true; payload: RoundTripMetadata };
export type ValidationErr = { ok: false; reason: string };
export type ValidationResult = ValidationOk | ValidationErr;

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** 40-char hex string (SHA-1) — used for sourceSha / targetSha / svgSha. */
const HEX_RE = /^[0-9a-f]{40}$/i;

function isHex40(value: unknown): value is string {
  return typeof value === 'string' && HEX_RE.test(value);
}

const VALID_DIRECTIONS = new Set<string>(['forward', 'reverse']);
/** Closed set of languages from `SOURCE_LANGUAGES` (metadata-namespace.ts). */
const VALID_LANGUAGES = new Set<string>(SOURCE_LANGUAGES);

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Validate a raw incoming JSON object as `RoundTripMetadata`.
 *
 * Returns `{ ok: true, payload }` on success, or `{ ok: false, reason }` on
 * any structural / domain violation.
 */
export function validateRoundTripPayload(raw: unknown): ValidationResult {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ok: false, reason: 'payload must be a non-null object' };
  }

  const r = raw as Record<string, unknown>;

  // direction — closed set
  if (!VALID_DIRECTIONS.has(r['direction'] as string)) {
    return {
      ok: false,
      reason: `direction must be 'forward' or 'reverse'; got ${JSON.stringify(r['direction'])}`,
    };
  }

  // sourceLanguage / targetLanguage — must be a member of the SourceLanguage closed set
  if (
    typeof r['sourceLanguage'] !== 'string' ||
    !VALID_LANGUAGES.has(r['sourceLanguage'])
  ) {
    return {
      ok: false,
      reason: `sourceLanguage must be one of: ${[...VALID_LANGUAGES].join(', ')}; got ${JSON.stringify(r['sourceLanguage'])}`,
    };
  }
  if (
    typeof r['targetLanguage'] !== 'string' ||
    !VALID_LANGUAGES.has(r['targetLanguage'])
  ) {
    return {
      ok: false,
      reason: `targetLanguage must be one of: ${[...VALID_LANGUAGES].join(', ')}; got ${JSON.stringify(r['targetLanguage'])}`,
    };
  }

  // SHAs — must be 40-char hex
  if (!isHex40(r['sourceSha'])) {
    return {
      ok: false,
      reason: `sourceSha must be a 40-char hex string; got ${JSON.stringify(r['sourceSha'])}`,
    };
  }
  if (!isHex40(r['targetSha'])) {
    return {
      ok: false,
      reason: `targetSha must be a 40-char hex string; got ${JSON.stringify(r['targetSha'])}`,
    };
  }
  if (!isHex40(r['svgSha'])) {
    return {
      ok: false,
      reason: `svgSha must be a 40-char hex string; got ${JSON.stringify(r['svgSha'])}`,
    };
  }

  // emittedAt — optional ISO-8601 string
  if (r['emittedAt'] !== undefined) {
    if (typeof r['emittedAt'] !== 'string') {
      return { ok: false, reason: 'emittedAt must be a string (ISO-8601) when present' };
    }
    const d = new Date(r['emittedAt'] as string);
    if (isNaN(d.getTime())) {
      return {
        ok: false,
        reason: `emittedAt is not a valid ISO-8601 date: ${JSON.stringify(r['emittedAt'])}`,
      };
    }
  }

  // extras — optional object (not array, not primitive)
  if (r['extras'] !== undefined) {
    if (
      typeof r['extras'] !== 'object' ||
      r['extras'] === null ||
      Array.isArray(r['extras'])
    ) {
      return { ok: false, reason: 'extras must be a plain object when present' };
    }
  }

  const payload: RoundTripMetadata = {
    direction: r['direction'] as 'forward' | 'reverse',
    sourceLanguage: r['sourceLanguage'] as SourceLanguage,
    targetLanguage: r['targetLanguage'] as SourceLanguage,
    sourceSha: r['sourceSha'] as string,
    targetSha: r['targetSha'] as string,
    svgSha: r['svgSha'] as string,
    ...(r['emittedAt'] !== undefined ? { emittedAt: r['emittedAt'] as string } : {}),
    ...(r['extras'] !== undefined
      ? { extras: r['extras'] as Record<string, unknown> }
      : {}),
  };

  return { ok: true, payload };
}

/**
 * Convenience type-guard that narrows a `ValidationResult` to the success variant.
 */
export function isValidPayload(result: ValidationResult): result is ValidationOk {
  return result.ok;
}

/**
 * Build the human-readable `label` for the `prov_node.label` column.
 * Format: `"roundtrip(<exampleId>): <direction>"` if exampleId is derivable,
 * otherwise `"roundtrip: <direction>"`.
 *
 * The `exampleId` is sourced from `payload.extras?.exampleId` when present.
 */
export function buildLabel(payload: RoundTripMetadata): string {
  const id = payload.extras?.['exampleId'];
  const idPart = typeof id === 'string' && id.trim() !== '' ? `(${id.trim()})` : '';
  return `roundtrip${idPart}: ${payload.direction}`;
}

/**
 * Known source/target languages for validation reporting.
 * Exported so tests can inspect coverage.
 */
export { VALID_DIRECTIONS, VALID_LANGUAGES };
