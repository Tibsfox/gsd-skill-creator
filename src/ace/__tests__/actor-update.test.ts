/**
 * MA-2 ACE — actor-update.test.ts
 *
 * Verifies the ActorSignal builder and score-application helper.
 *
 * @module ace/__tests__/actor-update.test
 */

import { describe, it, expect } from 'vitest';
import { buildActorSignal, applyActorSignalToScore } from '../actor-update.js';
import type { ChannelReading } from '../td-error.js';

const mk = (
  channel: ChannelReading['channel'],
  eligibility: number,
  reinforcement: number,
): ChannelReading => ({ channel, eligibility, reinforcement });

describe('buildActorSignal', () => {
  it('carries δ, weight, tick and per-channel eligibility map', () => {
    const readings = [
      mk('explicit_correction', 0.4, -1),
      mk('outcome_observed', 0.6, 1),
    ];
    const sig = buildActorSignal(0.25, 0.7, readings, 3);
    expect(sig.delta).toBe(0.25);
    expect(sig.weight).toBe(0.7);
    expect(sig.tick).toBe(3);
    expect(sig.perChannelEligibility.explicit_correction).toBe(0.4);
    expect(sig.perChannelEligibility.outcome_observed).toBe(0.6);
    expect(sig.perChannelEligibility.branch_resolved).toBeUndefined();
  });

  it('clamps |delta| to maxAbsDelta (default 1.0)', () => {
    const sig = buildActorSignal(5, 1.0, [], 1);
    expect(sig.delta).toBe(1);
    const neg = buildActorSignal(-5, 1.0, [], 1);
    expect(neg.delta).toBe(-1);
  });

  it('honours explicit maxAbsDelta override', () => {
    const sig = buildActorSignal(0.5, 1.0, [], 1, { maxAbsDelta: 0.2 });
    expect(sig.delta).toBe(0.2);
  });

  it('coerces non-finite δ to 0', () => {
    const sig = buildActorSignal(Number.NaN, 1.0, [], 1);
    expect(sig.delta).toBe(0);
  });
});

describe('applyActorSignalToScore', () => {
  it('adds δ · propensity to base score', () => {
    const sig = buildActorSignal(0.2, 1.0, [], 1);
    const out = applyActorSignalToScore(0.5, sig, 0.5);
    expect(out).toBeCloseTo(0.5 + 0.2 * 0.5, 12);
  });

  it('zero propensity → no change', () => {
    const sig = buildActorSignal(0.2, 1.0, [], 1);
    expect(applyActorSignalToScore(0.5, sig, 0)).toBe(0.5);
  });

  it('non-finite propensity → no change', () => {
    const sig = buildActorSignal(0.2, 1.0, [], 1);
    expect(applyActorSignalToScore(0.5, sig, Number.NaN)).toBe(0.5);
  });

  it('clamps propensity into [0, 1]', () => {
    const sig = buildActorSignal(0.1, 1.0, [], 1);
    // propensity=5 would yield 0.5 + 0.1*5 = 1.0 if unclamped; expect clamp to 1.
    expect(applyActorSignalToScore(0.5, sig, 5)).toBeCloseTo(0.5 + 0.1, 12);
    // negative propensity → clamp to 0, no change.
    expect(applyActorSignalToScore(0.5, sig, -1)).toBe(0.5);
  });
});
