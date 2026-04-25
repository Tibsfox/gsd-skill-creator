/**
 * Rumor Delay Model — Stochastic Delayed Differential Equation (SDDE) solver.
 *
 * Implements the Euler-Maruyama scheme for the four-compartment SDDE model
 * introduced by Alyami, Hamadouche, and Hussain (arXiv:2604.17368, §2):
 *
 *   dS = [-β·S(t-τ)·R(t) + μ·(N-S)] dt + σ₁·S dW₁
 *   dR = [β·S(t-τ)·R(t) - (γ+δ)·R] dt + σ₂·R dW₂
 *   dA = [δ·R - α·A] dt
 *   dF = [α·A - μ·F] dt
 *
 * where τ is the fact-checking delay, β is the transmission rate, γ is the
 * rumor-cessation rate, δ is the awareness rate, α is the fact-checking rate,
 * μ is the population turnover rate, and W₁, W₂ are independent Wiener processes.
 *
 * The basic reproduction number R₀ = β / (γ + δ) determines stability:
 *   - R₀ < 1: rumor-free equilibrium almost-surely exponentially stable
 *   - R₀ > 1: rumor persists with positive probability
 *
 * ## Implementation details
 *
 * ### Euler-Maruyama scheme with delay buffer
 * The delay term S(t-τ) is approximated by maintaining a circular buffer of
 * past S values. The delay buffer length is `Math.ceil(tau / dt)` steps;
 * if the history is shorter than τ/dt, the initial S₀ value is used as the
 * delayed value (consistent with constant prehistory assumption, standard
 * for SDDE initial-value problems).
 *
 * ### Box-Muller normal sampling
 * Gaussian noise is generated in plain TypeScript using the Box-Muller
 * transform. No external SDE library is used (constraint: zero new deps).
 *
 * ### Non-negativity clamping
 * After each Euler step all compartment values are clamped to [0, N].
 * This is standard practice for population-count SDEs (prevents
 * negative population artifacts from large noise steps).
 *
 * ### PRNG seeding
 * A linear-congruential PRNG (LCG with period 2^32, Knuth constants) is used
 * for reproducibility. Callers pass an integer seed; different seeds produce
 * statistically independent trajectories (SDE noise injection test requires this).
 *
 * ## Reference
 *
 * Alyami, Hamadouche, Hussain. "Stochastic Delayed Dynamics of Rumor
 * Propagation with Awareness and Fact-Checking." arXiv:2604.17368, 2026.
 * Cross-reference: module_7.tex §7.2 (Rumor Propagation Flagship),
 * m7-capcom-revision.tex §4 (SENTINEL/ANALYST Misinfo Handling).
 *
 * @module rumor-delay-model/sdde-solver
 */

import type { SDDEParameters, PropagationNetwork, PropagationTrajectory, TrajectoryStep } from './types.js';

// ---------------------------------------------------------------------------
// PRNG — Linear Congruential Generator (Knuth constants, period 2^32)
// ---------------------------------------------------------------------------

/** A simple seedable PRNG state. */
interface LcgState {
  seed: number;
}

/** Returns a uniform sample in [0, 1) and advances the state in-place. */
function lcgNext(state: LcgState): number {
  // Knuth multiplicative hash: a=1664525, c=1013904223, m=2^32
  state.seed = ((state.seed * 1664525 + 1013904223) >>> 0);
  return state.seed / 4294967296;
}

/**
 * Box-Muller transform: produces two independent N(0,1) samples from two
 * uniform samples. Returns the first; the second is discarded (calling code
 * calls this twice when two independent normals are needed, which is fine
 * given the small performance envelope of this reference implementation).
 *
 * Avoids log(0) by clamping u1 away from zero.
 */
function boxMullerNormal(state: LcgState): number {
  let u1 = lcgNext(state);
  const u2 = lcgNext(state);
  // Clamp u1 strictly away from zero to avoid log(0)
  if (u1 === 0) u1 = Number.EPSILON;
  const mag = Math.sqrt(-2.0 * Math.log(u1));
  return mag * Math.cos(2.0 * Math.PI * u2);
}

// ---------------------------------------------------------------------------
// Solver configuration
// ---------------------------------------------------------------------------

/**
 * Configuration for a single SDDE solver run.
 */
export interface SDDESolverConfig {
  /**
   * Simulation duration in time units (e.g. days).
   * Default: 100.
   */
  duration: number;

  /**
   * Euler-Maruyama step size dt.
   * Must be strictly positive. Smaller dt → more accurate but slower.
   * Default: 0.1. Must satisfy dt < τ for the delay buffer to be meaningful.
   */
  dt: number;

  /**
   * Initial rumorist seed count R(0). Default: 1 (single spreader).
   */
  initialRumorists: number;

  /**
   * Integer PRNG seed for reproducibility. Default: 42.
   */
  seed: number;
}

