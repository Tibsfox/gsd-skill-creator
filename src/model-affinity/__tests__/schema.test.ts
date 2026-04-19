/**
 * Tests for `src/model-affinity/schema.ts`
 *
 * Coverage:
 *   - MODEL_TIER ordering
 *   - isModelAffinity type guard: valid and invalid shapes
 *   - pickNextTierUp: exhaustive tier combinations (CF-ME2-04)
 */

import { describe, it, expect } from 'vitest';
import {
  MODEL_TIER,
  MODEL_FAMILIES_ORDERED,
  isModelAffinity,
  pickNextTierUp,
  type ModelFamily,
} from '../schema.js';

// ---------------------------------------------------------------------------
// MODEL_TIER ordering
// ---------------------------------------------------------------------------

describe('MODEL_TIER', () => {
  it('haiku < sonnet < opus by tier value', () => {
    expect(MODEL_TIER.haiku).toBeLessThan(MODEL_TIER.sonnet);
    expect(MODEL_TIER.sonnet).toBeLessThan(MODEL_TIER.opus);
  });

  it('unknown has tier -1', () => {
    expect(MODEL_TIER.unknown).toBe(-1);
  });

  it('all ordered families have non-negative tiers', () => {
    for (const f of MODEL_FAMILIES_ORDERED) {
      expect(MODEL_TIER[f]).toBeGreaterThanOrEqual(0);
    }
  });
});

// ---------------------------------------------------------------------------
// isModelAffinity
// ---------------------------------------------------------------------------

describe('isModelAffinity', () => {
  it('accepts minimal valid affinity (reliable only)', () => {
    expect(isModelAffinity({ reliable: ['sonnet'] })).toBe(true);
  });

  it('accepts affinity with reliable + unreliable', () => {
    expect(
      isModelAffinity({ reliable: ['sonnet', 'opus'], unreliable: ['haiku'] }),
    ).toBe(true);
  });

  it('accepts all three model families in reliable', () => {
    expect(isModelAffinity({ reliable: ['haiku', 'sonnet', 'opus'] })).toBe(true);
  });

  it('accepts unknown in reliable list', () => {
    expect(isModelAffinity({ reliable: ['unknown'] })).toBe(true);
  });

  it('rejects null', () => {
    expect(isModelAffinity(null)).toBe(false);
  });

  it('rejects undefined', () => {
    expect(isModelAffinity(undefined)).toBe(false);
  });

  it('rejects empty reliable list', () => {
    expect(isModelAffinity({ reliable: [] })).toBe(false);
  });

  it('rejects reliable with invalid family name', () => {
    expect(isModelAffinity({ reliable: ['gpt-4'] })).toBe(false);
  });

  it('rejects missing reliable key', () => {
    expect(isModelAffinity({ unreliable: ['haiku'] })).toBe(false);
  });

  it('rejects reliable as non-array', () => {
    expect(isModelAffinity({ reliable: 'sonnet' })).toBe(false);
  });

  it('rejects unreliable as non-array', () => {
    expect(isModelAffinity({ reliable: ['sonnet'], unreliable: 'haiku' })).toBe(false);
  });

  it('rejects unreliable with invalid family name', () => {
    expect(isModelAffinity({ reliable: ['sonnet'], unreliable: ['gpt-4'] })).toBe(false);
  });

  it('accepts empty unreliable list', () => {
    // Empty unreliable is allowed (no claims)
    expect(isModelAffinity({ reliable: ['sonnet'], unreliable: [] })).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// pickNextTierUp (CF-ME2-04)
// ---------------------------------------------------------------------------

describe('pickNextTierUp', () => {
  // Exhaustive combinations as required by CF-ME2-04

  it('haiku session, reliable=[sonnet] → sonnet', () => {
    expect(pickNextTierUp('haiku', ['sonnet'])).toBe('sonnet');
  });

  it('haiku session, reliable=[opus] → opus', () => {
    expect(pickNextTierUp('haiku', ['opus'])).toBe('opus');
  });

  it('haiku session, reliable=[sonnet, opus] → sonnet (cheapest)', () => {
    expect(pickNextTierUp('haiku', ['sonnet', 'opus'])).toBe('sonnet');
  });

  it('haiku session, reliable=[opus, sonnet] → sonnet (cheapest, order-independent)', () => {
    expect(pickNextTierUp('haiku', ['opus', 'sonnet'])).toBe('sonnet');
  });

  it('sonnet session, reliable=[opus] → opus', () => {
    expect(pickNextTierUp('sonnet', ['opus'])).toBe('opus');
  });

  it('sonnet session, reliable=[haiku] → undefined (haiku is lower tier)', () => {
    expect(pickNextTierUp('sonnet', ['haiku'])).toBeUndefined();
  });

  it('sonnet session, reliable=[haiku, opus] → opus (only higher tier)', () => {
    expect(pickNextTierUp('sonnet', ['haiku', 'opus'])).toBe('opus');
  });

  it('opus session, reliable=[sonnet, haiku] → undefined (no higher tier)', () => {
    expect(pickNextTierUp('opus', ['sonnet', 'haiku'])).toBeUndefined();
  });

  it('opus session, reliable=[opus] → undefined (same tier not returned)', () => {
    expect(pickNextTierUp('opus', ['opus'])).toBeUndefined();
  });

  it('unknown session, reliable=[haiku] → haiku (any known is higher than unknown)', () => {
    expect(pickNextTierUp('unknown', ['haiku'])).toBe('haiku');
  });

  it('unknown session, reliable=[haiku, sonnet, opus] → haiku (cheapest)', () => {
    expect(pickNextTierUp('unknown', ['haiku', 'sonnet', 'opus'])).toBe('haiku');
  });

  it('filters out unknown from reliable before picking', () => {
    // unknown should not be returned as escalation target
    expect(pickNextTierUp('haiku', ['unknown', 'sonnet'])).toBe('sonnet');
  });

  it('reliable contains only unknown → undefined', () => {
    expect(pickNextTierUp('haiku', ['unknown'])).toBeUndefined();
  });

  it('empty reliable list → undefined', () => {
    expect(pickNextTierUp('haiku', [])).toBeUndefined();
  });

  it('haiku session, reliable=[haiku] → undefined (same tier)', () => {
    expect(pickNextTierUp('haiku', ['haiku'])).toBeUndefined();
  });

  // Property test: result is always the cheapest available option above current
  it('result tier is always strictly greater than current tier', () => {
    const families: ModelFamily[] = ['haiku', 'sonnet', 'opus', 'unknown'];
    for (const current of families) {
      for (const reliable of [
        ['haiku'], ['sonnet'], ['opus'], ['haiku', 'sonnet'], ['sonnet', 'opus'],
        ['haiku', 'sonnet', 'opus'], ['haiku', 'opus'],
      ] as ModelFamily[][]) {
        const result = pickNextTierUp(current, reliable);
        if (result !== undefined) {
          expect(MODEL_TIER[result]).toBeGreaterThan(MODEL_TIER[current]);
        }
      }
    }
  });
});
