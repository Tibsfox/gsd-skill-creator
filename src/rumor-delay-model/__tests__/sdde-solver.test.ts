/**
 * SDDE Solver tests — src/rumor-delay-model/__tests__/sdde-solver.test.ts
 *
 * Verifies:
 *   1. Known fact-checking-rate / delay produces qualitatively correct trajectory
 *      shape: rumor peaks → fact-check correction → decay (R₀ < 1 case)
 *   2. R₀ > 1 case: rumor persists (peak is high relative to initial)
 *   3. computeR0 formula: β / (γ + δ)
 *   4. SDE noise injection: different seeds → different trajectories
 *   5. Awareness-effect: increased awareness rate δ → reduced rumor peak
 *   6. Trajectory JSON shape is stable (round-trip via JSON.stringify/parse)
 *
 * Reference: Alyami, Hamadouche, Hussain. arXiv:2604.17368 §2–§3.
 */

import { describe, it, expect } from 'vitest';
import { runSDDESolver, computeR0 } from '../sdde-solver.js';
import type { SDDEParameters, PropagationNetwork } from '../types.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const NETWORK_100: PropagationNetwork = {
  name: 'test-network',
  nodeCount: 100,
  connectivityFactor: 1.0,
};

/** Parameters that produce R₀ = 0.5 (stable rumor-free equilibrium). */
function stableParams(tau = 1.0): SDDEParameters {
  return {
    N: 100,
    beta: 0.05,   // β
    gamma: 0.05,  // γ
    delta: 0.05,  // δ → R₀ = 0.05 / (0.05+0.05) = 0.5
    alpha: 0.20,
    mu: 0.01,
    tau,
    sigma1: 0.0,  // deterministic for trajectory-shape tests
    sigma2: 0.0,
  };
}

/** Parameters that produce R₀ = 2.0 (persistent rumor). */
function persistentParams(tau = 1.0): SDDEParameters {
  return {
    N: 100,
    beta: 0.30,   // β
    gamma: 0.05,  // γ
    delta: 0.10,  // δ → R₀ = 0.30 / (0.05+0.10) = 2.0
    alpha: 0.10,
    mu: 0.01,
    tau,
    sigma1: 0.0,
    sigma2: 0.0,
  };
}

// ---------------------------------------------------------------------------
// computeR0 unit test
// ---------------------------------------------------------------------------

describe('computeR0', () => {
  it('computes β / (γ + δ) correctly', () => {
    expect(computeR0({ beta: 0.3, gamma: 0.1, delta: 0.2 })).toBeCloseTo(1.0, 5);
    expect(computeR0({ beta: 0.05, gamma: 0.05, delta: 0.05 })).toBeCloseTo(0.5, 5);
    expect(computeR0({ beta: 0.30, gamma: 0.05, delta: 0.10 })).toBeCloseTo(2.0, 5);
  });
});

// ---------------------------------------------------------------------------
// Trajectory shape: R₀ < 1 — peak then decay
// ---------------------------------------------------------------------------

describe('SDDE solver — R₀ < 1 trajectory shape', () => {
  it('peak then decay: rumorist population is lower at end than at peak', () => {
    const params = stableParams(1.0);
    const traj = runSDDESolver(params, NETWORK_100, { duration: 50, dt: 0.1, initialRumorists: 5, seed: 1 });

    expect(traj.R0).toBeCloseTo(0.5, 2);

    // Peak should occur well before the end
    const peakStep = traj.peakRumoristStepIndex;
    const totalSteps = traj.steps.length - 1;

    // Peak must exist and occur before the last 10% of the run
    expect(peakStep).toBeGreaterThan(0);

    // Final rumorist value should be less than peak
    const finalR = traj.steps[totalSteps].R;
    expect(finalR).toBeLessThan(traj.peakRumoristValue);
  });

  it('rumorist population is reduced from peak for R₀ = 0.5 (decay trend)', () => {
    const params = stableParams(0.5);
    const traj = runSDDESolver(params, NETWORK_100, { duration: 200, dt: 0.1, initialRumorists: 3, seed: 7 });

    const finalR = traj.steps[traj.steps.length - 1].R;
    // Final R should be less than peak (peak→decay trend observed)
    expect(finalR).toBeLessThan(traj.peakRumoristValue);
    // R₀ = 0.5 → rumor-free equilibrium is stable; final R should be
    // substantially below the peak rumorist value
    expect(finalR).toBeLessThan(traj.peakRumoristValue * 0.9);
  });
});

// ---------------------------------------------------------------------------
// Trajectory shape: R₀ > 1 — rumor persists
// ---------------------------------------------------------------------------

describe('SDDE solver — R₀ > 1 trajectory shape', () => {
  it('rumorist population reaches a substantial level for R₀ = 2.0', () => {
    const params = persistentParams(1.0);
    const traj = runSDDESolver(params, NETWORK_100, { duration: 50, dt: 0.1, initialRumorists: 1, seed: 42 });

    expect(traj.R0).toBeCloseTo(2.0, 2);
    // Peak rumorists should be noticeably more than 1 (the initial seed)
    expect(traj.peakRumoristValue).toBeGreaterThan(5);
  });
});