export const DEFAULT_SDDE_SOLVER_CONFIG: SDDESolverConfig = {
  duration: 100,
  dt: 0.1,
  initialRumorists: 1,
  seed: 42,
};

// ---------------------------------------------------------------------------
// Public solver API
// ---------------------------------------------------------------------------

/**
 * Run the Euler-Maruyama SDDE solver and return the full trajectory.
 *
 * @param params   SDDE parameters (β, γ, δ, α, μ, τ, σ₁, σ₂, N)
 * @param network  Propagation network (supplies connectivity factor on β)
 * @param config   Solver configuration (duration, dt, seed)
 * @param rumorId  ID of the seeding Rumor (carried into trajectory)
 * @returns        Full PropagationTrajectory including all time steps
 */
export function runSDDESolver(
  params: SDDEParameters,
  network: PropagationNetwork,
  config: Partial<SDDESolverConfig> = {},
  rumorId = 'unknown',
): PropagationTrajectory {
  const cfg: SDDESolverConfig = { ...DEFAULT_SDDE_SOLVER_CONFIG, ...config };

  // Effective transmission rate adjusted for network connectivity
  const betaEff = params.beta * network.connectivityFactor;

  // Computed R₀
  const R0 = betaEff / (params.gamma + params.delta);

  const N = params.N;
  const { tau, gamma, delta, alpha, mu, sigma1, sigma2 } = params;
  const { dt, duration, initialRumorists, seed } = cfg;

  const numSteps = Math.ceil(duration / dt);
  const delaySteps = Math.max(1, Math.round(tau / dt));

  // PRNG state
  const prng: LcgState = { seed: seed >>> 0 };

  // Initial conditions
  const R0_init = Math.min(initialRumorists, N);
  const S0 = N - R0_init;

  // Compartment state (mutable during simulation)
  let S = S0;
  let R = R0_init;
  let A = 0;
  let F = 0;

  // Delay buffer for S: circular buffer of length delaySteps + 1
  // delayBuffer[i] = S at step (currentStep - delaySteps)
  const delayBuffer: Float64Array = new Float64Array(delaySteps + 1).fill(S0);
  let bufHead = 0; // index of the oldest entry (= S(t-τ))

  // Result storage
  const steps: TrajectoryStep[] = [];
  steps.push({ t: 0, S, R, A, F });

  let peakR = R;
  let peakIdx = 0;

  for (let i = 1; i <= numSteps; i++) {
    const t = i * dt;

    // S(t-τ): oldest entry in the circular buffer
    const S_delayed = delayBuffer[bufHead];

    // Wiener increments: dWk ~ N(0, dt) = sqrt(dt) * N(0,1)
    const sqrtDt = Math.sqrt(dt);
    const dW1 = boxMullerNormal(prng) * sqrtDt;
    const dW2 = boxMullerNormal(prng) * sqrtDt;

    // Euler-Maruyama increments
    const dS =
      (-betaEff * S_delayed * R + mu * (N - S)) * dt
      + sigma1 * S * dW1;

    const dR =
      (betaEff * S_delayed * R - (gamma + delta) * R) * dt
      + sigma2 * R * dW2;

    const dA = (delta * R - alpha * A) * dt;
    const dF = (alpha * A - mu * F) * dt;

    // Update compartments and clamp to [0, N]
    S = Math.max(0, Math.min(N, S + dS));
    R = Math.max(0, Math.min(N, R + dR));
    A = Math.max(0, Math.min(N, A + dA));
    F = Math.max(0, Math.min(N, F + dF));

    // Advance delay buffer: write new S into the head slot, then advance head
    delayBuffer[bufHead] = S;
    bufHead = (bufHead + 1) % (delaySteps + 1);

    // Record step (thin-out for large runs to avoid huge arrays; record every step)
    steps.push({ t, S, R, A, F });

    // Track peak rumorists
    if (R > peakR) {
      peakR = R;
      peakIdx = i;
    }
  }

  return {
    rumorId,
    networkName: network.name,
    parameters: params,
    steps,
    R0,
    peakRumoristStepIndex: peakIdx,
    peakRumoristValue: peakR,
    seed,
    simulatedAt: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Convenience: compute R₀ from SDDE parameters
// ---------------------------------------------------------------------------

/**
 * Compute the basic reproduction number R₀ = β / (γ + δ).
 *
 * R₀ < 1: rumor-free equilibrium almost-surely exponentially stable.
 * R₀ > 1: rumor persists with positive probability.
 *
 * (Alyami et al. arXiv:2604.17368, Theorem 2.1 and §3 stability analysis.)
 */
export function computeR0(params: Pick<SDDEParameters, 'beta' | 'gamma' | 'delta'>): number {
  return params.beta / (params.gamma + params.delta);
}
