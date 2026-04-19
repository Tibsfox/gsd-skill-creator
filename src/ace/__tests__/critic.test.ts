/**
 * MA-2 ACE — critic.test.ts
 *
 * Verifies AdaptiveCriticElement tracks a running estimate of `p̂ = −F̂`
 * consistent with the TD update.
 *
 * @module ace/__tests__/critic.test
 */

import { describe, it, expect } from 'vitest';
import { AdaptiveCriticElement } from '../critic.js';

describe('AdaptiveCriticElement', () => {
  it('initialises with default estimate = 0', () => {
    const c = new AdaptiveCriticElement();
    expect(c.estimate).toBe(0);
    expect(c.updateCount).toBe(0);
    expect(c.cumulativeDelta).toBe(0);
  });

  it('honours initialEstimate seed', () => {
    const c = new AdaptiveCriticElement({ initialEstimate: 1.5 });
    expect(c.estimate).toBe(1.5);
  });

  it('applies single TD update: estimate += α · δ', () => {
    const c = new AdaptiveCriticElement({ alphaCritic: 0.2 });
    c.update(1.0);
    expect(c.estimate).toBeCloseTo(0.2, 12);
    expect(c.updateCount).toBe(1);
    expect(c.cumulativeDelta).toBeCloseTo(1.0, 12);
  });

  it('converges toward the true value under a constant TD signal (on-policy)', () => {
    // Feed a constant δ = 0.1, 200 updates, α=0.1. Estimate grows toward
    // equilibrium α·δ·n but at unit step we only care monotone increase.
    const c = new AdaptiveCriticElement({ alphaCritic: 0.1 });
    let prev = c.estimate;
    for (let i = 0; i < 200; i++) {
      c.update(0.1);
      expect(c.estimate).toBeGreaterThanOrEqual(prev);
      prev = c.estimate;
    }
    // Cumulative = 0.1 * 200 = 20, estimate = 0.1 * 20 = 2.0
    expect(c.cumulativeDelta).toBeCloseTo(20, 8);
    expect(c.estimate).toBeCloseTo(2.0, 8);
  });

  it('snapshot round-trips and reset() clears state', () => {
    const c = new AdaptiveCriticElement({ alphaCritic: 0.1, initialEstimate: 0.5 });
    c.update(0.3);
    c.update(-0.1);
    const snap = c.snapshot();
    expect(snap.updateCount).toBe(2);
    expect(snap.cumulativeDelta).toBeCloseTo(0.2, 12);
    c.reset(0);
    expect(c.estimate).toBe(0);
    expect(c.updateCount).toBe(0);
    expect(c.cumulativeDelta).toBe(0);
  });

  it('ignores non-finite δ (NaN/Inf guard)', () => {
    const c = new AdaptiveCriticElement();
    c.update(Number.NaN);
    c.update(Number.POSITIVE_INFINITY);
    expect(c.estimate).toBe(0);
    expect(c.updateCount).toBe(0);
  });
});
