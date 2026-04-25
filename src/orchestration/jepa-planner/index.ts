/**
 * HB-03 — JEPA-as-planner typed interface stub.
 *
 * v1.49.574 Half B, T1 must-ship — the option-2 "particularly good fit"
 * candidate per user directive 2026-04-25.
 *
 * Derivation: M3 bridge thesis (LeWorldModel arXiv:2603.19312); LeWM
 * action / observation / latent contract; CEM in latent space; Model
 * Predictive Control horizon. Cited in `megakernel.bib` as `mk26_2603_19312`,
 * `mk26_2511_08544` (LeJEPA), `mk26_2506_09985` (V-JEPA 2).
 *
 * Substrate-only: action / observation / latent typings, plus a `Planner`
 * interface a future engineering mission's actual JEPA model can implement.
 * NO model, NO training, NO real GPU traces. The stub provides:
 *
 *   1. Stable types for HB-02 telemetry hook → planner observation channel.
 *   2. The CEM-in-latent / MPC-horizon contract the package's M3 bridge
 *      thesis describes (table from `M3-jepa.md`).
 *   3. A reference no-op planner that satisfies the interface for tests.
 *
 * The bridge-thesis mapping (verbatim from M5 §3 / M3 §3):
 *
 *   - Observation o_t (image frame)        → ComputeGraphState (HB-02)
 *   - Action a_t (control input)            → CodeTransformation (HB-02)
 *   - Latent z_t = enc_θ(o_t)               → KernelLatent (this module)
 *   - Predicted next ẑ_{t+1}                → predict() return value
 *   - Goal embedding z_g                    → KernelLatent (target)
 *   - Cost C(ẑ_H, z_g) = ||ẑ_H − z_g||²    → cost() return value
 *   - CEM planner                           → plan() output
 *   - SIGReg anti-collapse                  → enforced by the model impl,
 *                                              not the interface
 *
 * ## Opt-in mechanism
 *
 * Default-OFF. Opt in via `.claude/gsd-skill-creator.json`:
 *
 * ```json
 * {
 *   "gsd-skill-creator": {
 *     "megakernel-substrate": {
 *       "jepa-planner-stub": { "enabled": true }
 *     }
 *   }
 * }
 * ```
 *
 * With the flag absent or false, every public function returns the
 * disabled-result sentinel. Byte-identical to pre-v1.49.574 surface.
 *
 * @module orchestration/jepa-planner
 */

import { z } from 'zod';

import { isJepaPlannerEnabled } from './settings.js';

import {
  ComputeGraphStateSchema,
  CodeTransformationSchema,
  type ComputeGraphState,
  type CodeTransformation,
} from '../../traces/megakernel-trace/index.js';

export { isJepaPlannerEnabled } from './settings.js';
export type { ComputeGraphState, CodeTransformation };

// ============================================================================
// Latent representation.
// ============================================================================

/**
 * A latent representation of expected kernel behavior. The shape mirrors
 * LeWM: a fixed-dimension vector of finite real numbers. The dimension is
 * declared at the planner level (see PlannerOptions.latentDim), not per-vector.
 */
export const KernelLatentSchema = z.object({
  /** Latent vector. Length must equal the planner's declared dimension. */
  vector: z.array(z.number().finite()).min(1),
  /** Optional provenance: which encoder produced this latent. */
  encoderTag: z.string().optional(),
}).strict();
export type KernelLatent = z.infer<typeof KernelLatentSchema>;

// ============================================================================
// Action sequence.
// ============================================================================

/**
 * A planned action sequence: ordered code transformations the planner
 * recommends applying to move from initial state toward goal.
 */
export const ActionSequenceSchema = z.array(CodeTransformationSchema);
export type ActionSequence = z.infer<typeof ActionSequenceSchema>;

// ============================================================================
// Plan result envelope.
// ============================================================================

export interface PlanResult {
  /** Recommended action sequence in execution order. */
  actions: ActionSequence;
  /** Predicted final-state cost relative to goal. Lower is better. */
  predictedCost: number;
  /** MPC-execute-K count (the first K actions to execute before replanning). */
  executeFirstK: number;
  /** Was the planner's output produced from a real model or the disabled stub? */
  disabled: boolean;
  /** Errors encountered (planner returns partial results rather than throwing). */
  errors: ReadonlyArray<string>;
}

const DISABLED_PLAN_RESULT: PlanResult = Object.freeze({
  actions: Object.freeze([]) as ActionSequence,
  predictedCost: Number.POSITIVE_INFINITY,
  executeFirstK: 0,
  disabled: true,
  errors: Object.freeze([]) as ReadonlyArray<string>,
});

// ============================================================================
// Planner contract.
// ============================================================================

export interface PlannerOptions {
  /** Latent dimensionality. LeWM published config: 192 (ViT-Tiny hidden). */
  latentDim: number;
  /** Planning horizon H (number of steps to roll out). LeWM default: 16. */
  horizonH: number;
  /** MPC execute-K (replan after first K steps). LeWM default: 1-4. */
  executeFirstK: number;
  /** CEM population size per iteration. */
  cemPopulation?: number;
  /** CEM iterations. */
  cemIterations?: number;
}

