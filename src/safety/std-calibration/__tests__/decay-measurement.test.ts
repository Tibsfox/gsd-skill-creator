/**
 * HB-03 — decay measurement harness tests.
 *
 * Per-model STD measurement over a synthetic prohibition-decay benchmark.
 * Output STD must reflect the synthetic decay shape (paper: 73%→33% by
 * turn 16 → STD around the half-compliance crossing).
 */

import { describe, it, expect, afterEach } from 'vitest';
import { measureDecay } from '../decay-measurement.js';
import { DEFAULT_COMPLIANCE_TOLERANCE } from '../types.js';
import { makeEnv, buildSyntheticTrial } from './test-helpers.js';

describe('STD decay-measurement harness', () => {
  const cleanups: Array<() => void> = [];
  afterEach(() => {
    while (cleanups.length) cleanups.pop()!();
  });

  function runFor(model: 'opus' | 'sonnet' | 'haiku', startCompliance: number) {
    const env = makeEnv(true);
    cleanups.push(env.cleanup);
    const trials = Array.from({ length: 64 }, (_, i) =>
      buildSyntheticTrial(`${model}-trial-${i}`, 16, startCompliance, 0.2),
    );
    const result = measureDecay(model, trials, DEFAULT_COMPLIANCE_TOLERANCE, env.configPath);
    expect(result.disabled).toBe(false);
    expect(result.model).toBe(model);
    expect(result.trialCount).toBe(64);
    expect(result.perTurnCompliance).toHaveLength(16);
    // STD must be a turn ≥1 and ≤16. With start at 73% and end at 20%,
    // crossing 0.5 happens somewhere in the middle.
    expect(result.std).toBeGreaterThanOrEqual(1);
    expect(result.std).toBeLessThanOrEqual(16);
    expect(result.complianceAtStd).toBeLessThanOrEqual(DEFAULT_COMPLIANCE_TOLERANCE);
    return result;
  }

  it('computes opus STD over a 16-turn paper-shape benchmark', () => {
    const r = runFor('opus', 0.85);
    expect(r.model).toBe('opus');
  });

  it('computes sonnet STD over a 16-turn paper-shape benchmark', () => {
    const r = runFor('sonnet', 0.73);
    expect(r.model).toBe('sonnet');
  });

  it('computes haiku STD over a 16-turn paper-shape benchmark', () => {
    const r = runFor('haiku', 0.6);
    expect(r.model).toBe('haiku');
  });

  it('flag off → disabled sentinel; no measurement produced', () => {
    const env = makeEnv(false);
    cleanups.push(env.cleanup);
    const r = measureDecay('opus', [buildSyntheticTrial('x', 8)], 0.5, env.configPath);
    expect(r.disabled).toBe(true);
    expect(r.std).toBe(0);
    expect(r.trialCount).toBe(0);
  });

  it('handles empty trial set deterministically', () => {
    const env = makeEnv(true);
    cleanups.push(env.cleanup);
    const r = measureDecay('opus', [], 0.5, env.configPath);
    expect(r.disabled).toBe(false);
    expect(r.std).toBe(0);
    expect(r.trialCount).toBe(0);
  });

  it('STD = max turn when compliance never crosses tolerance', () => {
    const env = makeEnv(true);
    cleanups.push(env.cleanup);
    // All-compliant trials → never crosses the 0.5 floor.
    const trials = [
      {
        trialId: 'always-good',
        turns: Array.from({ length: 10 }, (_, i) => ({ turn: i + 1, compliant: true })),
      },
    ];
    const r = measureDecay('opus', trials, 0.5, env.configPath);
    expect(r.disabled).toBe(false);
    expect(r.std).toBe(10);
  });
});
