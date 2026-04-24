/**
 * Mission-State World-Model layer — type definitions.
 *
 * A mini-LeWM (Maes et al. 2026) ported to mission state: an encoder maps
 * mission state (current wave, completed tasks, open CAPCOM gates, budget
 * consumed, skill activation set) to a compact ≤192-dim latent; a predictor
 * forecasts next-state latent given (current latent, proposed action). CEM
 * planning over the predictor rehearses a wave before the orchestrator
 * dispatches it.
 *
 * HARD CAPCOM PRESERVATION:
 *   - The predictor is advisory. CAPCOM human-gate authority remains
 *     authoritative in every outcome.
 *   - The action set is an enum that explicitly excludes any gate-bypass
 *     variant. There is no code path by which a predicted trajectory can
 *     emit a CAPCOM bypass.
 *   - Every public API returns advisory structures. No side effects on
 *     CAPCOM state, no dispatch of real skills, no wave execution.
 *
 * @module mission-world-model/types
 */

/** Action classes the predictor may be conditioned on. Gate-bypass actions are intentionally absent. */
export type MissionAction =
  | 'dispatch-wave'
  | 'allocate-model'
  | 'activate-skill'
  | 'request-capcom-review'
  | 'no-op';

/**
 * Compile-time guarantee: the action enum does not include any gate-bypass variant.
 * This is a type-level guard + a runtime check in `assertNoGateBypassAction`.
 */
export const FORBIDDEN_ACTION_NAMES = [
  'bypass-capcom',
  'override-capcom',
  'skip-gate',
  'force-dispatch',
  'gate-bypass',
] as const;

/** Raw mission-state features pre-encoding. Callers supply these from mission telemetry. */
export interface MissionState {
  /** Current wave number (e.g., 728 for Phase 728). */
  currentPhase: number;
  /** Number of completed tasks in the active milestone. */
  completedTaskCount: number;
  /** Number of CAPCOM gates currently open. */
  openCapcomGateCount: number;
  /** Fraction of milestone token budget consumed in [0, 1]. */
  budgetFraction: number;
  /** Count of currently-activated skills. */
  activeSkillCount: number;
  /** Free-form per-phase signals. Never used to encode a gate-bypass intent. */
  auxiliary?: Readonly<Record<string, number>>;
}

/** A compact latent token for mission state. Length = encoder config `latentDim`. */
export type MissionLatent = ReadonlyArray<number>;

/** Configuration for the encoder + predictor. */
export interface MissionWorldModelConfig {
  /** Latent dimension. LeWM: 192. Audit bound: ≤ 192. */
  latentDim: number;
  /** Number of CEM samples per planning step. Typical: 64–256. */
  cemSamples: number;
  /** CEM elite fraction (top-K for refitting). Typical: 0.2. */
  cemEliteFraction: number;
  /** Number of CEM iterations. */
  cemIterations: number;
  /** Planning horizon (number of actions in the rollout). */
  planningHorizon: number;
  /** Random seed for determinism. */
  seed?: number;
}

/** Default config — small footprint for unit testability. */
export const DEFAULT_CONFIG: MissionWorldModelConfig = {
  latentDim: 128,
  cemSamples: 64,
  cemEliteFraction: 0.25,
  cemIterations: 3,
  planningHorizon: 3,
};

/** One CEM plan outcome. All fields are advisory. */
export interface AdvisoryPlan {
  /** The proposed action sequence (≤ planningHorizon elements). */
  actions: ReadonlyArray<MissionAction>;
  /** Predicted final latent reached by the rollout. */
  predictedFinalLatent: MissionLatent;
  /** Predicted cost (e.g., distance to goal latent). Lower = better. */
  predictedCost: number;
  /** Number of CEM iterations actually run. */
  iterationsRun: number;
  /**
   * The advisory-only flag is ALWAYS true. This field exists so that downstream
   * code can machine-check that the plan was emitted by the mission-world-model
   * and not by any authoritative dispatch path.
   */
  readonly advisoryOnly: true;
  /** Reproducibility tag. */
  runTag: string;
}
