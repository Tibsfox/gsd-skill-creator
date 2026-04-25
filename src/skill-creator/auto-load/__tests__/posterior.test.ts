/**
 * HB-07 AEL bandit — Beta posterior unit tests.
 */

import { describe, it, expect } from 'vitest';
import {
  makePosterior,
  posteriorMean,
  updatePosterior,
  updatePosteriorMap,
  sampleBeta,
  thompsonSelect,
  EMPTY_POSTERIORS,
} from '../posterior.js';
import { makeSeededPrng } from './test-helpers.js';

describe('Beta posterior', () => {
  it('initial Beta(1,1) has mean 0.5', () => {
    const p = makePosterior();
    expect(posteriorMean(p)).toBeCloseTo(0.5, 6);
  });

  it('success increments alpha; failure increments beta; immutable update', () => {
    const p0 = makePosterior(2, 3);
    const p1 = updatePosterior(p0, 1);
    const p2 = updatePosterior(p0, 0);
    expect(p1.alpha).toBe(3);
    expect(p1.beta).toBe(3);
    expect(p2.alpha).toBe(2);
    expect(p2.beta).toBe(4);
    // Original not mutated.
    expect(p0.alpha).toBe(2);
    expect(p0.beta).toBe(3);
  });

  it('throws on non-positive priors', () => {
    expect(() => makePosterior(0, 1)).toThrow(RangeError);
    expect(() => makePosterior(1, -1)).toThrow(RangeError);
    expect(() => makePosterior(NaN, 1)).toThrow(RangeError);
  });

  it('updatePosteriorMap returns a NEW frozen map', () => {
    const m0 = EMPTY_POSTERIORS;
    const m1 = updatePosteriorMap(m0, 'p1', 1);
    expect(m1).not.toBe(m0);
    expect(Object.isFrozen(m1)).toBe(true);
    expect(m1['p1']?.alpha).toBe(2);
    expect(Object.keys(m0).length).toBe(0);
  });

  it('thompsonSelect converges to the true-best arm on a 3-policy benchmark', () => {
    // Three policies with true success rates 0.2, 0.5, 0.85.
    const rates: Record<string, number> = { lo: 0.2, mid: 0.5, hi: 0.85 };
    const arms = ['lo', 'mid', 'hi'] as const;
    const rand = makeSeededPrng(0xC0FFEE);
    let posteriors = EMPTY_POSTERIORS;
    const selectionCount: Record<string, number> = { lo: 0, mid: 0, hi: 0 };
    const TOTAL = 600;
    for (let t = 0; t < TOTAL; t++) {
      const pick = thompsonSelect(posteriors, arms, rand)!;
      selectionCount[pick]! += 1;
      const reward: 0 | 1 = rand() < rates[pick]! ? 1 : 0;
      posteriors = updatePosteriorMap(posteriors, pick, reward);
    }
    // Bandit should overwhelmingly pick 'hi' once posterior concentrates.
    expect(selectionCount.hi).toBeGreaterThan(TOTAL * 0.6);
    expect(selectionCount.lo).toBeLessThan(TOTAL * 0.15);
  });

  it('sampleBeta returns values in [0, 1] across many draws', () => {
    const rand = makeSeededPrng(42);
    const post = makePosterior(2, 5);
    for (let i = 0; i < 200; i++) {
      const v = sampleBeta(post, rand);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
  });
});