export const DEFAULT_PLANNER_OPTIONS: PlannerOptions = {
  latentDim: 192,
  horizonH: 16,
  executeFirstK: 4,
  cemPopulation: 100,
  cemIterations: 8,
};

/**
 * The bridge-thesis planner contract. A future engineering mission's JEPA
 * model implements this interface; HB-03 ships only the typings + the
 * disabled stub.
 */
export interface Planner {
  /** Encode a compute-graph state into a latent. */
  encode(state: ComputeGraphState): KernelLatent;
  /** Predict next-state latent given current latent and action. */
  predict(current: KernelLatent, action: CodeTransformation): KernelLatent;
  /** Compute squared-L2 cost between predicted and goal latents. */
  cost(predicted: KernelLatent, goal: KernelLatent): number;
  /** Run the CEM/MPC plan and return the recommended action sequence. */
  plan(initial: ComputeGraphState, goal: KernelLatent): PlanResult;
  /** Planner options as configured. */
  readonly options: Readonly<PlannerOptions>;
}

// ============================================================================
// Reference disabled / stub planner — satisfies the interface but does no
// real work. Useful for tests and for downstream code that needs to wire
// the planner contract before a real model exists.
// ============================================================================

class DisabledPlanner implements Planner {
  readonly options: Readonly<PlannerOptions>;
  constructor(options: PlannerOptions) {
    this.options = Object.freeze({ ...options });
  }
  encode(_state: ComputeGraphState): KernelLatent {
    return { vector: new Array(this.options.latentDim).fill(0), encoderTag: 'disabled-stub' };
  }
  predict(current: KernelLatent, _action: CodeTransformation): KernelLatent {
    return { ...current, encoderTag: 'disabled-stub' };
  }
  cost(_predicted: KernelLatent, _goal: KernelLatent): number {
    return Number.POSITIVE_INFINITY;
  }
  plan(_initial: ComputeGraphState, _goal: KernelLatent): PlanResult {
    return DISABLED_PLAN_RESULT;
  }
}

// ============================================================================
// Public API.
// ============================================================================

/**
 * Construct a planner. When the flag is off, returns a `DisabledPlanner`
 * that satisfies the interface but produces no useful output. When on,
 * returns the disabled stub (HB-03 ships interface only — a real model is
 * out of scope per M5 §6).
 *
 * Future engineering missions replace this factory with a model-backed
 * implementation.
 */
export function makePlanner(
  options: Partial<PlannerOptions> = {},
  settingsPath?: string,
): Planner {
  const opts: PlannerOptions = { ...DEFAULT_PLANNER_OPTIONS, ...options };
  // Validate options shape — both enabled and disabled paths share invariants.
  if (!Number.isInteger(opts.latentDim) || opts.latentDim <= 0) {
    throw new Error(`invalid latentDim: ${opts.latentDim}`);
  }
  if (!Number.isInteger(opts.horizonH) || opts.horizonH <= 0) {
    throw new Error(`invalid horizonH: ${opts.horizonH}`);
  }
  if (!Number.isInteger(opts.executeFirstK) || opts.executeFirstK <= 0) {
    throw new Error(`invalid executeFirstK: ${opts.executeFirstK}`);
  }
  if (opts.executeFirstK > opts.horizonH) {
    throw new Error(`executeFirstK (${opts.executeFirstK}) must be ≤ horizonH (${opts.horizonH})`);
  }
  // Whether the substrate is enabled or not, the disabled stub is the only
  // implementation HB-03 ships. The flag gates *useful* behavior; without a
  // real model wired in, opt-in still yields the stub. The flag remains
  // load-bearing because future engineering work will branch on it.
  void isJepaPlannerEnabled(settingsPath);
  return new DisabledPlanner(opts);
}

/**
 * Compute squared-L2 distance between two equal-length latent vectors.
 * Pure utility — used by cost(), but exposed because verifiers want it.
 */
export function squaredL2(a: KernelLatent, b: KernelLatent): number {
  if (a.vector.length !== b.vector.length) {
    throw new Error(
      `latent dimension mismatch: ${a.vector.length} vs ${b.vector.length}`,
    );
  }
  let sum = 0;
  for (let i = 0; i < a.vector.length; i += 1) {
    const d = a.vector[i] - b.vector[i];
    sum += d * d;
  }
  return sum;
}

/**
 * Validate a `KernelLatent` against an expected dimensionality. Pure check.
 */
export function isLatentWellFormed(latent: unknown, expectedDim: number): boolean {
  const parsed = KernelLatentSchema.safeParse(latent);
  if (!parsed.success) return false;
  return parsed.data.vector.length === expectedDim;
}

export { ComputeGraphStateSchema, CodeTransformationSchema };

/**
 * Schema/contract version. Bump on non-backward-compatible changes.
 */
export const JEPA_PLANNER_CONTRACT_VERSION = '1.0.0' as const;
