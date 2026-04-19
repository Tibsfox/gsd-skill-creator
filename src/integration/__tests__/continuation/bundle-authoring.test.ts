/**
 * Continuation Wave — Bundle 6 (Authoring) integration tests.
 *
 * Covers the wiring between ME-2 (per-skill model affinity) and ME-3 (skill
 * A/B harness).  Both components are author-facing quality gates: the first
 * surfaces model-skill pairing mismatches and the second validates the
 * skill-author's hypothesis about a proposed edit via a statistically
 * principled A/B comparison.
 *
 * Gates:
 *   IT-W5-ME2 — model-affinity escalation surfaces (correct escalateTo tier)
 *     AND the escalation is gated by tractability: coin-flip skills receive
 *     the penalty but NOT the escalation prompt (CF-ME2-02).
 *   IT-W5-ME3 — the A/B harness commits on planted-significant deltas,
 *     aborts on planted-noise, and the per-variant sample size scales
 *     with tractability (tractable=20, unknown=30, coin-flip=50).
 *
 * @module integration/__tests__/continuation/bundle-authoring.test
 */

import { describe, it, expect } from 'vitest';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// ME-2
import {
  resolveModelAffinity,
  evaluateMatch,
  getAffinityDecision,
  batchAffinityDecisions,
  summariseEscalations,
  EscalationRateLimiter,
  MODEL_TIER,
  pickNextTierUp,
  DEFAULT_MODEL_AFFINITY_SETTINGS,
} from '../../../model-affinity/index.js';

// ME-3
import {
  runAB,
  runSignificanceTest,
  requiredSampleSize,
  sampleSizeTable,
  ABSOLUTE_MIN_SAMPLES,
} from '../../../ab-harness/index.js';

import {
  buildContinuationSkillFixture,
  planMockScorer,
  noisyMockScorer,
} from './fixture.js';

// ---------------------------------------------------------------------------
// IT-W5-ME2 — model-affinity escalation + tractability gate
// ---------------------------------------------------------------------------

