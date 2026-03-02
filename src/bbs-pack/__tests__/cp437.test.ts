/**
 * CP437 decode correctness tests.
 *
 * Validates the 256-entry CP437-to-Unicode lookup table and
 * decodeCp437 function against the Unicode.org official mapping.
 * Tests include the real binary .ans fixture.
 *
 * Covers requirement: BBS-02 (shared CP437 parsing utility).
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { decodeCp437, CP437_TO_UNICODE } from '../shared/cp437.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixtureDir = join(__dirname, '../../../data/bbs/fixtures');

// ============================================================================
// CP437 Lookup Table
// ============================================================================

describe('CP437 Lookup Table', () => {
  it('has exactly 256 entries', () => {
    expect(CP437_TO_UNICODE).toHaveLength(256);
  });

  it('maps 0x01 to U+263A (smiley face)', () => {
    expect(CP437_TO_UNICODE[0x01]).toBe(0x263A);
  });

  it('maps 0x03 to U+2665 (heart)', () => {
    expect(CP437_TO_UNICODE[0x03]).toBe(0x2665);
  });

  it('maps 0x41 to 0x41 (ASCII "A" identity)', () => {
    expect(CP437_TO_UNICODE[0x41]).toBe(0x41);
  });

  it('maps 0xB0 to U+2591 (light shade)', () => {
    expect(CP437_TO_UNICODE[0xB0]).toBe(0x2591);
  });

  it('maps 0xDB to U+2588 (full block)', () => {
    expect(CP437_TO_UNICODE[0xDB]).toBe(0x2588);
  });

  it('maps 0xE3 to U+03C0 (pi)', () => {
    expect(CP437_TO_UNICODE[0xE3]).toBe(0x03C0);
  });

  it('maps 0x20-0x7E to ASCII identity', () => {
    for (let i = 0x20; i <= 0x7E; i++) {
      expect(CP437_TO_UNICODE[i], `0x${i.toString(16)} should be ASCII identity`).toBe(i);
    }
  });

  it('maps 0x00-0x1F to graphical Unicode (not control chars)', () => {
    // All entries in 0x01-0x1F should be non-ASCII graphical characters
    for (let i = 1; i <= 0x1F; i++) {
      expect(
        CP437_TO_UNICODE[i],
        `0x${i.toString(16).padStart(2, '0')} should map to graphical Unicode`,
      ).toBeGreaterThan(0x7F);
    }
  });
});

// ============================================================================
// decodeCp437 function
// ============================================================================

describe('decodeCp437 function', () => {
  it('decodes single byte 0x01 to smiley face', () => {
    const result = decodeCp437(Buffer.from([0x01]));
    expect(result).toBe('\u263A');
  });

  it('decodes single byte 0x03 to heart', () => {
    const result = decodeCp437(Buffer.from([0x03]));
    expect(result).toBe('\u2665');
  });

  it('decodes single byte 0xB0 to light shade', () => {
    const result = decodeCp437(Buffer.from([0xB0]));
    expect(result).toBe('\u2591');
  });

  it('decodes single byte 0xDB to full block', () => {
    const result = decodeCp437(Buffer.from([0xDB]));
    expect(result).toBe('\u2588');
  });

  it('returns empty string for empty buffer', () => {
    const result = decodeCp437(Buffer.alloc(0));
    expect(result).toBe('');
  });

  it('decodes real .ans fixture with light shade and full block', () => {
    const raw = readFileSync(join(fixtureDir, 'test-artwork.ans'));
    const decoded = decodeCp437(raw);
    expect(decoded).toContain('\u2591'); // light shade (0xB0)
    expect(decoded).toContain('\u2588'); // full block (0xDB)
  });

  it('decoded .ans fixture contains no U+FFFD replacement characters', () => {
    const raw = readFileSync(join(fixtureDir, 'test-artwork.ans'));
    const decoded = decodeCp437(raw);
    expect(decoded).not.toContain('\uFFFD');
  });
});
