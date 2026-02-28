/**
 * Tests for AGC rope image loader.
 *
 * Covers: rope image source catalog, URL generation, location lookup,
 * and structural validation of rope images.
 *
 * @module agc/pack/__tests__/rope-loader
 */

import { describe, it, expect } from 'vitest';
import {
  ROPE_SOURCES,
  getRopeUrl,
  locateRopeImage,
  validateRopeImage,
} from '../rope-loader.js';
import type { RopeImageSource } from '../rope-loader.js';

// ============================================================================
// Rope image source catalog
// ============================================================================

describe('ROPE_SOURCES', () => {
  it('is a readonly array of RopeImageSource objects', () => {
    expect(Array.isArray(ROPE_SOURCES)).toBe(true);
    expect(ROPE_SOURCES.length).toBeGreaterThanOrEqual(3);
  });

  it('each source has all required fields', () => {
    for (const source of ROPE_SOURCES) {
      expect(typeof source.id).toBe('string');
      expect(typeof source.name).toBe('string');
      expect(typeof source.description).toBe('string');
      expect(typeof source.url).toBe('string');
      expect(typeof source.program).toBe('string');
      expect(typeof source.mission).toBe('string');
      expect(typeof source.version).toBe('string');
      expect(typeof source.wordCount).toBe('number');
    }
  });

  it('contains Luminary 099 (Apollo 11 LM)', () => {
    const lm = ROPE_SOURCES.find((s) => s.id === 'luminary099');
    expect(lm).toBeDefined();
    expect(lm!.mission).toBe('Apollo 11');
    expect(lm!.program).toBe('Luminary');
  });

  it('contains Colossus 249 (Apollo 11 CM)', () => {
    const cm = ROPE_SOURCES.find((s) => s.id === 'colossus249');
    expect(cm).toBeDefined();
    expect(cm!.mission).toBe('Apollo 11');
    expect(cm!.program).toBe('Colossus');
  });

  it('contains Luminary 131 (Apollo 13 LM)', () => {
    const lm13 = ROPE_SOURCES.find((s) => s.id === 'luminary131');
    expect(lm13).toBeDefined();
    expect(lm13!.mission).toBe('Apollo 13');
    expect(lm13!.program).toBe('Luminary');
  });

  it('all URLs point to virtualagc.github.io', () => {
    for (const source of ROPE_SOURCES) {
      expect(source.url).toMatch(/^https:\/\/virtualagc\.github\.io\//);
    }
  });

  it('Luminary 099 has wordCount of 36864', () => {
    const lm = ROPE_SOURCES.find((s) => s.id === 'luminary099')!;
    expect(lm.wordCount).toBe(36864);
  });
});

// ============================================================================
// URL generation
// ============================================================================

describe('getRopeUrl', () => {
  it('returns the Luminary 099 URL for "luminary099"', () => {
    const url = getRopeUrl('luminary099');
    expect(url).toBeDefined();
    expect(typeof url).toBe('string');
    expect(url!).toMatch(/^https:\/\/virtualagc\.github\.io\//);
  });

  it('returns undefined for "nonexistent"', () => {
    expect(getRopeUrl('nonexistent')).toBeUndefined();
  });

  it('all URLs follow pattern https://virtualagc.github.io/...', () => {
    for (const source of ROPE_SOURCES) {
      const url = getRopeUrl(source.id);
      expect(url).toMatch(/^https:\/\/virtualagc\.github\.io\//);
    }
  });
});

// ============================================================================
// Location
// ============================================================================

describe('locateRopeImage', () => {
  it('returns { found: true, source } for known programs', () => {
    const result = locateRopeImage('luminary099');
    expect(result.found).toBe(true);
    if (result.found) {
      expect(result.source.id).toBe('luminary099');
    }
  });

  it('returns { found: false } for unknown programs', () => {
    const result = locateRopeImage('unknown');
    expect(result.found).toBe(false);
  });
});

// ============================================================================
// Validation (structural, not network)
// ============================================================================

describe('validateRopeImage', () => {
  it('returns { valid: true } for correct-length array of Word15 values', () => {
    const validWords = new Array(36864).fill(0);
    const result = validateRopeImage(validWords);
    expect(result).toEqual({ valid: true });
  });

  it('returns { valid: false, error: "Empty rope image" } for empty array', () => {
    const result = validateRopeImage([]);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error).toBe('Empty rope image');
    }
  });

  it('returns { valid: false } for wrong length', () => {
    const tooShort = new Array(100).fill(0);
    const result = validateRopeImage(tooShort);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(typeof result.error).toBe('string');
    }
  });

  it('all rope source URLs are strings starting with https://', () => {
    for (const source of ROPE_SOURCES) {
      expect(source.url.startsWith('https://')).toBe(true);
    }
  });
});
