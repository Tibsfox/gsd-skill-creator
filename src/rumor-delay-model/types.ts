/**
 * Rumor Delay Model — type definitions.
 *
 * Grounded in the Stochastic Delayed Dynamics of Rumor Propagation with
 * Awareness and Fact-Checking formalism by Alyami, Hamadouche, and Hussain
 * (arXiv:2604.17368, math.DS).
 *
 * The paper models four-compartment rumor dynamics (S/R/A/F) with:
 *   - A time delay τ between susceptibility reduction and fact-check effect
 *   - Stochastic Wiener-process noise (σ₁, σ₂) on transmission
 *   - Stability characterised by basic reproduction number R₀ = β/(γ+δ)
 *
 * These types serve the SENTINEL/ANALYST upstream-intelligence pipeline
 * integration defined in m7-capcom-revision.tex §4 (SENTINEL/ANALYST
 * Misinfo Handling) and module_7.tex §7.2 (Rumor Propagation Flagship).
 *
 * All types are pure data. No side effects, no I/O.
 *
 * @module rumor-delay-model/types
 */

// ---------------------------------------------------------------------------
// SDDE Parameters
// ---------------------------------------------------------------------------

/**
 * Parameters for the Stochastic Delayed Differential Equation model.
 *
 * Directly maps to the notation in Alyami et al. arXiv:2604.17368 §2:
 *
 *   dS = [-β·S(t-τ)·R(t) + μ(N-S)] dt + σ₁·S dW₁
 *   dR = [β·S(t-τ)·R(t) - (γ+δ)·R] dt + σ₂·R dW₂
 *   dA = [δ·R - α·A] dt
 *   dF = [α·A - μ·F] dt
 *
 * The basic reproduction number R₀ = β / (γ + δ).
 * Stability threshold: R₀ < 1 → rumor-free equilibrium a.s. exponentially stable.
 */
export interface SDDEParameters {
  /**
   * Population size N (total individuals in the compartment model).
   * Must be a positive integer.
   */
  readonly N: number;

  /**
   * Transmission rate β > 0. Rate at which rumorists infect susceptibles.
   * Maps to claim influence spread rate in SENTINEL context.
   */
  readonly beta: number;

  /**
   * Rumor-cessation rate γ > 0. Rate at which rumorists cease spreading.
   */
  readonly gamma: number;

  /**
   * Awareness rate δ > 0. Rate at which rumorists become aware-but-not-checking.
   */
  readonly delta: number;

  /**
   * Fact-checking rate α > 0. Rate at which aware individuals complete fact-check.
   * Maps to ANALYST claim-verification throughput rate in SENTINEL context.
   */
  readonly alpha: number;

  /**
   * Population turnover rate μ ≥ 0. Background birth/death rate.
   * Governs F-compartment decay (fact-checkers returning to general population).
   */
  readonly mu: number;

  /**
   * Fact-checking delay τ > 0 (in simulation time units).
   * The core SDDE parameter: governs the window of maximum rumor spread before
   * fact-checking takes effect. Larger τ → higher peak spreader population.
   * In SENTINEL context: maps to claim-age threshold (default 24 hours).
   */
  readonly tau: number;

  /**
   * Stochastic noise amplitude on susceptible dynamics σ₁ ≥ 0.
   * Wiener-process coefficient on S compartment (dW₁).
   * Zero → deterministic limit.
   */
  readonly sigma1: number;

  /**
   * Stochastic noise amplitude on rumorist dynamics σ₂ ≥ 0.
   * Wiener-process coefficient on R compartment (dW₂).
   * Zero → deterministic limit.
   */
  readonly sigma2: number;
}

// ---------------------------------------------------------------------------
// Propagation Network
// ---------------------------------------------------------------------------

/**
 * Abstract propagation network over which a rumor spreads.
 *
 * In the SDDE framework the network topology influences the effective β.
 * The `connectivityFactor` multiplies β to yield the effective transmission
 * rate for a given network density (1.0 = fully connected mean-field, the
 * paper's assumption; < 1.0 models sparse real-world topologies).
 */
export interface PropagationNetwork {
  /**
   * Human-readable name for this network (e.g. 'SENTINEL-stream',
   * 'arXiv-daily-feed', 'synthetic-test-network').
   */
  readonly name: string;

  /**
   * Expected number of nodes / participants N. Must match SDDEParameters.N
   * in practice; carried here for documentation.
   */
  readonly nodeCount: number;

  /**
   * Effective connectivity factor in (0, 1]. Multiplied against β.
   * Default 1.0 (fully-connected mean-field, as in arXiv:2604.17368).
   */
  readonly connectivityFactor: number;
}

// ---------------------------------------------------------------------------
// Rumor
// ---------------------------------------------------------------------------

/**
 * A rumor (or claim) to be propagated through the network.
 *
 * Maps to an information claim entering the SENTINEL ingestion pipeline.
 * The `influenceScore` is the ρ analogue of R₀ for a single claim:
 * high-influence claims (ρ > ρ*) enter the expedited fact-check queue per
 * m7-capcom-revision.tex §4 Influence Threshold Gate.
 */
