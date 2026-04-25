/**
 * Rumor Delay Model — public API (UIP-22, Phase 774, T3b).
 *
 * Stochastic-delayed-dynamics model for upstream-intelligence-pack
 * signal-vs-hype separation per Alyami, Hamadouche, and Hussain
 * (arXiv:2604.17368, "Stochastic Delayed Dynamics of Rumor Propagation
 * with Awareness and Fact-Checking").
 *
 * The module models the time delay τ between rumor introduction and
 * fact-checking effect (the central SDDE parameter), applied to the
 * SENTINEL/ANALYST upstream-intelligence pipeline for structured
 * misinfo-handling as specified in:
 *
 *   - module_7.tex §7.2 (Stochastic Rumor Propagation Flagship)
 *   - m7-capcom-revision.tex §4 (SENTINEL/ANALYST Misinfo Handling)
 *
 * ## Mathematical model (arXiv:2604.17368 §2)
 *
 * Four-compartment SDDE (S=susceptible, R=rumorist, A=aware, F=fact-checker):
 *
 *   dS = [-β·S(t-τ)·R(t) + μ·(N-S)] dt + σ₁·S dW₁
 *   dR = [β·S(t-τ)·R(t) - (γ+δ)·R] dt + σ₂·R dW₂
 *   dA = [δ·R - α·A] dt
 *   dF = [α·A - μ·F] dt
 *
 * Stability: R₀ = β/(γ+δ). R₀ < 1 → rumor-free equilibrium a.s. exponentially
 * stable. R₀ > 1 → rumor persists. Larger τ → higher peak rumorist population.
 *
 * ## Opt-in mechanism
 *
 * This module is **default-OFF**. Opt in via `.claude/gsd-skill-creator.json`:
 *
 * ```json
 * {
 *   "gsd-skill-creator": {
 *     "upstream-intelligence": {
 *       "rumor-delay-model": { "enabled": true }
 *     }
 *   }
 * }
 * ```
 *
 * With the flag absent or false:
 *   - `simulatePropagation` still runs the solver (it is a pure compute function),
 *     but the SENTINEL/ANALYST hook returns byte-identical passthrough
 *     `{ disabled: true, classification: 'unknown' }`.
 *   - `analyzeSignalVsHype` returns `{ classification: 'unknown', disabled: true }`.
 *   - `classifyClaimStream` returns all claims with verdict='pass-through'.
 *
 * ## Explicit non-goals
 *
 * This module DOES NOT:
 *   - import from or modify src/orchestration/, src/capcom/, or src/dacp/
 *   - touch any existing production code path
 *   - modify CAPCOM-gate authority surfaces
 *   - call any external network or I/O beyond the settings file
 *
 * Reference implementation only — no calls from production code paths.
 *
 * @module rumor-delay-model
 */

// ---------------------------------------------------------------------------
// Types (re-exported)
// ---------------------------------------------------------------------------
export type {
  SDDEParameters,
  PropagationNetwork,
  Rumor,
  SignalObservation,
  SignalClassification,
  PropagationTrajectory,
  TrajectoryStep,
} from './types.js';

// ---------------------------------------------------------------------------
// Settings (re-exported)
// ---------------------------------------------------------------------------
export type { RumorDelayModelConfig } from './settings.js';
export {
  DEFAULT_RUMOR_DELAY_MODEL_CONFIG,
  isRumorDelayModelEnabled,
  readRumorDelayModelConfig,
} from './settings.js';

// ---------------------------------------------------------------------------
// Solver internals (re-exported for testing)
// ---------------------------------------------------------------------------
export type { SDDESolverConfig } from './sdde-solver.js';
export {
  DEFAULT_SDDE_SOLVER_CONFIG,
  runSDDESolver,
  computeR0,
} from './sdde-solver.js';

// ---------------------------------------------------------------------------
// SENTINEL/ANALYST hook (re-exported)
// ---------------------------------------------------------------------------
export type { ClaimAssessment, StreamClassificationResult } from './sentinel-analyst-hook.js';
export { classifyClaimStream } from './sentinel-analyst-hook.js';

