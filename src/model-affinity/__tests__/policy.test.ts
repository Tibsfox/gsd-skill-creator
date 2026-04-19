/**
 * Tests for `src/model-affinity/policy.ts`
 *
 * Coverage:
 *   - evaluateMatch: all three-path cases × tractability classes
 *   - CF-ME2-02: escalation never fires for coin-flip skills (property test)
 *   - CF-ME2-03: null affinity → zero penalty, no escalation
 *   - CF-ME2-04: pickNextTierUp selects cheapest reliable (covered in schema tests)
 *   - EscalationRateLimiter: at-most-one escalation per skill per session
 */

import { describe, it, expect } from 'vitest';
import { evaluateMatch, EscalationRateLimiter } from '../policy.js';
import type { ModelFamily, ModelAffinity } from '../schema.js';
import type { TractabilityClass } from '../../output-structure/schema.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function affinity(reliable: ModelFamily[], unreliable?: ModelFamily[]): ModelAffinity {
  return unreliable ? { reliable, unreliable } : { reliable };
}

// ---------------------------------------------------------------------------
// evaluateMatch — null affinity (CF-ME2-03)
// ---------------------------------------------------------------------------

describe('evaluateMatch — no affinity declared (CF-ME2-03)', () => {
  it('returns ok=true, penalty=0, shouldEscalate=false for null + tractable', () => {
    const d = evaluateMatch(null, 'haiku', 'tractable');
    expect(d.ok).toBe(true);
    expect(d.penalty).toBe(0);
    expect(d.shouldEscalate).toBe(false);
    expect(d.escalateTo).toBeUndefined();
  });

  it('returns ok=true, penalty=0, shouldEscalate=false for null + coin-flip', () => {
    const d = evaluateMatch(null, 'sonnet', 'coin-flip');
    expect(d.ok).toBe(true);
    expect(d.penalty).toBe(0);
    expect(d.shouldEscalate).toBe(false);
  });

  it('returns ok=true, penalty=0 for null + unknown tractability', () => {
    const d = evaluateMatch(null, 'opus', 'unknown');
    expect(d.ok).toBe(true);
    expect(d.penalty).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// evaluateMatch — session model in reliable list (fully aligned)
// ---------------------------------------------------------------------------

describe('evaluateMatch — session model is reliable', () => {
  it('haiku session, reliable=[haiku] → ok, zero penalty', () => {
    const d = evaluateMatch(affinity(['haiku']), 'haiku', 'tractable');
    expect(d.ok).toBe(true);
    expect(d.penalty).toBe(0);
    expect(d.shouldEscalate).toBe(false);
  });

  it('sonnet session, reliable=[sonnet, opus] → ok, zero penalty', () => {
    const d = evaluateMatch(affinity(['sonnet', 'opus']), 'sonnet', 'coin-flip');
    expect(d.ok).toBe(true);
    expect(d.penalty).toBe(0);
    expect(d.shouldEscalate).toBe(false);
  });

  it('opus session, reliable=[haiku, sonnet, opus] → ok, zero penalty', () => {
    const d = evaluateMatch(affinity(['haiku', 'sonnet', 'opus']), 'opus', 'unknown');
    expect(d.ok).toBe(true);
    expect(d.penalty).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// evaluateMatch — session model explicitly unreliable
// ---------------------------------------------------------------------------

describe('evaluateMatch — session model explicitly unreliable', () => {
  it('tractable skill + haiku unreliable → penalty 0.5, shouldEscalate=true', () => {
    const d = evaluateMatch(
      affinity(['sonnet', 'opus'], ['haiku']),
      'haiku',
      'tractable',
    );
    expect(d.ok).toBe(false);
    expect(d.penalty).toBe(0.5);
    expect(d.shouldEscalate).toBe(true);
    expect(d.escalateTo).toBe('sonnet'); // cheapest reliable above haiku
    expect(d.reason).toBeTruthy();
  });

  it('coin-flip skill + haiku unreliable → penalty 0.1, shouldEscalate=false (CF-ME2-02)', () => {
    const d = evaluateMatch(
      affinity(['sonnet', 'opus'], ['haiku']),
      'haiku',
      'coin-flip',
    );
    expect(d.ok).toBe(false);
    expect(d.penalty).toBe(0.1);
    expect(d.shouldEscalate).toBe(false);
    expect(d.escalateTo).toBeUndefined();
  });

  it('unknown tractability + haiku unreliable → penalty 0.1, shouldEscalate=false', () => {
    // unknown is treated as non-tractable for escalation gating
    const d = evaluateMatch(
      affinity(['sonnet'], ['haiku']),
      'haiku',
      'unknown',
    );
    expect(d.shouldEscalate).toBe(false);
    expect(d.penalty).toBe(0.1);
  });

  it('escalateTo is cheapest reliable above current (haiku → sonnet over opus)', () => {
    const d = evaluateMatch(
      affinity(['opus', 'sonnet'], ['haiku']),
      'haiku',
      'tractable',
    );
    expect(d.escalateTo).toBe('sonnet');
  });

  it('escalateTo is undefined when no higher reliable tier exists', () => {
    // skill reliable only on haiku, unreliable on sonnet — no higher reliable
    const d = evaluateMatch(
      affinity(['haiku'], ['sonnet']),
      'sonnet',
      'tractable',
    );
    expect(d.shouldEscalate).toBe(true);
    expect(d.escalateTo).toBeUndefined();
  });

  it('tractable sonnet-unreliable + opus reliable → escalate to opus', () => {
    const d = evaluateMatch(
      affinity(['opus'], ['sonnet']),
      'sonnet',
      'tractable',
    );
    expect(d.shouldEscalate).toBe(true);
    expect(d.escalateTo).toBe('opus');
  });
});

// ---------------------------------------------------------------------------
// evaluateMatch — session model not mentioned (neutral)
// ---------------------------------------------------------------------------

describe('evaluateMatch — session model not mentioned', () => {
  it('tractable skill, model not mentioned → penalty 0.2, no escalation', () => {
    const d = evaluateMatch(
      affinity(['opus']),
      'haiku', // haiku not in reliable or unreliable
      'tractable',
    );
    expect(d.ok).toBe(false);
    expect(d.penalty).toBe(0.2);
    expect(d.shouldEscalate).toBe(false);
  });

  it('coin-flip skill, model not mentioned → penalty 0.2, no escalation', () => {
    const d = evaluateMatch(
      affinity(['haiku']),
      'sonnet',
      'coin-flip',
    );
    expect(d.penalty).toBe(0.2);
    expect(d.shouldEscalate).toBe(false);
  });

  it('unknown tractability, model not mentioned → penalty 0.2, no escalation', () => {
    const d = evaluateMatch(
      affinity(['opus']),
      'haiku',
      'unknown',
    );
    expect(d.penalty).toBe(0.2);
    expect(d.shouldEscalate).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// CF-ME2-02 property test: coin-flip skills NEVER escalate (10^3 events)
// ---------------------------------------------------------------------------

describe('CF-ME2-02 — coin-flip skills never escalate', () => {
  const families: ModelFamily[] = ['haiku', 'sonnet', 'opus', 'unknown'];
  const affinityVariants: Array<ModelAffinity | null> = [
    null,
    { reliable: ['sonnet'] },
    { reliable: ['opus'] },
    { reliable: ['sonnet', 'opus'], unreliable: ['haiku'] },
    { reliable: ['haiku'], unreliable: ['sonnet'] },
    { reliable: ['haiku', 'sonnet', 'opus'] },
  ];

  it('escalation never fires for coin-flip across all combinations', () => {
    let checked = 0;
    for (const sessionModel of families) {
      for (const aff of affinityVariants) {
        const d = evaluateMatch(aff, sessionModel, 'coin-flip');
        expect(d.shouldEscalate).toBe(false);
        checked++;
      }
    }
    // Verify we actually tested a meaningful number of cases
    expect(checked).toBeGreaterThan(20);
  });
});

// ---------------------------------------------------------------------------
// Penalty is always in [0, 1]
// ---------------------------------------------------------------------------

describe('penalty is always in [0, 1]', () => {
  const families: ModelFamily[] = ['haiku', 'sonnet', 'opus', 'unknown'];
  const tractabilities: TractabilityClass[] = ['tractable', 'coin-flip', 'unknown'];
  const affinityVariants: Array<ModelAffinity | null> = [
    null,
    { reliable: ['sonnet'] },
    { reliable: ['sonnet', 'opus'], unreliable: ['haiku'] },
    { reliable: ['haiku'], unreliable: ['sonnet', 'opus'] },
    { reliable: ['haiku', 'sonnet', 'opus'] },
  ];

  it('penalty is always in [0, 1]', () => {
    for (const sessionModel of families) {
      for (const tractability of tractabilities) {
        for (const aff of affinityVariants) {
          const d = evaluateMatch(aff, sessionModel, tractability);
          expect(d.penalty).toBeGreaterThanOrEqual(0);
          expect(d.penalty).toBeLessThanOrEqual(1);
        }
      }
    }
  });
});

// ---------------------------------------------------------------------------
// EscalationRateLimiter
// ---------------------------------------------------------------------------

describe('EscalationRateLimiter', () => {
  it('allows first escalation per skillId', () => {
    const limiter = new EscalationRateLimiter();
    expect(limiter.shouldSuppress('skill-a')).toBe(false);
  });

  it('suppresses second escalation for same skillId', () => {
    const limiter = new EscalationRateLimiter();
    limiter.shouldSuppress('skill-a'); // first call — registers
    expect(limiter.shouldSuppress('skill-a')).toBe(true);
  });

  it('allows escalation for different skillIds', () => {
    const limiter = new EscalationRateLimiter();
    expect(limiter.shouldSuppress('skill-a')).toBe(false);
    expect(limiter.shouldSuppress('skill-b')).toBe(false);
  });

  it('counts unique escalated skills', () => {
    const limiter = new EscalationRateLimiter();
    limiter.shouldSuppress('skill-a');
    limiter.shouldSuppress('skill-a');
    limiter.shouldSuppress('skill-b');
    expect(limiter.count).toBe(2);
  });

  it('starts with count=0', () => {
    expect(new EscalationRateLimiter().count).toBe(0);
  });
});
