/**
 * Context-aware virus signature scanning engine for Amiga binaries.
 *
 * Matches hex byte patterns against Uint8Array buffers with:
 * - Context dispatch: bootblock sigs scan boot blocks, file/link sigs scan hunk files
 * - Fixed and sliding-window offset modes
 * - Wildcard bitmask support for partial byte matching
 * - Pre-compiled hex patterns for performance
 *
 * @module signature-scanner
 */

import type { VirusSignature, ScanMatch, SignaturePattern } from './types.js';

/**
 * Convert a hex string to Uint8Array.
 *
 * Each pair of hex characters becomes one byte. Case-insensitive.
 * Throws on odd-length strings (incomplete byte).
 *
 * @param hex - Hex string (e.g., "48656C6C6F")
 * @returns Byte array
 * @throws Error if hex string has odd length
 */
export function hexToBytes(hex: string): Uint8Array {
  if (hex.length === 0) {
    return new Uint8Array(0);
  }
  if (hex.length % 2 !== 0) {
    throw new Error(`Odd-length hex string: "${hex}" (length ${hex.length})`);
  }
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

/**
 * Check if a buffer starts with the Amiga DOS magic bytes (bootblock).
 *
 * Recognizes DOS\0 through DOS\5:
 * - Bytes 0-2: 0x44 0x4F 0x53 ("DOS")
 * - Byte 3: 0x00 through 0x05 (filesystem variant)
 *
 * @param data - Binary buffer to check
 * @returns true if buffer is an Amiga boot block
 */
export function isBootBlock(data: Uint8Array): boolean {
  if (data.length < 4) {
    return false;
  }
  return (
    data[0] === 0x44 && // D
    data[1] === 0x4F && // O
    data[2] === 0x53 && // S
    data[3] >= 0x00 &&
    data[3] <= 0x05
  );
}

/**
 * Check if a buffer starts with the HUNK_HEADER magic (0x000003F3).
 *
 * This identifies AmigaOS executable (hunk) files.
 *
 * @param data - Binary buffer to check
 * @returns true if buffer is an Amiga hunk executable
 */
export function isHunkFile(data: Uint8Array): boolean {
  if (data.length < 4) {
    return false;
  }
  return (
    data[0] === 0x00 &&
    data[1] === 0x00 &&
    data[2] === 0x03 &&
    data[3] === 0xF3
  );
}

/** Pre-compiled pattern: hex bytes and optional mask converted to Uint8Array */
interface CompiledPattern {
  bytes: Uint8Array;
  mask: Uint8Array | null;
  offset: number | 'any';
  index: number;
}

/**
 * Pre-compile signature patterns from hex strings to byte arrays.
 * This avoids re-parsing hex for every scan position.
 */
function compilePatterns(patterns: SignaturePattern[]): CompiledPattern[] {
  return patterns.map((p, index) => ({
    bytes: hexToBytes(p.bytes),
    mask: p.mask ? hexToBytes(p.mask) : null,
    offset: p.offset ?? 'any',
    index,
  }));
}

/**
 * Check if a pattern matches at a specific offset in the data buffer.
 *
 * When a mask is present, each byte is compared as:
 *   (data[pos+j] & mask[j]) === (pattern[j] & mask[j])
 * A mask byte of 0x00 means "don't care" (wildcard).
 * A mask byte of 0xFF means "exact match".
 */
function matchesAt(
  data: Uint8Array,
  offset: number,
  pattern: Uint8Array,
  mask: Uint8Array | null,
): boolean {
  if (offset + pattern.length > data.length) {
    return false;
  }
  if (mask) {
    for (let j = 0; j < pattern.length; j++) {
      if ((data[offset + j] & mask[j]) !== (pattern[j] & mask[j])) {
        return false;
      }
    }
  } else {
    for (let j = 0; j < pattern.length; j++) {
      if (data[offset + j] !== pattern[j]) {
        return false;
      }
    }
  }
  return true;
}

/**
 * Scan a buffer against virus signatures with context-aware dispatch.
 *
 * Context rules:
 * - 'bootblock' signatures: only tested if isBootBlock(data), scan first 1024 bytes
 * - 'file' signatures: only tested if isHunkFile(data), scan entire buffer
 * - 'link' signatures: only tested if isHunkFile(data), scan entire buffer
 *
 * For each signature, the first matching pattern triggers a ScanMatch and the
 * scanner moves to the next signature (one match per signature maximum).
 *
 * @param data - Binary buffer to scan
 * @param signatures - Virus signatures to match against
 * @returns Array of matches found (empty = clean)
 */
export function scanBuffer(
  data: Uint8Array,
  signatures: VirusSignature[],
): ScanMatch[] {
  const matches: ScanMatch[] = [];

  // Determine data type once
  const isBoot = isBootBlock(data);
  const isHunk = isHunkFile(data);

  for (const sig of signatures) {
    // Context-aware dispatch: skip mismatched contexts
    if (sig.type === 'bootblock' && !isBoot) {
      continue;
    }
    if ((sig.type === 'file' || sig.type === 'link') && !isHunk) {
      continue;
    }

    // Determine scan region
    const regionEnd =
      sig.type === 'bootblock'
        ? Math.min(data.length, 1024)
        : data.length;

    // Pre-compile patterns for this signature
    const compiled = compilePatterns(sig.patterns);

    // Try each pattern -- first match wins for this signature
    let matched = false;
    for (const cp of compiled) {
      if (matched) break;

      if (cp.offset === 'any') {
        // Sliding window scan
        const limit = regionEnd - cp.bytes.length;
        for (let pos = 0; pos <= limit; pos++) {
          if (matchesAt(data, pos, cp.bytes, cp.mask)) {
            matches.push({
              signatureName: sig.name,
              signatureType: sig.type,
              severity: sig.severity,
              matchOffset: pos,
              patternIndex: cp.index,
            });
            matched = true;
            break;
          }
        }
      } else {
        // Fixed offset scan
        const fixedOffset = cp.offset;
        if (fixedOffset + cp.bytes.length <= regionEnd) {
          if (matchesAt(data, fixedOffset, cp.bytes, cp.mask)) {
            matches.push({
              signatureName: sig.name,
              signatureType: sig.type,
              severity: sig.severity,
              matchOffset: fixedOffset,
              patternIndex: cp.index,
            });
            matched = true;
          }
        }
      }
    }
  }

  return matches;
}
