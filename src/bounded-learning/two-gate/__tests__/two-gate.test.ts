/**
 * Two-Gate Guardrail tests — Phase 712 (v1.49.570).
 *
 * Validates the tau-gate + K[m]-gate pair, oracle-inequality bound, and
 * the gsd-skill-creator cap-realization documentation helper.
 *
 * Covers: CONV-15.
 */

import { describe, it, expect } from 'vitest';
import {
  sqrtScalingCap,
  buildParams,
  evaluateTwoGate,
  buildLogRecord,
  gsdCapRealization,
  DEFAULT_K0,
  DEFAULT_TAU,
} from '../index.js';
import type { GateInputs } from '../index.js';

function baseInputs(overrides: Partial<GateInputs> = {}): GateInputs {
  return {
    sampleSize: 100,
    currentAccuracy: 0.80,
    proposedAccuracy: 0.82,
    proposedCapacity: 20,
    phase: 'test-711.1',
    ...overrides,
  };
}

describe('two-gate: constants + defaults', () => {
  it('DEFAULT_K0 is 4.0', () => {
    expect(DEFAULT_K0).toBe(4.0);
  });

  it('DEFAULT_TAU is 0.01 (1 percentage point)', () => {
    expect(DEFAULT_TAU).toBe(0.01);
  });
});

describe('two-gate: sqrtScalingCap', () => {
  it('returns k0 * sqrt(m) at default k0', () => {
    const cap = sqrtScalingCap();
    expect(cap(100)).toBeCloseTo(40);
    expect(cap(25)).toBeCloseTo(20);
    expect(cap(0)).toBe(0);
  });

  it('respects custom k0 override', () => {
    const cap = sqrtScalingCap(2);
    expect(cap(100)).toBeCloseTo(20);
  });

  it('clamps negative sample sizes to 0', () => {
    const cap = sqrtScalingCap();
    expect(cap(-5)).toBe(0);
  });
});

describe('two-gate: buildParams', () => {
  it('returns defaults when no overrides given', () => {
    const p = buildParams();
    expect(p.tau).toBe(DEFAULT_TAU);
    expect(typeof p.capacityCap).toBe('function');
    expect(p.label).toBe('gsd-skill-creator.default');
  });

  it('respects tau and label overrides', () => {
    const p = buildParams({ tau: 0.05, label: 'custom' });
    expect(p.tau).toBe(0.05);
    expect(p.label).toBe('custom');
  });
});

describe('two-gate: evaluateTwoGate', () => {
  it('passes both gates when improvement >= tau AND capacity <= K[m]', () => {
    const params = buildParams({ tau: 0.01 });
    const r = evaluateTwoGate(params, baseInputs());
    expect(r.pass).toBe(true);
    expect(r.tauGate.pass).toBe(true);
    expect(r.capacityGate.pass).toBe(true);
    expect(r.summary).toContain('PASS');
  });

  it('fails tau gate when improvement is below threshold', () => {
    const params = buildParams({ tau: 0.05 });
    const r = evaluateTwoGate(params, baseInputs({ currentAccuracy: 0.80, proposedAccuracy: 0.81 }));
    expect(r.pass).toBe(false);
    expect(r.tauGate.pass).toBe(false);
    expect(r.capacityGate.pass).toBe(true);
    expect(r.summary).toContain('FAIL');
    expect(r.summary).toContain('tau');
  });

  it('fails capacity gate when proposedCapacity > K[m]', () => {
    const params = buildParams({ tau: 0.01 });
    // At sampleSize 100, K[m] = 4.0 * sqrt(100) = 40. proposedCapacity 50 > 40.
    const r = evaluateTwoGate(params, baseInputs({ proposedCapacity: 50 }));
    expect(r.pass).toBe(false);
    expect(r.capacityGate.pass).toBe(false);
    expect(r.summary).toContain('K[m]');
  });

  it('fails both gates when both violations present', () => {
    const params = buildParams({ tau: 0.05 });
    const r = evaluateTwoGate(params, baseInputs({
      currentAccuracy: 0.80,
      proposedAccuracy: 0.80,
      proposedCapacity: 100,
    }));
    expect(r.pass).toBe(false);
    expect(r.tauGate.pass).toBe(false);
    expect(r.capacityGate.pass).toBe(false);
    expect(r.summary).toContain('tau');
    expect(r.summary).toContain('K[m]');
  });

  it('emits oracle-inequality bound as sqrt(capacity / sampleSize)', () => {
    const params = buildParams();
    // capacity 16, sampleSize 100 => bound sqrt(0.16) = 0.4
    const r = evaluateTwoGate(params, baseInputs({ proposedCapacity: 16, sampleSize: 100 }));
    expect(r.oracleInequalityBound).toBeCloseTo(0.4, 3);
  });

  it('handles negative gap (accuracy regression) by failing tau', () => {
    const params = buildParams({ tau: 0.01 });
    const r = evaluateTwoGate(params, baseInputs({ currentAccuracy: 0.90, proposedAccuracy: 0.80 }));
    expect(r.tauGate.pass).toBe(false);
    expect(r.tauGate.observed).toBeLessThan(0);
  });

  it('handles zero-sample edge case without divide-by-zero', () => {
    const params = buildParams();
    const r = evaluateTwoGate(params, baseInputs({ sampleSize: 0, proposedCapacity: 10 }));
    expect(r.oracleInequalityBound).toBeDefined();
    expect(Number.isFinite(r.oracleInequalityBound)).toBe(true);
  });
});

describe('two-gate: buildLogRecord', () => {
  it('emits a well-typed log record with all inputs', () => {
    const params = buildParams({ tau: 0.02, label: 'test' });
    const inputs = baseInputs();
    const result = evaluateTwoGate(params, inputs);
    const rec = buildLogRecord(params, inputs, result, '2026-04-23T00:00:00.000Z');
    expect(rec.type).toBe('bounded-learning.two-gate.evaluation');
    expect(rec.timestamp).toBe('2026-04-23T00:00:00.000Z');
    expect(rec.phase).toBe('test-711.1');
    expect(rec.params.tau).toBe(0.02);
    expect(rec.params.label).toBe('test');
    expect(rec.inputs).toBe(inputs);
    expect(rec.result).toBe(result);
  });

  it('defaults timestamp to now when not provided', () => {
    const params = buildParams();
    const inputs = baseInputs();
    const result = evaluateTwoGate(params, inputs);
    const rec = buildLogRecord(params, inputs, result);
    const ts = new Date(rec.timestamp);
    expect(ts.getTime()).toBeGreaterThan(0);
  });
});

describe('two-gate: gsdCapRealization', () => {
  it('documents the 20/3/7 realization mapping', () => {
    const r = gsdCapRealization();
    expect(r.contentChangeCapPercent).toBe(20);
    expect(r.correctionMinimum).toBe(3);
    expect(r.cooldownDays).toBe(7);
    expect(r.mappedToKm).toContain('K[m]');
    expect(r.mappedToKm).toContain('CAPCOM');
    expect(r.mappedToKm).toContain('Wang-Dorchen');
  });
});