describe('IT-W5-ME2 — model-affinity escalation surfaces; tractability gates', () => {
  it('flag-off getAffinityDecision returns null (SC-ME2-01 byte-identical)', () => {
    const decision = getAffinityDecision(
      { reliable: ['opus'] },
      'haiku',
      'tractable',
      false,
    );
    expect(decision).toBeNull();
  });

  it('session model NOT in reliable list → penalty + escalation on tractable', () => {
    const decision = getAffinityDecision(
      { reliable: ['opus'], unreliable: ['haiku'] },
      'haiku',
      'tractable',
      true,
    );
    expect(decision).not.toBeNull();
    expect(decision!.ok).toBe(false);
    expect(decision!.penalty).toBeGreaterThan(0);
    expect(decision!.shouldEscalate).toBe(true);
    expect(decision!.escalateTo).toBe('opus');
  });

  it('coin-flip skill gets penalty but NO escalation (CF-ME2-02)', () => {
    const decision = getAffinityDecision(
      { reliable: ['opus'], unreliable: ['haiku'] },
      'haiku',
      'coin-flip',
      true,
    );
    expect(decision).not.toBeNull();
    expect(decision!.ok).toBe(false);
    // Coin-flip: penalty applied but escalation blocked
    expect(decision!.penalty).toBeGreaterThan(0);
    expect(decision!.shouldEscalate).toBe(false);
  });

  it('no affinity declared → zero penalty / no escalation (CF-ME2-03)', () => {
    const decision = getAffinityDecision(undefined, 'haiku', 'tractable', true);
    expect(decision!.ok).toBe(true);
    expect(decision!.penalty).toBe(0);
    expect(decision!.shouldEscalate).toBe(false);
  });

  it('session model IS in reliable list → fully aligned, zero penalty', () => {
    const decision = getAffinityDecision(
      { reliable: ['haiku', 'sonnet'] },
      'haiku',
      'tractable',
      true,
    );
    expect(decision!.ok).toBe(true);
    expect(decision!.penalty).toBe(0);
    expect(decision!.shouldEscalate).toBe(false);
  });

  it('pickNextTierUp picks cheapest reliable model above session', () => {
    expect(pickNextTierUp('haiku', ['sonnet', 'opus'])).toBe('sonnet');
    expect(pickNextTierUp('sonnet', ['opus'])).toBe('opus');
    expect(MODEL_TIER['haiku']).toBeLessThan(MODEL_TIER['sonnet']!);
    expect(MODEL_TIER['sonnet']).toBeLessThan(MODEL_TIER['opus']!);
  });

  it('batchAffinityDecisions honors flag-off across the batch', () => {
    const skills = buildContinuationSkillFixture(12);
    const out = batchAffinityDecisions(
      skills.map(s => ({
        id: s.id,
        rawModelAffinity: s.rawModelAffinity,
        tractabilityClass: (s.declaredKind === 'prose' ? 'coin-flip' : 'tractable') as
          'tractable' | 'coin-flip',
      })),
      'haiku',
      false, // flag off
    );
    for (const [, decision] of out) {
      expect(decision).toBeNull();
    }
  });

  it('summariseEscalations reports escalations and penalised separately', () => {
    const skills = buildContinuationSkillFixture(18);
    const decisions = batchAffinityDecisions(
      skills.map(s => ({
        id: s.id,
        rawModelAffinity: s.rawModelAffinity,
        tractabilityClass: (s.declaredKind === 'prose' ? 'coin-flip' : 'tractable') as
          'tractable' | 'coin-flip',
      })),
      'haiku',
      true,
    );
    const summary = summariseEscalations(decisions);
    // Mix of escalations and penalised entries across the corpus
    expect(summary.escalations.length + summary.penalised.length).toBeGreaterThan(0);
    // Every escalation has an escalateTo target
    for (const e of summary.escalations) {
      expect(e.escalateTo).toBeDefined();
    }
  });

  it('EscalationRateLimiter suppresses second escalation per skill', () => {
    const limiter = new EscalationRateLimiter();
    expect(limiter.shouldSuppress('s1')).toBe(false);
    expect(limiter.shouldSuppress('s1')).toBe(true); // second call suppressed
    expect(limiter.shouldSuppress('s2')).toBe(false); // different skill ok
    expect(limiter.count).toBe(2);
  });

  it('resolveModelAffinity normalises and rejects malformed input', () => {
    const good = resolveModelAffinity({ reliable: ['opus'], unreliable: ['haiku'] });
    expect(good.affinity).not.toBeNull();
    expect(good.affinity!.reliable).toContain('opus');
    const absent = resolveModelAffinity(undefined);
    expect(absent.affinity).toBeNull();
    const malformed = resolveModelAffinity({ foo: 'bar' } as unknown);
    expect(malformed.affinity).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// IT-W5-ME3 — A/B harness commits planted-significant, aborts planted-noise
// ---------------------------------------------------------------------------

describe('IT-W5-ME3 — A/B harness planted-significant vs planted-noise', () => {
  it('sample-size scales with tractability per documented table', () => {
    const table = sampleSizeTable(0.1, 0);
    expect(table.tractable).toBe(20);
    expect(table.unknown).toBe(30);
    expect(table['coin-flip']).toBe(50);
    expect(ABSOLUTE_MIN_SAMPLES).toBeLessThanOrEqual(table.tractable);
  });

  it('tighter alpha increases required sample size', () => {
    const baseN = requiredSampleSize('tractable', 0, 0.10);
    const tightN = requiredSampleSize('tractable', 0, 0.01);
    expect(tightN).toBeGreaterThan(baseN);
  });

  it('runSignificanceTest commits on planted-significant delta (tractable skill)', () => {
    // Generate 20 paired deltas with clear B-advantage
    const a = Array.from({ length: 20 }, (_, i) => 50 + (i % 3) * 0.5);
    const b = Array.from({ length: 20 }, (_, i) => 65 + (i % 3) * 0.5);
    const noiseFloor = 2.0;
    const result = runSignificanceTest(a, b, noiseFloor, 0.10);
    expect(result.decision).toBe('commit-B');
    expect(result.p_value).toBeLessThan(0.10);
    expect(result.effect_size).toBeGreaterThan(0);
  });

  it('runSignificanceTest returns coin-flip on planted-noise deltas', () => {
    // Both variants identical (±0 noise)
    const a = Array.from({ length: 20 }, (_, i) => 50 + (i % 2) * 0.1);
    const b = Array.from({ length: 20 }, (_, i) => 50 + ((i + 1) % 2) * 0.1);
    const noiseFloor = 2.0;
    const result = runSignificanceTest(a, b, noiseFloor, 0.10);
    expect(result.decision).toBe('coin-flip');
  });

  it('runSignificanceTest returns insufficient-data below minSamples', () => {
    const a = [1, 2, 3];
    const b = [4, 5, 6];
    const result = runSignificanceTest(a, b, 1.0, 0.1);
    expect(result.decision).toBe('insufficient-data');
  });

  it('runAB returns disabled when harness flag is off (SC-ME3-01)', async () => {
    const branchesDir = mkdtempSync(join(tmpdir(), 'me3-flagoff-'));
    const traceDir = mkdtempSync(join(tmpdir(), 'me3-traces-'));
    const trunkPath = join(branchesDir, 'skill.md');
    const result = await runAB({
      skillName: 'skill-under-test',
      trunkBody: 'A body',
      variantBody: 'B body',
      trunkPath,
      tractability: 'tractable',
      samplesPerVariant: 2,
      branchesDir,
      traceDir,
      runSkill: planMockScorer(50, 15),
      settings: { enabled: false },
    });
    expect(result.status).toBe('disabled');
  });

  it('runAB planted-noise with coin-flip tractability → NOT commit-B', async () => {
    const branchesDir = mkdtempSync(join(tmpdir(), 'me3-noise-'));
    const traceDir = mkdtempSync(join(tmpdir(), 'me3-traces-noise-'));
    const trunkPath = join(branchesDir, 'skill.md');
    const result = await runAB({
      skillName: 'skill-flaky',
      trunkBody: 'A body',
      variantBody: 'B body',
      trunkPath,
      tractability: 'coin-flip',
      samplesPerVariant: 15,
      branchesDir,
      traceDir,
      runSkill: noisyMockScorer(50, 2),
      settings: { enabled: true },
    });
    if (result.status === 'completed') {
      // Planted noise → not a commit-B
      expect(result.verdict.decision).not.toBe('commit-B');
      expect(result.committed).toBe(false);
    } else {
      // error path is acceptable as long as it did not commit
      expect(result.status).not.toBe('disabled');
    }
  });
});

// ---------------------------------------------------------------------------
// Bundle 6 composition — ME-2 decision informs ME-3 sample sizing
// ---------------------------------------------------------------------------

describe('Bundle 6 composition — ME-2 ↔ ME-3 tractability alignment', () => {
  it('skills with coin-flip tractability get the larger A/B sample size', () => {
    const fixture = buildContinuationSkillFixture(6);
    for (const s of fixture) {
      const cls = s.declaredKind === 'prose' ? 'coin-flip' : 'tractable';
      const n = requiredSampleSize(cls, 0, 0.1);
      if (cls === 'coin-flip') expect(n).toBe(50);
      else expect(n).toBe(20);
    }
  });

  it('default ME-2 settings have enabled = false', () => {
    expect(DEFAULT_MODEL_AFFINITY_SETTINGS.enabled).toBe(false);
  });

  it('evaluateMatch is consistent with getAffinityDecision flag-on path', () => {
    const raw = { reliable: ['opus'] as const, unreliable: ['haiku'] as const };
    const direct = evaluateMatch({ reliable: ['opus'], unreliable: ['haiku'] }, 'haiku', 'tractable');
    const viaApi = getAffinityDecision(raw, 'haiku', 'tractable', true);
    expect(viaApi!.ok).toBe(direct.ok);
    expect(viaApi!.penalty).toBe(direct.penalty);
    expect(viaApi!.shouldEscalate).toBe(direct.shouldEscalate);
  });
});
