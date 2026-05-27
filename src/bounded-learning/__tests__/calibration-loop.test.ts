/**
 * Tests for the calibration loop driver.
 *
 * Trip-points:
 *   With α = 0.05 (per-side α/2 = 0.025; threshold = 40) and λ = 0.5,
 *   per-step one-sided evidence for x = +1 is exp(0.5 − 0.125) = exp(0.375)
 *   ≈ 1.4550. So 10 unanimous accepts produce evidence ≈ 41.1 > 40,
 *   tripping the positive-side rejection.
 */
import { describe, it, expect } from 'vitest';
import { runCalibrationLoop } from '../calibration-loop.js';
import type { CalibrationObservation } from '../types.js';

function obs(value: 1 | -1 | 0, id = 's'): CalibrationObservation {
  return {
    suggestionId: id,
    decision: value === 1 ? 'accepted' : value === -1 ? 'dismissed' : 'pending',
    value,
    observedAt: null,
  };
}

describe('runCalibrationLoop', () => {
  it('holds with zero observations', () => {
    const rec = runCalibrationLoop('suggestions.min_occurrences', 3, []);
    expect(rec.direction).toBe('hold');
    expect(rec.rejected).toBe(false);
    expect(rec.proposedValue).toBeNull();
    expect(rec.observations).toBe(0);
    expect(rec.meanObservation).toBe(0);
    expect(rec.reason).toContain('No terminal');
  });

  it('holds with insufficient evidence', () => {
    const obs5 = Array.from({ length: 5 }, (_, i) => obs(1, `s-${i}`));
    const rec = runCalibrationLoop('suggestions.min_occurrences', 3, obs5);
    expect(rec.direction).toBe('hold');
    expect(rec.rejected).toBe(false);
    expect(rec.proposedValue).toBeNull();
    expect(rec.observations).toBe(5);
    // Evidence after 5 unanimous accepts is exp(0.375)^5 ≈ 6.52, well
    // below the rejection threshold of 1/0.025 = 40.
    expect(rec.evidence).toBeGreaterThan(5);
    expect(rec.evidence).toBeLessThan(10);
  });

  it('recommends decrease on accept-skew', () => {
    const obs10 = Array.from({ length: 10 }, (_, i) => obs(1, `s-${i}`));
    const rec = runCalibrationLoop('suggestions.min_occurrences', 3, obs10);
    expect(rec.direction).toBe('decrease');
    expect(rec.rejected).toBe(true);
    expect(rec.proposedValue).toBe(2);
    expect(rec.meanObservation).toBe(1);
    expect(rec.reason).toContain('lower');
    expect(rec.reason).toContain('3 → 2');
  });

  it('recommends increase on dismiss-skew', () => {
    const obs10 = Array.from({ length: 10 }, (_, i) => obs(-1, `s-${i}`));
    const rec = runCalibrationLoop('suggestions.min_occurrences', 3, obs10);
    expect(rec.direction).toBe('increase');
    expect(rec.rejected).toBe(true);
    expect(rec.proposedValue).toBe(4);
    expect(rec.meanObservation).toBe(-1);
    expect(rec.reason).toContain('raise');
    expect(rec.reason).toContain('3 → 4');
  });

  it('clamps proposed decrease at the absolute floor (1)', () => {
    const obs10 = Array.from({ length: 10 }, (_, i) => obs(1, `s-${i}`));
    const rec = runCalibrationLoop('suggestions.min_occurrences', 1, obs10);
    expect(rec.direction).toBe('decrease');
    expect(rec.proposedValue).toBe(1);
  });

  it('does not reject on balanced accept/dismiss observations', () => {
    // 6 accepts + 6 dismisses — large sample size but no skew. Each side's
    // one-sided e-process sees mean 0, evidence drifts only slowly.
    const balanced = [
      ...Array.from({ length: 6 }, (_, i) => obs(1, `a-${i}`)),
      ...Array.from({ length: 6 }, (_, i) => obs(-1, `d-${i}`)),
    ];
    const rec = runCalibrationLoop('suggestions.min_occurrences', 3, balanced);
    expect(rec.direction).toBe('hold');
    expect(rec.rejected).toBe(false);
  });

  it('exposes the rejection threshold consistent with alpha/2', () => {
    const rec = runCalibrationLoop('suggestions.min_occurrences', 3, [], { alpha: 0.05 });
    // Bonferroni: per-side α/2 = 0.025, threshold = 1 / 0.025 = 40
    expect(rec.rejectionThreshold).toBe(40);
    expect(rec.alpha).toBe(0.05);
  });

  it('honors custom alpha', () => {
    const rec = runCalibrationLoop('suggestions.min_occurrences', 3, [], { alpha: 0.1 });
    // Per-side α/2 = 0.05, threshold = 1 / 0.05 = 20
    expect(rec.rejectionThreshold).toBe(20);
    expect(rec.alpha).toBe(0.1);
  });
});

describe('runCalibrationLoop — suggestions.cooldown_days (v1.49.796)', () => {
  it('recommends decrease on accept-skew (re-surface sooner)', () => {
    const obs10 = Array.from({ length: 10 }, (_, i) => obs(1, `s-${i}`));
    const rec = runCalibrationLoop('suggestions.cooldown_days', 7, obs10);
    expect(rec.threshold).toBe('suggestions.cooldown_days');
    expect(rec.direction).toBe('decrease');
    expect(rec.rejected).toBe(true);
    expect(rec.proposedValue).toBe(6);
    expect(rec.reason).toContain('lower');
    expect(rec.reason).toContain('7 → 6');
  });

  it('recommends increase on dismiss-skew (re-surface later)', () => {
    const obs10 = Array.from({ length: 10 }, (_, i) => obs(-1, `s-${i}`));
    const rec = runCalibrationLoop('suggestions.cooldown_days', 7, obs10);
    expect(rec.threshold).toBe('suggestions.cooldown_days');
    expect(rec.direction).toBe('increase');
    expect(rec.rejected).toBe(true);
    expect(rec.proposedValue).toBe(8);
    expect(rec.reason).toContain('raise');
    expect(rec.reason).toContain('7 → 8');
  });

  it('holds with insufficient evidence at the live default value (7)', () => {
    const obs5 = Array.from({ length: 5 }, (_, i) => obs(1, `s-${i}`));
    const rec = runCalibrationLoop('suggestions.cooldown_days', 7, obs5);
    expect(rec.direction).toBe('hold');
    expect(rec.proposedValue).toBeNull();
    expect(rec.currentValue).toBe(7);
  });

  it('clamps proposed decrease at the absolute floor (1)', () => {
    const obs10 = Array.from({ length: 10 }, (_, i) => obs(1, `s-${i}`));
    const rec = runCalibrationLoop('suggestions.cooldown_days', 1, obs10);
    expect(rec.direction).toBe('decrease');
    expect(rec.proposedValue).toBe(1);
  });
});
