// CF-B-023-2 — pinned-rule preservation regression guard.
//
// HARD invariant: the survey scorer MUST NEVER shed an entry with
// `type: 'pinned-rule'`. Any failure here means the scorer is broken;
// fix the scorer, not the test.
//
// Adversarial inputs:
//   - Threshold = 1.0 (only perfect matches kept)
//   - Empty context (zero relevance)
//   - Very ancient last_accessed + transient half-life (heavy decay)
//   - Confidence = 0 (multiplies score to zero)
//   - Pinned-rule with all-zero score signals — must still pass
//   - Mixed corpus where every non-pinned entry would shed
//
// Closes: CF-B-023-2 (BLOCK validation, paired with CF-B-023-1).

import { describe, it, expect } from 'vitest';
import { survey, type MemoryEntry } from '../survey-scorer.js';

const NOW = new Date('2026-04-25T12:00:00Z');

function pinnedRule(name: string, overrides: Partial<MemoryEntry> = {}): MemoryEntry {
  return {
    name,
    description: '',
    type: 'pinned-rule',
    half_life: 'infinite',
    last_accessed: NOW.toISOString(),
    confidence: 1.0,
    body: '',
    ...overrides,
  };
}

function regular(name: string, overrides: Partial<MemoryEntry> = {}): MemoryEntry {
  return {
    name,
    description: '',
    type: 'project',
    half_life: '1mo',
    last_accessed: NOW.toISOString(),
    confidence: 0.95,
    body: '',
    ...overrides,
  };
}

describe('CF-B-023-2: pinned-rule passthrough — adversarial inputs', () => {
  it('keeps pinned rules with empty context', () => {
    const out = survey('', [pinnedRule('a'), pinnedRule('b'), regular('c')], {
      now: NOW,
    });
    const pinnedKept = out.kept.filter((e) => e.type === 'pinned-rule');
    expect(pinnedKept.map((e) => e.name).sort()).toEqual(['a', 'b']);
    expect(out.shed.some((e) => e.type === 'pinned-rule')).toBe(false);
  });

  it('keeps pinned rules at threshold = 1.0', () => {
    const out = survey('xyz', [pinnedRule('a')], { threshold: 1.0, now: NOW });
    expect(out.kept.map((e) => e.name)).toEqual(['a']);
    expect(out.shed).toEqual([]);
  });

  it('keeps a pinned rule even with confidence = 0', () => {
    const out = survey(
      'xyz',
      [pinnedRule('a', { confidence: 0 })],
      { now: NOW },
    );
    expect(out.kept.map((e) => e.name)).toEqual(['a']);
  });

  it('keeps a pinned rule with ancient timestamp + transient half-life', () => {
    const out = survey(
      'xyz',
      [
        pinnedRule('a', {
          last_accessed: '1980-01-01T00:00:00Z',
          half_life: 'transient',
        }),
      ],
      { now: NOW },
    );
    expect(out.kept.map((e) => e.name)).toEqual(['a']);
  });

  it('keeps every pinned rule in a mixed corpus where everything else sheds', () => {
    const corpus: MemoryEntry[] = [
      pinnedRule('p1'),
      pinnedRule('p2'),
      pinnedRule('p3'),
      pinnedRule('p4'),
      regular('r1', { body: 'apple banana', confidence: 0.05 }),
      regular('r2', { body: 'orange peach', confidence: 0.05 }),
      regular('r3', { body: 'kiwi mango', confidence: 0.05 }),
    ];
    const out = survey('completely orthogonal context', corpus, {
      threshold: 0.99,
      now: NOW,
    });
    // All 4 pinned rules survive
    const pinnedKeptNames = out.kept
      .filter((e) => e.type === 'pinned-rule')
      .map((e) => e.name)
      .sort();
    expect(pinnedKeptNames).toEqual(['p1', 'p2', 'p3', 'p4']);
    // No pinned rule appears in shed
    expect(out.shed.some((e) => e.type === 'pinned-rule')).toBe(false);
  });

  it('orders pinned rules first in kept', () => {
    const corpus: MemoryEntry[] = [
      regular('high-relevance', { body: 'apple banana cherry date' }),
      pinnedRule('pinned-a'),
      pinnedRule('pinned-b'),
    ];
    const out = survey('apple banana cherry date', corpus, { now: NOW });
    expect(out.kept.length).toBe(3);
    // The first two slots must be the pinned-rule entries
    expect(out.kept[0].type).toBe('pinned-rule');
    expect(out.kept[1].type).toBe('pinned-rule');
    expect(out.kept[2].name).toBe('high-relevance');
  });

  it('records pinned-rule reasoning in scores breakdown', () => {
    const out = survey('x', [pinnedRule('rule')], { now: NOW });
    const scoreEntry = out.scores.find((s) => s.name === 'rule');
    expect(scoreEntry).toBeDefined();
    expect(scoreEntry?.pinned).toBe(true);
    expect(scoreEntry?.score).toBe(1.0);
    expect(scoreEntry?.reason).toMatch(/pinned-rule/);
  });

  it('scoring 100 pinned rules at once: 100 kept, 0 shed', () => {
    const corpus: MemoryEntry[] = [];
    for (let i = 0; i < 100; i++) corpus.push(pinnedRule(`pinned-${i}`));
    const out = survey('whatever context', corpus, { threshold: 0.5, now: NOW });
    expect(out.kept.length).toBe(100);
    expect(out.shed.length).toBe(0);
  });

  it('regression note (load-bearing): if this test fails, fix the scorer not the test', () => {
    // This test exists to make the contract impossible to forget. The
    // pinned-rule passthrough is documented in:
    //   - STANDING-RULES.md (canonical home for pinned content)
    //   - docs/memory-schema.md §4 (load order)
    //   - src/memory/survey-scorer.ts (the implementation)
    //   - .planning/missions/oops-gsd-implementation/components/03-C3-memory-cluster.md (spec)
    //
    // If you are reading this comment because the test failed, the
    // contract was violated. Restore the bypass branch in
    // src/memory/survey-scorer.ts:survey() that handles
    // type === 'pinned-rule' BEFORE the scoring formula runs.
    const out = survey('', [pinnedRule('contract-witness')], { now: NOW });
    expect(out.kept.map((e) => e.name)).toEqual(['contract-witness']);
  });
});
