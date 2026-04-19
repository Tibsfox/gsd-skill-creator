/**
 * Tests for `src/model-affinity/api.ts`
 *
 * Coverage:
 *   - getAffinityDecision: flag-off returns null (CF-ME2-01 / SC-ME2-01)
 *   - getAffinityDecision: flag-on delegates correctly to evaluateMatch
 *   - batchAffinityDecisions: flag-off → all null; flag-on → correct decisions
 *   - summariseEscalations: correct grouping of escalation vs penalised
 */

import { describe, it, expect } from 'vitest';
import {
  getAffinityDecision,
  batchAffinityDecisions,
  summariseEscalations,
  type CandidateAffinityInput,
} from '../api.js';

// ---------------------------------------------------------------------------
// getAffinityDecision — flag-off (CF-ME2-01 / SC-ME2-01)
// ---------------------------------------------------------------------------

describe('getAffinityDecision — flag-off', () => {
  it('returns null when featureEnabled=false (CF-ME2-01)', () => {
    const raw = { reliable: ['sonnet'], unreliable: ['haiku'] };
    const result = getAffinityDecision(raw, 'haiku', 'tractable', false);
    expect(result).toBeNull();
  });

  it('returns null for null affinity when flag off', () => {
    expect(getAffinityDecision(null, 'sonnet', 'tractable', false)).toBeNull();
  });

  it('returns null regardless of model family when flag off (SC-ME2-01 property)', () => {
    const families = ['haiku', 'sonnet', 'opus', 'unknown'] as const;
    for (const model of families) {
      const result = getAffinityDecision({ reliable: ['opus'] }, model, 'tractable', false);
      expect(result).toBeNull();
    }
  });
});

// ---------------------------------------------------------------------------
// getAffinityDecision — flag-on
// ---------------------------------------------------------------------------

describe('getAffinityDecision — flag-on', () => {
  it('returns non-null when featureEnabled=true and affinity declared', () => {
    const raw = { reliable: ['sonnet', 'opus'], unreliable: ['haiku'] };
    const result = getAffinityDecision(raw, 'haiku', 'tractable', true);
    expect(result).not.toBeNull();
    expect(result!.shouldEscalate).toBe(true);
    expect(result!.escalateTo).toBe('sonnet');
  });

  it('returns decision with penalty=0 for aligned model', () => {
    const raw = { reliable: ['sonnet'] };
    const result = getAffinityDecision(raw, 'sonnet', 'tractable', true);
    expect(result).not.toBeNull();
    expect(result!.ok).toBe(true);
    expect(result!.penalty).toBe(0);
    expect(result!.shouldEscalate).toBe(false);
  });

  it('returns decision with penalty=0 for null affinity (CF-ME2-03)', () => {
    const result = getAffinityDecision(null, 'haiku', 'tractable', true);
    expect(result).not.toBeNull();
    expect(result!.penalty).toBe(0);
    expect(result!.shouldEscalate).toBe(false);
  });

  it('coin-flip skill — no escalation even when unreliable (CF-ME2-02)', () => {
    const raw = { reliable: ['opus'], unreliable: ['haiku'] };
    const result = getAffinityDecision(raw, 'haiku', 'coin-flip', true);
    expect(result!.shouldEscalate).toBe(false);
    expect(result!.penalty).toBe(0.1);
  });

  it('handles invalid raw affinity gracefully (falls back to null affinity)', () => {
    const result = getAffinityDecision({ reliable: [] }, 'sonnet', 'tractable', true);
    expect(result).not.toBeNull();
    expect(result!.penalty).toBe(0); // null affinity → zero penalty
  });
});

// ---------------------------------------------------------------------------
// batchAffinityDecisions
// ---------------------------------------------------------------------------