// ---------------------------------------------------------------------------
// Top-level public API functions
// ---------------------------------------------------------------------------

import type {
  Rumor,
  PropagationNetwork,
  PropagationTrajectory,
  SignalObservation,
  SignalClassification,
} from './types.js';
import { runSDDESolver } from './sdde-solver.js';
import { isRumorDelayModelEnabled } from './settings.js';

/**
 * Simulate rumor propagation through a network with a given fact-checking delay.
 *
 * Uses the Euler-Maruyama SDDE solver (arXiv:2604.17368 §2) with default
 * SDDE parameters appropriate for the given rumor's influence score.
 *
 * The `factCheckingDelay` parameter maps directly to τ (the delay in
 * simulation time units). Larger τ → higher peak rumorist population →
 * longer recovery time (paper's Theorem 2.2, monotonic relationship).
 *
 * **Note:** `simulatePropagation` always runs the solver (it is a pure compute
 * function). The feature flag gates the SENTINEL/ANALYST hook, not this function.
 *
 * @param rumor             The rumor/claim to propagate.
 * @param network           The propagation network.
 * @param factCheckingDelay τ in simulation time units (e.g. days). Must be > 0.
 * @param seed              PRNG seed for reproducibility. Default: 42.
 * @returns                 Full PropagationTrajectory.
 */
export function simulatePropagation(
  rumor: Rumor,
  network: PropagationNetwork,
  factCheckingDelay: number,
  seed = 42,
): PropagationTrajectory {
  // Derive SDDE parameters from the rumor's influence score.
  // β is scaled by influenceScore to make high-influence rumors spread faster.
  const beta = Math.max(0.05, Math.min(2.0, rumor.influenceScore * 0.3));

  const params = {
    N: network.nodeCount,
    beta,
    gamma: 0.05,    // rumor-cessation rate
    delta: 0.10,    // awareness rate
    alpha: 0.20,    // fact-checking rate (higher than gamma+delta to ensure eventual decay)
    mu: 0.01,       // population turnover
    tau: Math.max(0.01, factCheckingDelay),
    sigma1: 0.05,   // noise on susceptible dynamics
    sigma2: 0.05,   // noise on rumorist dynamics
  };

  return runSDDESolver(params, network, { seed }, rumor.id);
}

/**
 * Analyze a stream of signal observations to classify them as 'signal' or 'hype'.
 *
 * When the feature flag is off, returns `{ classification: 'unknown', disabled: true }`.
 *
 * @param observations   Stream of rumorist-fraction observations over time.
 * @param settingsPath   Optional override for the settings file path.
 * @returns              SignalClassification with optional R₀ estimate.
 */
export function analyzeSignalVsHype(
  observations: ReadonlyArray<SignalObservation>,
  settingsPath?: string,
): SignalClassification {
  const enabled = isRumorDelayModelEnabled(settingsPath);
  if (!enabled) {
    return { classification: 'unknown', disabled: true };
  }

  if (observations.length < 3) {
    return { classification: 'unknown' };
  }

  // Find peak rumorist fraction
  let peak = 0;
  for (const obs of observations) {
    if (obs.rumoristFraction > peak) peak = obs.rumoristFraction;
  }

  if (peak === 0) {
    return { classification: 'signal', estimatedR0: 0, peakRumoristFraction: 0 };
  }

  // Last observation
  const last = observations[observations.length - 1];
  const finalFraction = last.rumoristFraction / peak;

  // Qualitative heuristic from arXiv:2604.17368 §3 stability analysis:
  // - Decay (finalFraction < 0.5 of peak) → consistent with R₀ < 1 stable regime
  // - Sustained (finalFraction ≥ 0.5 of peak) → consistent with R₀ > 1 persistence
  const estimatedR0 = finalFraction >= 0.5 ? 1.2 : 0.7;
  const classification: 'signal' | 'hype' = finalFraction >= 0.5 ? 'hype' : 'signal';

  return {
    classification,
    estimatedR0,
    peakRumoristFraction: peak,
  };
}
