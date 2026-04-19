/**
 * MD-3 — Scale resolver tests (gain table per tractability + LS-35 gating).
 */

import { describe, it, expect } from 'vitest';
import {
  resolveNoiseScale,
  TRACTABILITY_NOISE_GAIN,
} from '../scale-resolver.js';

describe('TRACTABILITY_NOISE_GAIN — table', () => {
  it('tractable = 1.0', () => {
    expect(TRACTABILITY_NOISE_GAIN.tractable).toBe(1.0);
  });
  it('unknown = 0.5', () => {
    expect(TRACTABILITY_NOISE_GAIN.unknown).toBe(0.5);
  });
  it('coin-flip = 0.2', () => {
    expect(TRACTABILITY_NOISE_GAIN['coin-flip']).toBe(0.2);
  });

  it('table is frozen (no accidental mutation)', () => {
    expect(Object.isFrozen(TRACTABILITY_NOISE_GAIN)).toBe(true);
  });
});

describe('resolveNoiseScale — gain by tractability', () => {
  it('tractable: full gain', () => {
    expect(resolveNoiseScale(0.1, 'tractable')).toBeCloseTo(0.1, 12);
  });

  it('unknown: 0.5 gain', () => {
    expect(resolveNoiseScale(0.1, 'unknown')).toBeCloseTo(0.05, 12);
  });

  it('coin-flip: 0.2 gain', () => {
    expect(resolveNoiseScale(0.1, 'coin-flip')).toBeCloseTo(0.02, 12);
  });
});

describe('resolveNoiseScale — confidence attenuation', () => {
  it('confidence = 1 → no attenuation', () => {
    expect(resolveNoiseScale(0.4, 'tractable', 1)).toBeCloseTo(0.4, 12);
  });

  it('confidence = 0 → zero scale', () => {
    expect(resolveNoiseScale(0.4, 'tractable', 0)).toBe(0);
  });

  it('confidence = 0.5 halves the scale', () => {
    expect(resolveNoiseScale(0.4, 'tractable', 0.5)).toBeCloseTo(0.2, 12);
  });

  it('confidence default (omitted) = 1', () => {
    expect(resolveNoiseScale(0.4, 'tractable')).toBeCloseTo(0.4, 12);
  });

  it('confidence > 1 clamps to 1', () => {
    expect(resolveNoiseScale(0.4, 'tractable', 2)).toBeCloseTo(0.4, 12);
  });

  it('confidence < 0 clamps to 0', () => {
    expect(resolveNoiseScale(0.4, 'tractable', -1)).toBe(0);
  });

  it('NaN confidence treated as 0', () => {
    expect(resolveNoiseScale(0.4, 'tractable', Number.NaN)).toBe(0);
  });
});

describe('resolveNoiseScale — safety valve', () => {
  it('baseScale = 0 → 0', () => {
    expect(resolveNoiseScale(0, 'tractable')).toBe(0);
  });

  it('baseScale < 0 → 0', () => {
    expect(resolveNoiseScale(-1, 'tractable')).toBe(0);
  });

  it('baseScale = NaN → 0', () => {
    expect(resolveNoiseScale(Number.NaN, 'tractable')).toBe(0);
  });

  it('baseScale = Infinity → 0', () => {
    expect(resolveNoiseScale(Number.POSITIVE_INFINITY, 'tractable')).toBe(0);
  });
});

describe('resolveNoiseScale — combined gating', () => {
  it('coin-flip + low confidence collapses noise heavily', () => {
    // base 1.0 → 0.2 (coin-flip) → 0.05 (confidence 0.25) = 0.05
    expect(resolveNoiseScale(1.0, 'coin-flip', 0.25)).toBeCloseTo(0.05, 12);
  });

  it('tractable full confidence preserves base scale', () => {
    expect(resolveNoiseScale(0.7, 'tractable', 1.0)).toBeCloseTo(0.7, 12);
  });
});
