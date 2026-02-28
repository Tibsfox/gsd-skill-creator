import { createHash } from 'crypto';

// ============================================================================
// JSONL Safety Utilities
// ============================================================================
// SHA-256 checksum computation/verification and schema validation for JSONL
// observation entries. Provides tamper-evident integrity (INT-01) and
// malformed-entry rejection (INT-02) as pure utility functions.

/**
 * Custom error for JSONL safety violations.
 */
export class JsonlSafetyError extends Error {
  override name = 'JsonlSafetyError' as const;

  constructor(message: string) {
    super(message);
  }
}

// ---- Checksum Types ----

export interface ChecksummedEntry {
  timestamp: number;
  category: string;
  data: Record<string, unknown>;
  _checksum: string;
  [key: string]: unknown; // Allow extra fields like session_id
}

export interface ChecksumVerification {
  valid: boolean;
  error?: string;
}

// ---- Schema Validation Types ----

export type JsonlValidationResult =
  | { valid: true; entry: { timestamp: number; category: string; data: Record<string, unknown> } }
  | { valid: false; error: string };

// ---- Checksum Functions ----

/**
 * Compute a SHA-256 checksum over the JSON-serialized data payload.
 *
 * @param data - The data object to checksum
 * @returns 64-character lowercase hex digest
 */
export function computeChecksum(data: Record<string, unknown>): string {
  return createHash('sha256').update(JSON.stringify(data)).digest('hex');
}

/**
 * Create a checksummed envelope entry by adding a `_checksum` field.
 * The checksum covers only the `data` field, isolating integrity to the payload.
 *
 * @param envelope - The envelope object with timestamp, category, and data
 * @returns The envelope with an added _checksum field
 */
export function createChecksummedEntry(
  envelope: { timestamp: number; category: string; data: Record<string, unknown>; [key: string]: unknown },
): ChecksummedEntry {
  const checksum = computeChecksum(envelope.data);
  return { ...envelope, _checksum: checksum };
}

/**
 * Verify the integrity of a checksummed entry by recomputing and comparing.
 *
 * @param entry - The entry to verify (must have _checksum and data fields)
 * @returns Verification result with optional error message
 */
export function verifyChecksum(entry: Record<string, unknown>): ChecksumVerification {
  // Check _checksum field presence and type
  if (typeof entry._checksum !== 'string') {
    return { valid: false, error: 'Missing or invalid _checksum field' };
  }

  // Check data field presence and type
  if (entry.data === null || entry.data === undefined || typeof entry.data !== 'object' || Array.isArray(entry.data)) {
    return { valid: false, error: 'Missing or invalid data field' };
  }

  // Recompute and compare
  const expected = computeChecksum(entry.data as Record<string, unknown>);
  if (expected !== entry._checksum) {
    return { valid: false, error: 'Checksum mismatch: entry may have been tampered with' };
  }

  return { valid: true };
}

// ---- Schema Validation ----

/**
 * Validate a JSONL line against the expected envelope schema.
 * Checks for required fields (timestamp, category, data) and correct types.
 *
 * @param line - A single line from a JSONL file
 * @returns Validation result: success with parsed entry, or failure with error
 */
export function validateJsonlEntry(line: string): JsonlValidationResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(line);
  } catch {
    return { valid: false, error: `Invalid JSON: ${line.slice(0, 100)}` };
  }

  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { valid: false, error: 'Entry must be a JSON object' };
  }

  const obj = parsed as Record<string, unknown>;

  if (typeof obj.timestamp !== 'number') {
    return { valid: false, error: 'Missing or invalid timestamp: expected number' };
  }

  if (typeof obj.category !== 'string') {
    return { valid: false, error: 'Missing or invalid category: expected string' };
  }

  if (obj.data === null || obj.data === undefined || typeof obj.data !== 'object' || Array.isArray(obj.data)) {
    return { valid: false, error: 'Missing or invalid data: expected object' };
  }

  return {
    valid: true,
    entry: {
      timestamp: obj.timestamp,
      category: obj.category,
      data: obj.data as Record<string, unknown>,
    },
  };
}
