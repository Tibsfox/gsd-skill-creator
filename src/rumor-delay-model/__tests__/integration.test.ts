/**
 * Rumor Delay Model — integration tests.
 *
 * Tests the full public API (index.ts) end-to-end:
 *   1. Default-off passthrough via analyzeSignalVsHype
 *   2. simulatePropagation: produces correct trajectory shape (always runs)
 *   3. analyzeSignalVsHype: disabled → unknown, enabled → signal/hype
 *   4. Round-trip PropagationTrajectory JSON shape
 *   5. classifyClaimStream (via index re-export) — flag off → disabled
 *   6. Settings reader defaults to false on missing config
 *
 * Reference: arXiv:2604.17368 (Alyami, Hamadouche, Hussain).
 * Cross-reference: m7-capcom-revision.tex §4, module_7.tex §7.2.
 */

import { describe, it, expect, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  simulatePropagation,
  analyzeSignalVsHype,
  classifyClaimStream,
  isRumorDelayModelEnabled,
  readRumorDelayModelConfig,
  computeR0,
} from '../index.js';
import type { Rumor, PropagationNetwork, SignalObservation } from '../types.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const tmpFiles: string[] = [];

function writeTmpConfig(content: unknown): string {
  const p = path.join(
    os.tmpdir(),
    `rdm-integ-${Date.now()}-${Math.random().toString(36).slice(2)}.json`,
  );
  fs.writeFileSync(p, JSON.stringify(content));
  tmpFiles.push(p);
  return p;
}

afterEach(() => {
  for (const f of tmpFiles.splice(0)) {
    try { fs.unlinkSync(f); } catch { /* ignore */ }
  }
});

