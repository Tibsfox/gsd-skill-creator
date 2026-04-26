/**
 * JP-016 — Co-occurrence schema round-trip tests.
 *
 * Validates:
 *   - serializeMatrix → deserializeMatrix is a lossless round-trip
 *   - validateCoOccurrenceMatrix accepts valid input and rejects invalid input
 *   - Default windowMs is applied when omitted
 */

import { describe, it, expect } from 'vitest';
import {
  serializeMatrix,
  deserializeMatrix,
  validateCoOccurrenceMatrix,
  type CoOccurrenceMatrix,
} from '../co-occurrence-schema.js';

// ─── Fixtures ──────────────────────────────────────────────────────────────────

function makeMatrix(
  overrides: Partial<CoOccurrenceMatrix> = {},
): CoOccurrenceMatrix {
  return {
    generatedAt: 1_700_000_000_000,
    traceWindowStart: 1_699_990_000_000,
    traceWindowEnd: 1_700_000_000_000,
    pairs: [
      {
        event_a: { skillId: 'skill:planner', eventType: 'activation' },
        event_b: { skillId: 'skill:executor', eventType: 'activation' },
        probability: 0.82,
        temporalLagMs: 340,
        observationCount: 50,
        windowMs: 30_000,
      },
      {
        event_a: { skillId: 'skill:executor', eventType: 'outcome' },
        event_b: { skillId: 'skill:verifier', eventType: 'activation' },
        probability: 0.91,
        temporalLagMs: 120,
        observationCount: 48,
        windowMs: 30_000,
      },
    ],
    ...overrides,
  };
}

// ─── Round-trip ────────────────────────────────────────────────────────────────

describe('CoOccurrenceMatrix round-trip', () => {
  it('serialize → deserialize produces a deep-equal matrix', () => {
    const original = makeMatrix();
    const serialized = serializeMatrix(original);
    const restored = deserializeMatrix(serialized);
    expect(restored).toEqual(original);
  });

  it('round-trip preserves pair count', () => {
    const original = makeMatrix();
    const restored = deserializeMatrix(serializeMatrix(original));
    expect(restored.pairs).toHaveLength(original.pairs.length);
  });

  it('round-trip preserves probability values', () => {
    const original = makeMatrix();
    const restored = deserializeMatrix(serializeMatrix(original));
    for (let i = 0; i < original.pairs.length; i++) {
      expect(restored.pairs[i].probability).toBeCloseTo(
        original.pairs[i].probability,
        10,
      );
    }
  });
});

// ─── Validation ───────────────────────────────────────────────────────────────

describe('validateCoOccurrenceMatrix', () => {
  it('accepts a valid matrix', () => {
    const result = validateCoOccurrenceMatrix(makeMatrix());
    expect(result.ok).toBe(true);
  });

  it('rejects missing generatedAt', () => {
    const bad = makeMatrix() as Record<string, unknown>;
    delete bad.generatedAt;
    const result = validateCoOccurrenceMatrix(bad);
    expect(result.ok).toBe(false);
  });

  it('rejects probability > 1', () => {
    const bad = makeMatrix();
    bad.pairs[0].probability = 1.5;
    const result = validateCoOccurrenceMatrix(bad);
    expect(result.ok).toBe(false);
  });

  it('rejects negative probability', () => {
    const bad = makeMatrix();
    bad.pairs[0].probability = -0.1;
    const result = validateCoOccurrenceMatrix(bad);
    expect(result.ok).toBe(false);
  });
});

// ─── Default windowMs ─────────────────────────────────────────────────────────

describe('CoOccurrencePair default windowMs', () => {
  it('applies default windowMs of 30000 when omitted', () => {
    const raw = makeMatrix();
    // Remove windowMs to trigger the default
    const pairWithoutWindow = { ...raw.pairs[0] } as Record<string, unknown>;
    delete pairWithoutWindow['windowMs'];
    raw.pairs[0] = pairWithoutWindow as typeof raw.pairs[0];

    const result = validateCoOccurrenceMatrix(raw);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.matrix.pairs[0].windowMs).toBe(30_000);
    }
  });
});

// ─── Empty pairs list ─────────────────────────────────────────────────────────

describe('CoOccurrenceMatrix empty pairs', () => {
  it('accepts a matrix with zero pairs', () => {
    const empty = makeMatrix({ pairs: [] });
    const result = validateCoOccurrenceMatrix(empty);
    expect(result.ok).toBe(true);
  });
});
