/**
 * Activation Steering Runtime — types (Phase 767, T1c W5).
 *
 * Pure type module. No runtime imports from `src/dacp/`; if DACP types
 * are needed they are imported via `import type` only (and currently
 * are not — this module operates on raw activation vectors).
 *
 * Grounded in:
 *   - arXiv:2604.19018 (Skifstad, Yang, Chou — *Local Linearity of LLMs*)
 *   - v1.49.572 T1c semantic-channel formalism at
 *     `docs/substrate/semantic-channel.md`
 *
 * @module activation-steering/types
 */

// ============================================================================
// CRAFT roles + model tiers
// ============================================================================

/**
 * The five CRAFT roles that frame agent behaviour in gsd-skill-creator.
 *
 * - **Coordinator** — orchestration / handoff / sequencing.
 * - **Researcher**  — open-ended search and synthesis.
 * - **Architect**   — high-level design and system decomposition.
 * - **Forger**      — concrete implementation / code generation.
 * - **Tactician**   — short-horizon planning and execution control.
 */
export type CRAFTRole =
  | 'Coordinator'
  | 'Researcher'
  | 'Architect'
  | 'Forger'
  | 'Tactician';

/** Anthropic model tiers we steer over (no fine-tuning, inference-time only). */
export type ModelTier = 'Opus' | 'Sonnet' | 'Haiku';

/** Closed enumeration of CRAFT roles. */
export const CRAFT_ROLES: readonly CRAFTRole[] = [
  'Coordinator',
  'Researcher',
  'Architect',
  'Forger',
  'Tactician',
];

/** Closed enumeration of model tiers. */
export const MODEL_TIERS: readonly ModelTier[] = ['Opus', 'Sonnet', 'Haiku'];

// ============================================================================
// Steering target
// ============================================================================

/**
 * A target point in activation space the steering controller is asked to
 * approach. Vectors are stored as plain `number[]` for stable JSON
 * round-trip; the controller converts to `Float64Array` internally.
 */
export interface SteeringTarget {
  readonly role: CRAFTRole;
  readonly tier: ModelTier;
  /** Unit-norm-ish target vector (the mapper produces values in [-1, 1]). */
  readonly vector: readonly number[];
  /** Optional human-readable label for the target (e.g. "forger@haiku"). */
  readonly label?: string;
}

// ============================================================================
// Steering result
// ============================================================================

/**
 * Result returned from `steer()`.
 *
 * When the opt-in flag is OFF, callers get `{ disabled: true, vector: input }`
 * — a zero-side-effect passthrough; the input vector is returned unchanged.
 * The DACP byte-identical preservation gate (G11) depends on this shape.
 */
export interface SteeringResult {
  /** True iff the steering layer was disabled (passthrough). */
  readonly disabled: boolean;
  /** Output activation vector (== input on disabled). */
  readonly vector: readonly number[];
  /** The control delta applied (zero-vector on disabled). */
  readonly delta: readonly number[];
  /** L2 norm of the delta. */
  readonly deltaNorm: number;
  /** Gain matrix scalar used (K = `gain` * I in this controller). */
  readonly gain: number;
  /** Optional label of the target role / tier the result was steered to. */
  readonly targetLabel?: string;
  /** Optional warning when local-linearity assumption looks violated. */
  readonly warning?: string;
}

// ============================================================================
// Local-linearity validator output
// ============================================================================

/**
 * Output of `validateLocalLinearity` — a residual / fit metric over a small
 * activation neighbourhood. The Skifstad–Yang–Chou local-linearity claim is
 * that LLM activations are well-approximated by an affine map within a
 * neighbourhood; we check that the linear model's residual is below a
 * configurable threshold.
 */
export interface LinearityFit {
  /** Mean squared residual of the linear fit, normalised by sample variance. */
  readonly normalisedResidual: number;
  /** True iff `normalisedResidual <= threshold`. */
  readonly withinThreshold: boolean;
  /** The threshold used. */
  readonly threshold: number;
  /** Number of samples used. */
  readonly samples: number;
  /** Optional human-readable warning (`undefined` when within threshold). */
  readonly warning?: string;
}
