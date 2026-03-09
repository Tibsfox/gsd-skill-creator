/**
 * UTC Timestamp Enforcement — w-wl-utc
 *
 * All timestamps in the trust system must be UTC with explicit Z suffix.
 * This module provides validation and enforcement for timestamp strings.
 *
 * Why: Owl's muse council finding — clock skew across federation instances
 * requires a single canonical timezone. UTC is the only correct choice.
 * Enforced at the boundary: validate on read, coerce on write.
 */

/**
 * ISO 8601 UTC timestamp pattern.
 * Matches: 2026-03-09T14:30:00Z, 2026-03-09T14:30:00.000Z
 * Rejects: 2026-03-09T14:30:00+00:00, 2026-03-09T14:30:00 (no zone)
 */
const UTC_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;

/**
 * Check if a timestamp string is valid UTC (Z-suffix).
 */
export function isUTC(timestamp: string): boolean {
  return UTC_PATTERN.test(timestamp);
}

/**
 * Validate a timestamp is UTC. Throws if not.
 * Use at read boundaries (parsing from DB, API responses).
 */
export function assertUTC(timestamp: string, context?: string): void {
  if (!isUTC(timestamp)) {
    const prefix = context ? `${context}: ` : '';
    throw new Error(`${prefix}Timestamp must be UTC with Z suffix, got: ${timestamp}`);
  }
}

/**
 * Coerce a Date to a UTC ISO string (always ends with Z).
 * Use at write boundaries (saving to DB, generating SQL).
 */
export function toUTCString(date: Date): string {
  return date.toISOString();
}

/**
 * Parse a UTC timestamp string into a Date, validating Z-suffix.
 * Rejects non-UTC timestamps to prevent silent offset bugs.
 */
export function parseUTC(timestamp: string, context?: string): Date {
  assertUTC(timestamp, context);
  return new Date(timestamp);
}

/**
 * Coerce a timestamp to UTC if possible.
 * - Already UTC (Z-suffix): returns as-is
 * - Has +00:00 offset: converts to Z suffix
 * - Has other offset or no zone: throws
 *
 * Use for normalizing external input before storage.
 */
export function normalizeToUTC(timestamp: string, context?: string): string {
  if (isUTC(timestamp)) return timestamp;

  // Accept +00:00 as equivalent to Z
  if (timestamp.endsWith('+00:00')) {
    return timestamp.replace('+00:00', 'Z');
  }

  const prefix = context ? `${context}: ` : '';
  throw new Error(`${prefix}Cannot normalize non-UTC timestamp: ${timestamp}`);
}