describe('batchAffinityDecisions', () => {
  const candidates: CandidateAffinityInput[] = [
    {
      id: 'skill-a',
      rawModelAffinity: { reliable: ['sonnet', 'opus'], unreliable: ['haiku'] },
      tractabilityClass: 'tractable',
    },
    {
      id: 'skill-b',
      rawModelAffinity: { reliable: ['haiku', 'sonnet', 'opus'] },
      tractabilityClass: 'coin-flip',
    },
    {
      id: 'skill-c',
      rawModelAffinity: null,
      tractabilityClass: 'unknown',
    },
  ];

  it('flag-off: all decisions are null (CF-ME2-01 byte-identical)', () => {
    const results = batchAffinityDecisions(candidates, 'haiku', false);
    expect(results.size).toBe(3);
    for (const [, v] of results) {
      expect(v).toBeNull();
    }
  });

  it('flag-on: returns correct map keyed by id', () => {
    const results = batchAffinityDecisions(candidates, 'haiku', true);
    expect(results.size).toBe(3);
    expect(results.has('skill-a')).toBe(true);
    expect(results.has('skill-b')).toBe(true);
    expect(results.has('skill-c')).toBe(true);
  });

  it('flag-on, haiku session: skill-a should escalate', () => {
    const results = batchAffinityDecisions(candidates, 'haiku', true);
    const a = results.get('skill-a');
    expect(a).not.toBeNull();
    expect(a!.shouldEscalate).toBe(true);
  });

  it('flag-on, haiku session: skill-b (coin-flip) should NOT escalate', () => {
    const results = batchAffinityDecisions(candidates, 'haiku', true);
    const b = results.get('skill-b');
    expect(b!.shouldEscalate).toBe(false);
  });

  it('flag-on, haiku session: skill-c (no affinity) zero penalty', () => {
    const results = batchAffinityDecisions(candidates, 'haiku', true);
    const c = results.get('skill-c');
    expect(c!.penalty).toBe(0);
  });

  it('handles empty candidate list', () => {
    const results = batchAffinityDecisions([], 'sonnet', true);
    expect(results.size).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// summariseEscalations
// ---------------------------------------------------------------------------

describe('summariseEscalations', () => {
  it('correctly separates escalations from penalised', () => {
    const decisions = new Map([
      ['skill-a', { ok: false, penalty: 0.5, shouldEscalate: true, escalateTo: 'sonnet' as const, reason: 'test reason' }],
      ['skill-b', { ok: false, penalty: 0.2, shouldEscalate: false, reason: 'neutral' }],
      ['skill-c', { ok: true, penalty: 0, shouldEscalate: false }],
    ]);

    const summary = summariseEscalations(decisions);
    expect(summary.escalations).toHaveLength(1);
    expect(summary.escalations[0]!.id).toBe('skill-a');
    expect(summary.escalations[0]!.escalateTo).toBe('sonnet');
    expect(summary.penalised).toHaveLength(1);
    expect(summary.penalised[0]!.id).toBe('skill-b');
  });

  it('does not include zero-penalty ok decisions in penalised', () => {
    const decisions = new Map([
      ['skill-a', { ok: true, penalty: 0, shouldEscalate: false }],
    ]);
    const summary = summariseEscalations(decisions);
    expect(summary.escalations).toHaveLength(0);
    expect(summary.penalised).toHaveLength(0);
  });

  it('skips null decisions (flag-off)', () => {
    const decisions = new Map([
      ['skill-a', null],
      ['skill-b', null],
    ]);
    const summary = summariseEscalations(decisions);
    expect(summary.escalations).toHaveLength(0);
    expect(summary.penalised).toHaveLength(0);
  });

  it('handles empty map', () => {
    const summary = summariseEscalations(new Map());
    expect(summary.escalations).toHaveLength(0);
    expect(summary.penalised).toHaveLength(0);
  });

  it('escalation without escalateTo not included in escalations array', () => {
    // shouldEscalate=true but escalateTo undefined (no higher tier)
    const decisions = new Map([
      ['skill-a', { ok: false, penalty: 0.5, shouldEscalate: true, escalateTo: undefined, reason: 'no higher tier' }],
    ]);
    const summary = summariseEscalations(decisions);
    // escalateTo is undefined — not included in escalations (need escalateTo to surface)
    expect(summary.escalations).toHaveLength(0);
    // It has penalty > 0, so it ends up in penalised
    expect(summary.penalised).toHaveLength(1);
  });
});