function enabledConfig() {
  return {
    'gsd-skill-creator': {
      'upstream-intelligence': {
        'rumor-delay-model': { enabled: true },
      },
    },
  };
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const testRumor: Rumor = {
  id: 'integ-rumor-1',
  description: 'Integration test claim',
  influenceScore: 1.5,
};

const testNetwork: PropagationNetwork = {
  name: 'integ-test-network',
  nodeCount: 200,
  connectivityFactor: 1.0,
};

// ---------------------------------------------------------------------------
// Settings reader
// ---------------------------------------------------------------------------

describe('integration — settings reader', () => {
  it('returns enabled:false for nonexistent config', () => {
    const cfg = readRumorDelayModelConfig('/no/such/path.json');
    expect(cfg.enabled).toBe(false);
    expect(cfg.influenceThreshold).toBe(1.0);
    expect(cfg.noiseToleranceSigma).toBe(2.0);
  });

  it('isRumorDelayModelEnabled returns false for missing path', () => {
    expect(isRumorDelayModelEnabled('/no/such/path.json')).toBe(false);
  });

  it('isRumorDelayModelEnabled returns true for enabled config', () => {
    const p = writeTmpConfig(enabledConfig());
    expect(isRumorDelayModelEnabled(p)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// simulatePropagation: always runs (not gated by flag)
// ---------------------------------------------------------------------------

describe('integration — simulatePropagation', () => {
  it('produces a trajectory with correct rumorId and networkName', () => {
    const traj = simulatePropagation(testRumor, testNetwork, 1.0);
    expect(traj.rumorId).toBe('integ-rumor-1');
    expect(traj.networkName).toBe('integ-test-network');
    expect(traj.steps.length).toBeGreaterThan(0);
    expect(traj.R0).toBeGreaterThan(0);
  });

  it('larger factCheckingDelay → higher peak rumorist value', () => {
    const shortDelay = simulatePropagation(testRumor, testNetwork, 0.5, 42);
    const longDelay = simulatePropagation(testRumor, testNetwork, 5.0, 42);
    expect(longDelay.peakRumoristValue).toBeGreaterThanOrEqual(shortDelay.peakRumoristValue);
  });

  it('trajectory JSON round-trip preserves shape', () => {
    const traj = simulatePropagation(testRumor, testNetwork, 1.0, 7);
    const json = JSON.stringify(traj);
    const restored = JSON.parse(json) as typeof traj;

    expect(restored.rumorId).toBe(traj.rumorId);
    expect(restored.networkName).toBe(traj.networkName);
    expect(restored.R0).toBeCloseTo(traj.R0, 5);
    expect(restored.seed).toBe(traj.seed);
    expect(restored.steps.length).toBe(traj.steps.length);
    expect(typeof restored.simulatedAt).toBe('string');
    expect(restored.parameters.tau).toBe(traj.parameters.tau);
  });
});

// ---------------------------------------------------------------------------
// analyzeSignalVsHype: gated by flag
// ---------------------------------------------------------------------------

describe('integration — analyzeSignalVsHype', () => {
  it('flag off → { classification: unknown, disabled: true }', () => {
    const result = analyzeSignalVsHype([], '/no/such/path.json');
    expect(result.classification).toBe('unknown');
    expect(result.disabled).toBe(true);
  });

  it('flag on + decaying observations → signal', () => {
    const p = writeTmpConfig(enabledConfig());
    const observations: SignalObservation[] = [
      { t: 0, rumoristFraction: 0.05, factCheckerFraction: 0 },
      { t: 1, rumoristFraction: 0.20, factCheckerFraction: 0.01 },
      { t: 2, rumoristFraction: 0.15, factCheckerFraction: 0.05 },
      { t: 3, rumoristFraction: 0.08, factCheckerFraction: 0.10 },
      { t: 4, rumoristFraction: 0.03, factCheckerFraction: 0.15 },
    ];
    const result = analyzeSignalVsHype(observations, p);
    expect(result.classification).toBe('signal');
    expect(result.disabled).toBeUndefined();
    expect(result.estimatedR0).toBeDefined();
    expect((result.estimatedR0 as number)).toBeLessThan(1.0);
  });

  it('flag on + sustained observations → hype', () => {
    const p = writeTmpConfig(enabledConfig());
    const observations: SignalObservation[] = [
      { t: 0, rumoristFraction: 0.10, factCheckerFraction: 0 },
      { t: 1, rumoristFraction: 0.25, factCheckerFraction: 0.01 },
      { t: 2, rumoristFraction: 0.40, factCheckerFraction: 0.01 },
      { t: 3, rumoristFraction: 0.50, factCheckerFraction: 0.02 },
      { t: 4, rumoristFraction: 0.48, factCheckerFraction: 0.02 },
    ];
    const result = analyzeSignalVsHype(observations, p);
    expect(result.classification).toBe('hype');
    expect((result.estimatedR0 as number)).toBeGreaterThan(1.0);
  });
});

// ---------------------------------------------------------------------------
// classifyClaimStream (re-exported from index)
// ---------------------------------------------------------------------------

describe('integration — classifyClaimStream via index', () => {
  it('flag off → all claims pass-through, disabled:true aggregate', () => {
    const rumor: Rumor = { id: 'r1', description: 'test', influenceScore: 0.5 };
    const result = classifyClaimStream([rumor], [], Date.now(), 86400000, '/no/such/path.json');
    expect(result.disabled).toBe(true);
    expect(result.aggregate.classification).toBe('unknown');
    expect(result.assessments[0].verdict).toBe('pass-through');
  });
});

// ---------------------------------------------------------------------------
// computeR0 (re-exported from index)
// ---------------------------------------------------------------------------

describe('integration — computeR0 via index', () => {
  it('computes β/(γ+δ) correctly', () => {
    expect(computeR0({ beta: 0.3, gamma: 0.1, delta: 0.2 })).toBeCloseTo(1.0, 5);
    expect(computeR0({ beta: 0.5, gamma: 0.1, delta: 0.4 })).toBeCloseTo(1.0, 5);
  });
});
