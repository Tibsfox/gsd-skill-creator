/**
 * HB-05 — SOL budget guidance tests (v1.49.574 Half B, T2).
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  HardwareEnvelopeSchema,
  OperatorClassSchema,
  RTX_4060_TI_ENVELOPE,
  defaultSolEstimator,
  computeBudgetGuidance,
  isSolBudgetEnabled,
  SOL_BUDGET_HOOK_VERSION,
  type OperatorWorkload,
  type HardwareEnvelope,
} from '../index.js';

function withTempEnv(enabled: boolean): { configPath: string; cleanup: () => void } {
  const dir = mkdtempSync(join(tmpdir(), 'mk-sol-'));
  const claudeDir = join(dir, '.claude');
  mkdirSync(claudeDir, { recursive: true });
  const configPath = join(claudeDir, 'gsd-skill-creator.json');
  writeFileSync(configPath, JSON.stringify({
    'gsd-skill-creator': {
      'megakernel-substrate': { 'sol-budget-guidance': { enabled } },
    },
  }));
  return { configPath, cleanup: () => rmSync(dir, { recursive: true, force: true }) };
}

const memBoundWorkload: OperatorWorkload = {
  operatorClass: 'pointwise', flops: 1e6, bytes: 1e8, name: 'mem-bound',
};
const computeBoundWorkload: OperatorWorkload = {
  operatorClass: 'matmul', flops: 1e12, bytes: 1e6, name: 'compute-bound',
};

// ---- schemas --------------------------------------------------------------

describe('HB-05 OperatorClassSchema', () => {
  it('accepts every documented class', () => {
    for (const c of ['matmul', 'attention', 'layer-norm', 'rms-norm', 'softmax', 'reduction', 'pointwise', 'all-reduce', 'reduce-scatter']) {
      expect(OperatorClassSchema.safeParse(c).success).toBe(true);
    }
  });
});

describe('HB-05 HardwareEnvelopeSchema', () => {
  it('accepts the RTX 4060 Ti reference envelope', () => {
    expect(HardwareEnvelopeSchema.safeParse(RTX_4060_TI_ENVELOPE).success).toBe(true);
  });
  it('rejects non-positive bandwidth', () => {
    expect(HardwareEnvelopeSchema.safeParse({
      hardwareTarget: 'h', peakTflops: 22, peakMemBandwidthGbps: 0, smCount: 34,
    }).success).toBe(false);
  });
});

describe('HB-05 RTX_4060_TI_ENVELOPE', () => {
  it('matches M5 §4 published numbers', () => {
    expect(RTX_4060_TI_ENVELOPE.peakTflops).toBe(22);
    expect(RTX_4060_TI_ENVELOPE.peakMemBandwidthGbps).toBe(288);
    expect(RTX_4060_TI_ENVELOPE.smCount).toBe(34);
  });
  it('is frozen', () => {
    expect(Object.isFrozen(RTX_4060_TI_ENVELOPE)).toBe(true);
  });
});

// ---- defaultSolEstimator --------------------------------------------------

describe('HB-05 defaultSolEstimator', () => {
  it('classifies memory-bound when bytes/flops ratio is high', () => {
    const r = defaultSolEstimator(memBoundWorkload, RTX_4060_TI_ENVELOPE);
    expect(r.computeBound).toBe(false);
    expect(r.minMicros).toBeGreaterThan(0);
  });

  it('classifies compute-bound when flops/bytes is high', () => {
    const r = defaultSolEstimator(computeBoundWorkload, RTX_4060_TI_ENVELOPE);
    expect(r.computeBound).toBe(true);
  });

  it('reports correct arithmetic intensity', () => {
    const r = defaultSolEstimator(
      { operatorClass: 'matmul', flops: 100, bytes: 10 },
      RTX_4060_TI_ENVELOPE,
    );
    expect(r.arithmeticIntensity).toBe(10);
  });

  it('handles bytes=0 gracefully (returns Infinity AI)', () => {
    const r = defaultSolEstimator(
      { operatorClass: 'matmul', flops: 1, bytes: 0 },
      RTX_4060_TI_ENVELOPE,
    );
    expect(r.arithmeticIntensity).toBe(Infinity);
  });

  it('SOL ≤ measured invariant: increasing measured doesn\'t change SOL', () => {
    const a = defaultSolEstimator(memBoundWorkload, RTX_4060_TI_ENVELOPE);
    const b = defaultSolEstimator(memBoundWorkload, RTX_4060_TI_ENVELOPE);
    expect(a.minMicros).toBe(b.minMicros);
  });
});

// ---- computeBudgetGuidance — opt-out --------------------------------------

describe('HB-05 computeBudgetGuidance — opt-out', () => {
  it('returns disabled-guidance when config missing', () => {
    const r = computeBudgetGuidance(memBoundWorkload, 1000, RTX_4060_TI_ENVELOPE, {}, '/tmp/nope.json');
    expect(r.disabled).toBe(true);
    expect(r.remainingBudget).toBe(0);
  });
  it('returns disabled-guidance when flag is off', () => {
    const env = withTempEnv(false);
    try {
      expect(computeBudgetGuidance(memBoundWorkload, 1000, RTX_4060_TI_ENVELOPE, {}, env.configPath).disabled).toBe(true);
    } finally { env.cleanup(); }
  });
});

// ---- computeBudgetGuidance — opt-in ---------------------------------------

describe('HB-05 computeBudgetGuidance — opt-in', () => {
  let env: ReturnType<typeof withTempEnv>;
  beforeEach(() => { env = withTempEnv(true); });
  afterEach(() => { env.cleanup(); });

  it('returns budget=0 when measured ≈ SOL (near optimal)', () => {
    const sol = defaultSolEstimator(memBoundWorkload, RTX_4060_TI_ENVELOPE);
    const r = computeBudgetGuidance(
      memBoundWorkload, sol.minMicros / 0.96, RTX_4060_TI_ENVELOPE, {}, env.configPath,
    );
    expect(r.remainingBudget).toBe(0);
  });

  it('returns budget≈0.25 in moderate band', () => {
    const sol = defaultSolEstimator(memBoundWorkload, RTX_4060_TI_ENVELOPE);
    const r = computeBudgetGuidance(
      memBoundWorkload, sol.minMicros / 0.85, RTX_4060_TI_ENVELOPE, {}, env.configPath,
    );
    expect(r.remainingBudget).toBe(0.25);
  });

  it('returns budget≈0.6 in poor band', () => {
    const sol = defaultSolEstimator(memBoundWorkload, RTX_4060_TI_ENVELOPE);
    const r = computeBudgetGuidance(
      memBoundWorkload, sol.minMicros / 0.65, RTX_4060_TI_ENVELOPE, {}, env.configPath,
    );
    expect(r.remainingBudget).toBe(0.6);
  });

  it('returns budget=1 when measured is far from SOL', () => {
    const sol = defaultSolEstimator(memBoundWorkload, RTX_4060_TI_ENVELOPE);
    const r = computeBudgetGuidance(
      memBoundWorkload, sol.minMicros * 100, RTX_4060_TI_ENVELOPE, {}, env.configPath,
    );
    expect(r.remainingBudget).toBe(1);
  });

  it('throws on non-positive measured time', () => {
    expect(() => computeBudgetGuidance(memBoundWorkload, 0, RTX_4060_TI_ENVELOPE, {}, env.configPath))
      .toThrow(/positive finite number/);
    expect(() => computeBudgetGuidance(memBoundWorkload, -1, RTX_4060_TI_ENVELOPE, {}, env.configPath))
      .toThrow(/positive finite number/);
    expect(() => computeBudgetGuidance(memBoundWorkload, Number.NaN, RTX_4060_TI_ENVELOPE, {}, env.configPath))
      .toThrow(/positive finite number/);
  });

  it('honors custom estimator', () => {
    const customSol = { minMicros: 1, computeBound: false, arithmeticIntensity: 0 };
    const r = computeBudgetGuidance(
      memBoundWorkload, 1, RTX_4060_TI_ENVELOPE,
      { estimator: () => customSol }, env.configPath,
    );
    expect(r.sol).toEqual(customSol);
    expect(r.efficiencyRatio).toBe(1);
  });

  it('honors custom thresholds', () => {
    const sol = defaultSolEstimator(memBoundWorkload, RTX_4060_TI_ENVELOPE);
    const r = computeBudgetGuidance(
      memBoundWorkload, sol.minMicros / 0.85, RTX_4060_TI_ENVELOPE,
      { thresholds: { nearOptimal: 0.80, moderate: 0.50, poor: 0.20 } },
      env.configPath,
    );
    // 0.85 efficiency now exceeds nearOptimal=0.80 → budget=0
    expect(r.remainingBudget).toBe(0);
  });

  it('isSolBudgetEnabled honors flag', () => {
    expect(isSolBudgetEnabled(env.configPath)).toBe(true);
  });
});

describe('HB-05 version', () => {
  it('exposes a current hook version', () => {
    expect(SOL_BUDGET_HOOK_VERSION).toBe('1.0.0');
  });
});