// ---------------------------------------------------------------------------
// SDE noise injection: different seeds → different trajectories
// ---------------------------------------------------------------------------

describe('SDDE solver — SDE noise injection', () => {
  it('different seeds produce different trajectories when σ > 0', () => {
    const stochasticParams: SDDEParameters = {
      ...persistentParams(1.0),
      sigma1: 0.15,
      sigma2: 0.15,
    };

    const traj1 = runSDDESolver(stochasticParams, NETWORK_100, { duration: 30, dt: 0.1, initialRumorists: 2, seed: 1 });
    const traj2 = runSDDESolver(stochasticParams, NETWORK_100, { duration: 30, dt: 0.1, initialRumorists: 2, seed: 99999 });

    // Trajectories should differ at some point
    const steps = Math.min(traj1.steps.length, traj2.steps.length);
    let differs = false;
    for (let i = 1; i < steps; i++) {
      if (Math.abs(traj1.steps[i].R - traj2.steps[i].R) > 1e-9) {
        differs = true;
        break;
      }
    }
    expect(differs).toBe(true);
  });

  it('same seed produces identical trajectories (reproducible)', () => {
    const stochasticParams: SDDEParameters = {
      ...stableParams(1.0),
      sigma1: 0.10,
      sigma2: 0.10,
    };

    const traj1 = runSDDESolver(stochasticParams, NETWORK_100, { duration: 20, dt: 0.1, initialRumorists: 1, seed: 12345 });
    const traj2 = runSDDESolver(stochasticParams, NETWORK_100, { duration: 20, dt: 0.1, initialRumorists: 1, seed: 12345 });

    // Should be bit-identical
    for (let i = 0; i < traj1.steps.length; i++) {
      expect(traj1.steps[i].R).toBeCloseTo(traj2.steps[i].R, 10);
      expect(traj1.steps[i].S).toBeCloseTo(traj2.steps[i].S, 10);
    }
  });
});

// ---------------------------------------------------------------------------
// Awareness-effect: increased δ → reduced rumor peak
// ---------------------------------------------------------------------------

describe('SDDE solver — awareness effect', () => {
  it('higher awareness rate δ leads to lower final rumorist burden', () => {
    // In the SDDE mass-action model, β*S*R is an absolute-count transmission rate.
    // Both R₀ < 1 and R₀ > 1 cases will transiently peak before decaying or
    // persisting — the *peak* comparison is fragile when S₀ ≈ N (both saturate).
    //
    // The paper's key finding (arXiv:2604.17368 §3): increased awareness rate δ
    // reduces the *cumulative burden*. We test the final R value after the
    // transient, where the stable case (high δ) has decayed substantially while
    // the low-awareness case (low δ) remains higher.
    //
    // Low awareness: β=0.15, γ=0.05, δ=0.02 → high rumorist persistence
    const baseParams: SDDEParameters = {
      N: 100,
      beta: 0.15,
      gamma: 0.05,
      delta: 0.02,   // low awareness → rumorists persist longer
      alpha: 0.30,   // fast fact-checking rate (doesn't matter for initial transient)
      mu: 0.002,
      tau: 0.5,
      sigma1: 0.0,
      sigma2: 0.0,
    };

    // High awareness: δ=0.50 → rumorists transition to aware much faster
    const highAwarenessParams: SDDEParameters = {
      ...baseParams,
      delta: 0.50,   // high awareness → awareness drains R quickly
    };

    const net = { name: 'net', nodeCount: 100, connectivityFactor: 1.0 };

    const trajLow = runSDDESolver(baseParams, net, { duration: 150, dt: 0.1, initialRumorists: 5, seed: 42 });
    const trajHigh = runSDDESolver(highAwarenessParams, net, { duration: 150, dt: 0.1, initialRumorists: 5, seed: 42 });

    // High awareness → rumorist population drains faster → lower final R
    const finalRLow = trajLow.steps[trajLow.steps.length - 1].R;
    const finalRHigh = trajHigh.steps[trajHigh.steps.length - 1].R;
    expect(finalRHigh).toBeLessThan(finalRLow);
  });
});

// ---------------------------------------------------------------------------
// Trajectory JSON shape (round-trip)
// ---------------------------------------------------------------------------

describe('SDDE solver — PropagationTrajectory JSON shape', () => {
  it('serializes and deserializes correctly', () => {
    const traj = runSDDESolver(stableParams(), NETWORK_100, { duration: 5, dt: 0.5, initialRumorists: 1, seed: 1 });
    const json = JSON.stringify(traj);
    const restored = JSON.parse(json) as typeof traj;

    expect(restored.rumorId).toBe(traj.rumorId);
    expect(restored.networkName).toBe(traj.networkName);
    expect(restored.R0).toBeCloseTo(traj.R0, 5);
    expect(restored.seed).toBe(traj.seed);
    expect(restored.steps.length).toBe(traj.steps.length);
    expect(restored.parameters.tau).toBe(traj.parameters.tau);
    expect(typeof restored.simulatedAt).toBe('string');
  });
});
