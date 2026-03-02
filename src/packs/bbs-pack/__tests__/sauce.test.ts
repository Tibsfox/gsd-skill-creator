/**
 * SAUCE binary parsing tests.
 *
 * Validates extractSauce against edge cases and a real binary .ans fixture.
 *
 * Covers requirement: BBS-02 (shared SAUCE extraction utility).
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractSauce } from '../shared/sauce.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixtureDir = join(__dirname, '../../../data/bbs/fixtures');

// ============================================================================
// Edge Cases
// ============================================================================

describe('SAUCE edge cases', () => {
  it('returns null for empty buffer', () => {
    expect(extractSauce(Buffer.alloc(0))).toBeNull();
  });

  it('returns null for 127-byte buffer (too short)', () => {
    expect(extractSauce(Buffer.alloc(127))).toBeNull();
  });

  it('returns null for 128-byte buffer without SAUCE ID', () => {
    const buf = Buffer.alloc(128);
    buf.write('NOTSA', 0, 5, 'ascii');
    expect(extractSauce(buf)).toBeNull();
  });

  it('returns null for buffer with random data at SAUCE position', () => {
    const buf = Buffer.alloc(256);
    for (let i = 0; i < 256; i++) buf[i] = Math.floor(Math.random() * 256);
    // Overwrite SAUCE ID position with non-SAUCE data
    buf.write('XXXXX', 256 - 128, 5, 'ascii');
    expect(extractSauce(buf)).toBeNull();
  });
});

// ============================================================================
// Real Fixture
// ============================================================================

describe('SAUCE real fixture', () => {
  it('extracts SAUCE record from .ans fixture', () => {
    const raw = readFileSync(join(fixtureDir, 'test-artwork.ans'));
    const sauce = extractSauce(raw);
    expect(sauce).not.toBeNull();
  });

  it('extracted record has id "SAUCE"', () => {
    const raw = readFileSync(join(fixtureDir, 'test-artwork.ans'));
    const sauce = extractSauce(raw)!;
    expect(sauce.id).toBe('SAUCE');
  });

  it('extracted record has version "00"', () => {
    const raw = readFileSync(join(fixtureDir, 'test-artwork.ans'));
    const sauce = extractSauce(raw)!;
    expect(sauce.version).toBe('00');
  });

  it('extracted title contains "Test Artwork"', () => {
    const raw = readFileSync(join(fixtureDir, 'test-artwork.ans'));
    const sauce = extractSauce(raw)!;
    expect(sauce.title).toContain('Test Artwork');
  });

  it('extracted author contains "GSD Pack"', () => {
    const raw = readFileSync(join(fixtureDir, 'test-artwork.ans'));
    const sauce = extractSauce(raw)!;
    expect(sauce.author).toContain('GSD Pack');
  });

  it('extracted group contains "skill-creator"', () => {
    const raw = readFileSync(join(fixtureDir, 'test-artwork.ans'));
    const sauce = extractSauce(raw)!;
    expect(sauce.group).toContain('skill-creator');
  });

  it('tInfo1 (columns) is 80', () => {
    const raw = readFileSync(join(fixtureDir, 'test-artwork.ans'));
    const sauce = extractSauce(raw)!;
    expect(sauce.tInfo1).toBe(80);
  });

  it('tInfo2 (rows) is 25', () => {
    const raw = readFileSync(join(fixtureDir, 'test-artwork.ans'));
    const sauce = extractSauce(raw)!;
    expect(sauce.tInfo2).toBe(25);
  });

  it('dataType is 1 (Character)', () => {
    const raw = readFileSync(join(fixtureDir, 'test-artwork.ans'));
    const sauce = extractSauce(raw)!;
    expect(sauce.dataType).toBe(1);
  });

  it('date is "20260302"', () => {
    const raw = readFileSync(join(fixtureDir, 'test-artwork.ans'));
    const sauce = extractSauce(raw)!;
    expect(sauce.date).toBe('20260302');
  });
});
