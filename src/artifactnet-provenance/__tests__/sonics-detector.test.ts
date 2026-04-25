/**
 * sonics-detector test suite.
 *
 * Verifies that the SONICS-style 3-way classifier covers all four lanes:
 * `real`, `synthetic`, `partial`, and `unknown` (empty signature).
 */

import { describe, expect, it } from 'vitest';

import { classifySignature } from '../sonics-detector.js';
import type { ResidualSignature } from '../types.js';

const REAL_LIKE: ResidualSignature = {
  entropy: 0.85,
  burstiness: 0.8,
  spectralFlatness: 0.75,
  repetition: 0.05,
  kind: 'text',
};

const SYNTHETIC_LIKE: ResidualSignature = {
  entropy: 0.55,
  burstiness: 0.05,
  spectralFlatness: 0.05,
  repetition: 0.7,
  kind: 'text',
};

const PARTIAL_LIKE: ResidualSignature = {
  entropy: 0.55,
  burstiness: 0.4,
  spectralFlatness: 0.5,
  repetition: 0.25,
  kind: 'text',
};

const EMPTY: ResidualSignature = {
  entropy: 0,
  burstiness: 0,
  spectralFlatness: 0,
  repetition: 0,
  kind: 'text',
};

describe('classifySignature', () => {
  it('flags a real-leaning signature as real', () => {
    const out = classifySignature(REAL_LIKE);
    expect(out.verdict).toBe('real');
    expect(out.confidence).toBeGreaterThan(0);
  });

  it('flags a synthetic-leaning signature as synthetic', () => {
    const out = classifySignature(SYNTHETIC_LIKE);
    expect(out.verdict).toBe('synthetic');
  });

  it('flags a midpoint signature as partial', () => {
    const out = classifySignature(PARTIAL_LIKE);
    expect(out.verdict).toBe('partial');
  });

  it('returns unknown on an identically-zero signature', () => {
    const out = classifySignature(EMPTY);
    expect(out.verdict).toBe('unknown');
    expect(out.confidence).toBe(0);
  });

  it('produces scores that sum to ~1', () => {
    const out = classifySignature(REAL_LIKE);
    const sum = out.scores.real + out.scores.partial + out.scores.synthetic;
    expect(sum).toBeCloseTo(1, 6);
  });

  it('confidence is in [0, 1]', () => {
    for (const sig of [REAL_LIKE, SYNTHETIC_LIKE, PARTIAL_LIKE]) {
      const out = classifySignature(sig);
      expect(out.confidence).toBeGreaterThanOrEqual(0);
      expect(out.confidence).toBeLessThanOrEqual(1);
    }
  });

  it('inverts spectralFlatness on audio inputs', () => {
    const peakyAudio: ResidualSignature = {
      entropy: 0.7,
      burstiness: 0.7,
      // For audio we treat this as Wiener-entropy: 0.05 = peaky = "real".
      spectralFlatness: 0.05,
      repetition: 0.05,
      kind: 'audio',
    };
    const flatAudio: ResidualSignature = {
      entropy: 0.55,
      burstiness: 0.05,
      // High Wiener-entropy = flat = "synthetic".
      spectralFlatness: 0.95,
      repetition: 0.7,
      kind: 'audio',
    };
    expect(classifySignature(peakyAudio).verdict).toBe('real');
    expect(classifySignature(flatAudio).verdict).toBe('synthetic');
  });
});
