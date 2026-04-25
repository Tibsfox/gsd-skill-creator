/**
 * HB-07 AEL bandit — fast-loop tests.
 */

import { describe, it, expect } from 'vitest';
import {
  emptyBanditState,
  observeReward,
  selectPolicy,
  maybeReflect,
} from '../bandit.js';
import { makeSeededPrng } from './test-helpers.js';

describe('AEL bandit fast loop', () => {
  it('selectPolicy + observeReward over a 3-policy benchmark converges', () => {
    const rates: Record<string, number> = { p1: 0.15, p2: 0.55, p3: 0.9 };
    const arms = ['p1', 'p2', 'p3'] as const;
    const rand = makeSeededPrng(7);
    let s = emptyBanditState();
    const counts: Record<string, number> = { p1: 0, p2: 0, p3: 0 };
    const TOTAL = 600;
    for (let i = 0; i < TOTAL; i++) {
      const pick = selectPolicy(s, arms, { random: rand })!;
      counts[pick]! += 1;
      const reward: 0 | 1 = rand() < rates[pick]! ? 1 : 0;
      s = observeReward(s, pick, reward, { random: rand });
    }
    // Convergence: best arm dominates.
    expect(counts.p3).toBeGreaterThan(TOTAL * 0.6);
    expect(s.episode).toBe(TOTAL);
    expect(s.lastSelection).not.toBeNull();
  });

  it('observeReward is immutable — original state is not mutated', () => {
    const s0 = emptyBanditState();
    const s1 = observeReward(s0, 'p1', 1);
    expect(s1).not.toBe(s0);
    expect(s0.episode).toBe(0);
    expect(s1.episode).toBe(1);
    expect(Object.keys(s0.policies).length).toBe(0);
  });

  it('switches arms when one policy posterior degrades', () => {
    // Start with strong evidence p1 is great. Then flip the regime so p1
    // returns failures and p2 succeeds. Verify the bandit drifts.
    const arms = ['p1', 'p2'] as const;
    const rand = makeSeededPrng(99);
    let s = emptyBanditState();
    // Phase 1: p1 wins repeatedly.
    for (let i = 0; i < 30; i++) s = observeReward(s, 'p1', 1, { random: rand });
    for (let i = 0; i < 30; i++) s = observeReward(s, 'p2', 0, { random: rand });
    const phase1Counts: Record<string, number> = { p1: 0, p2: 0 };
    for (let i = 0; i < 200; i++) {
      const pick = selectPolicy(s, arms, { random: rand })!;
      phase1Counts[pick]! += 1;
    }
    expect(phase1Counts.p1).toBeGreaterThan(phase1Counts.p2);

    // Phase 2: feed reversed evidence — p1 failing, p2 succeeding.
    for (let i = 0; i < 200; i++) s = observeReward(s, 'p1', 0, { random: rand });
    for (let i = 0; i < 200; i++) s = observeReward(s, 'p2', 1, { random: rand });

    const phase2Counts: Record<string, number> = { p1: 0, p2: 0 };
    for (let i = 0; i < 200; i++) {
      const pick = selectPolicy(s, arms, { random: rand })!;
      phase2Counts[pick]! += 1;
    }
    expect(phase2Counts.p2).toBeGreaterThan(phase2Counts.p1);
  });

  it('failure counter increments only on reward=0; reflection threshold gates slow loop', () => {
    let s = emptyBanditState();
    s = observeReward(s, 'p1', 1);
    s = observeReward(s, 'p1', 1);
    expect(s.failuresSinceReflection).toBe(0);
    s = observeReward(s, 'p1', 0);
    s = observeReward(s, 'p1', 0);
    expect(s.failuresSinceReflection).toBe(2);

    // Below threshold (default 5) → no insights.
    const r1 = maybeReflect(s, [{ failureClass: 'fc', occurrences: 3, affectedCandidates: ['x', 'y'] }]);
    expect(r1.insights).toHaveLength(0);
    expect(r1.state.failuresSinceReflection).toBe(2);

    // Cross threshold.
    s = observeReward(s, 'p1', 0);
    s = observeReward(s, 'p1', 0);
    s = observeReward(s, 'p1', 0);
    expect(s.failuresSinceReflection).toBe(5);

    const r2 = maybeReflect(s, [{ failureClass: 'fc', occurrences: 3, affectedCandidates: ['x', 'y'] }]);
    expect(r2.insights.length).toBeGreaterThan(0);
    // Counter resets after reflection fires.
    expect(r2.state.failuresSinceReflection).toBe(0);
  });
});