export interface Rumor {
  /** Unique identifier for this rumor/claim. */
  readonly id: string;

  /**
   * Human-readable description (e.g. arxiv claim, project-state assertion).
   */
  readonly description: string;

  /**
   * Influence score ρ ∈ [0, ∞). Analogous to R₀ for a single claim.
   * ρ > 1.0 (default ρ* threshold) → expedited verification in SENTINEL.
   * Derived from citation count, source authority, linguistic confidence.
   */
  readonly influenceScore: number;

  /**
   * Submission timestamp (Unix ms). Used to compute claim age for τ gate.
   * When absent the simulation uses t=0 as origin.
   */
  readonly submittedAtMs?: number;
}

// ---------------------------------------------------------------------------
// Signal Observation
// ---------------------------------------------------------------------------

/**
 * An observation of a propagating signal, sampled at one time step.
 *
 * Used by `analyzeSignalVsHype` to classify a time-series observation
 * as either a genuine signal (R₀ < 1 trajectory, decaying) or hype
 * (R₀ > 1 trajectory, sustained spread). Matches the SENTINEL sensor
 * layer described in module_7.tex §7.2 Stochastic Noise paragraph.
 */
export interface SignalObservation {
  /** Observation index (0-based time step). */
  readonly t: number;

  /**
   * Observed rumorist fraction R(t)/N. Value in [0, 1].
   * This is the key signal: a genuine finding shows quick decay after peak;
   * hype shows sustained high rumorist fraction.
   */
  readonly rumoristFraction: number;

  /**
   * Observed fact-checker fraction F(t)/N. Value in [0, 1].
   * High F(t) relative to R(t) → fact-checking is winning → signal, not hype.
   */
  readonly factCheckerFraction: number;
}

// ---------------------------------------------------------------------------
// Signal Classification
// ---------------------------------------------------------------------------

/**
 * Classification outcome for a stream of SignalObservations.
 *
 * Produced by `analyzeSignalVsHype`. When the module is disabled
 * (`settings.enabled === false`) the classification is always
 * `{ disabled: true, classification: 'unknown' }`.
 */
export interface SignalClassification {
  /**
   * Outcome of signal-vs-hype analysis.
   *
   *   'signal'  — rumorist fraction shows peak-then-decay consistent with
   *               R₀ < 1 stable equilibrium. Claim is likely credible.
   *   'hype'    — sustained high rumorist fraction, R₀ > 1 trajectory.
   *               Claim should enter expedited fact-check queue.
   *   'unknown' — insufficient observations or module disabled.
   */
  readonly classification: 'signal' | 'hype' | 'unknown';

  /**
   * Estimated basic reproduction number R₀ analogue derived from the
   * observation trajectory. Present when classification is 'signal' or 'hype'.
   */
  readonly estimatedR0?: number;

  /**
   * Peak rumorist fraction observed in the time series.
   */
  readonly peakRumoristFraction?: number;

  /**
   * Whether the module was disabled at call time.
   * When true, classification is always 'unknown'.
   */
  readonly disabled?: true;
}

// ---------------------------------------------------------------------------
// Propagation Trajectory
// ---------------------------------------------------------------------------

/**
 * A time-discretised trajectory of the four compartments (S/R/A/F) over a
 * simulation run.
 *
 * Produced by `simulatePropagation` in `index.ts`. The step array length
 * equals `Math.ceil(duration / dt)` from the solver configuration.
 *
 * The JSON shape is stable:
 *   { rumorId, networkName, parameters, steps: [{ t, S, R, A, F }], ... }
 */
export interface PropagationTrajectory {
  /** ID of the Rumor that seeded this trajectory. */
  readonly rumorId: string;

  /** Name of the PropagationNetwork used. */
  readonly networkName: string;

  /** SDDE parameters used in this run. */
  readonly parameters: SDDEParameters;

  /**
   * Ordered time steps. Each entry is one Euler-Maruyama step.
   * The first entry is t=0 with initial conditions.
   */
  readonly steps: ReadonlyArray<TrajectoryStep>;

  /**
   * Computed basic reproduction number R₀ = β / (γ + δ).
   * Cached here for convenience (same for every step).
   */
  readonly R0: number;

  /**
   * Index of the step at which R(t) reached its maximum value.
   */
  readonly peakRumoristStepIndex: number;

  /**
   * Maximum rumorist population R(t) observed across all steps.
   */
  readonly peakRumoristValue: number;

  /**
   * PRNG seed used for this run. Stored for reproducibility.
   * Different seeds → different trajectories (SDE noise injection test).
   */
  readonly seed: number;

  /**
   * ISO-8601 timestamp when the simulation was run.
   */
  readonly simulatedAt: string;
}

/**
 * One time step in a PropagationTrajectory.
 */
export interface TrajectoryStep {
  /** Simulation time (real-valued, in simulation units). */
  readonly t: number;
  /** Susceptible population S(t). */
  readonly S: number;
  /** Rumorist population R(t). */
  readonly R: number;
  /** Aware-but-not-checking population A(t). */
  readonly A: number;
  /** Fact-checker population F(t). */
  readonly F: number;
}
