/**
 * File integrity verification for Aminet mirror downloads.
 *
 * Provides SHA-256 hash computation and file size verification against
 * INDEX metadata. Downloaded files must pass integrity checks before
 * being marked as "mirrored" in the mirror state.
 *
 * Size verification uses Math.round(byteSize / 1024) with +/-1 KB
 * tolerance to account for INDEX rounding differences.
 */

import { createHash } from 'node:crypto';

/**
 * Result of a combined integrity check (hash + size).
 */
export interface IntegrityResult {
  /** Overall validity: true only if size check passes */
  valid: boolean;
  /** SHA-256 hash of the file data (lowercase hex, always computed) */
  sha256: string;
  /** Whether the size check passed within tolerance */
  sizeValid: boolean;
  /** Actual file size in KB (Math.round of bytes / 1024) */
  actualKb: number;
  /** Expected size in KB from INDEX metadata */
  expectedKb: number;
}

/**
 * Compute the SHA-256 hash of raw file data.
 *
 * @param data - Raw file contents as a Buffer
 * @returns Lowercase hexadecimal SHA-256 hash string (64 characters)
 */
export function computeSha256(data: Buffer): string {
  return createHash('sha256').update(data).digest('hex');
}

/**
 * Verify file size against expected KB from the Aminet INDEX.
 *
 * Converts byte length to KB via Math.round(bytes / 1024) and allows
 * +/-1 KB tolerance to account for INDEX rounding differences.
 *
 * @param data - Raw file contents as a Buffer
 * @param expectedKb - Expected size in KB from INDEX metadata
 * @returns Object with validity, actual KB, and expected KB
 */
export function verifySizeKb(
  data: Buffer,
  expectedKb: number,
): { valid: boolean; actualKb: number; expectedKb: number } {
  const actualKb = Math.round(data.byteLength / 1024);
  const valid = Math.abs(actualKb - expectedKb) <= 1;
  return { valid, actualKb, expectedKb };
}

/**
 * Verify integrity of downloaded file data.
 *
 * Combines SHA-256 hash computation with size verification. The hash
 * is always computed and returned, even when the size check fails --
 * this allows storing the hash for later cross-referencing.
 *
 * @param data - Raw file contents as a Buffer
 * @param expectedKb - Expected size in KB from INDEX metadata
 * @returns IntegrityResult with hash, size check, and overall validity
 */
export function verifyIntegrity(
  data: Buffer,
  expectedKb: number,
): IntegrityResult {
  const sha256 = computeSha256(data);
  const sizeCheck = verifySizeKb(data, expectedKb);
  return {
    valid: sizeCheck.valid,
    sha256,
    sizeValid: sizeCheck.valid,
    actualKb: sizeCheck.actualKb,
    expectedKb: sizeCheck.expectedKb,
  };
}
