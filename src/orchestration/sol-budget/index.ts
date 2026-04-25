/**
 * HB-05 — μCUTLASS+SOL-style budget guidance hook.
 *
 * v1.49.574 Half B, T2 if-budget.
 *
 * Derivation: μCUTLASS+SOL `mk26_2603_29010` (19–43% token savings while
 * retaining ≥95% of geomean speedup); M3 §5 adjacent-planning comparison;
 * M5 §5 Stage 4 prerequisite (SOL composes complementarily with JEPA).
 *
 * Substrate-only: estimator interface + budget-tracking surface. Concrete
 * SOL estimators per operator class are out of scope — a future engineering
 * mission plugs them in.
 *
 * The Speed-of-Light estimate is an *analytic upper bound* on achievable
 * throughput for a given operator on given hardware (computed from peak
 * arithmetic intensity, peak memory bandwidth, and the operator's
 * arithmetic-vs-memory ratio). The hook lets a kernel-generation agent ask
 * "how close am I to the ceiling?" and bound its remaining optimization
 * effort accordingly.
 *
 * ## Opt-in mechanism
 *
 * Default-OFF. Opt in via `.claude/gsd-skill-creator.json`:
 *
 * ```json
 * {
 *   "gsd-skill-creator": {
 *     "megakernel-substrate": {
 *       "sol-budget-guidance": { "enabled": true }
 *     }
 *   }
 * }
 * ```
 *
 * @module orchestration/sol-budget
 */

import { z } from 'zod';

import { isSolBudgetEnabled } from './settings.js';

export { isSolBudgetEnabled } from './settings.js';

// ============================================================================
// Operator-class taxonomy.
// ============================================================================

export const OperatorClassSchema = z.enum([
  'matmul',
  'attention',
  'layer-norm',
  'rms-norm',
  'softmax',
  'reduction',
  'pointwise',
  'all-reduce',
  'reduce-scatter',
]);
export type OperatorClass = z.infer<typeof OperatorClassSchema>;

// ============================================================================
// Hardware envelope (subset of M5 §4 RTX 4060 Ti table).
// ============================================================================

export const HardwareEnvelopeSchema = z.object({
  /** Identifier — e.g., "ada-lovelace-ad106", "blackwell-b200". */
  hardwareTarget: z.string().min(1),
  /** Peak FP16/BF16 throughput, TFLOPS. */
  peakTflops: z.number().positive(),
  /** Peak memory bandwidth, GB/s. */
  peakMemBandwidthGbps: z.number().positive(),
  /** Streaming multiprocessor count. */
  smCount: z.number().int().positive(),
}).strict();
export type HardwareEnvelope = z.infer<typeof HardwareEnvelopeSchema>;

/** RTX 4060 Ti reference envelope per M5 §4. */
export const RTX_4060_TI_ENVELOPE: HardwareEnvelope = Object.freeze({
  hardwareTarget: 'ada-lovelace-ad106',
  peakTflops: 22,
  peakMemBandwidthGbps: 288,
  smCount: 34,
});

// ============================================================================
// SOL estimator contract.
// ============================================================================

export interface OperatorWorkload {
  /** Operator class. */
  operatorClass: OperatorClass;
  /** Total floating-point operations (or equivalent multiply-adds). */
  flops: number;
  /** Total bytes touched (read + write). */
  bytes: number;
  /** Optional human-readable name. */
  name?: string;
}

export interface SolEstimate {
  /** Theoretical minimum runtime in microseconds (best of compute-bound or memory-bound). */
  minMicros: number;
  /** Whether the operator is compute-bound (true) or memory-bound (false). */
  computeBound: boolean;
  /** Arithmetic intensity (FLOPs per byte). */
  arithmeticIntensity: number;
}

export type SolEstimator = (
  workload: OperatorWorkload,
  envelope: HardwareEnvelope,
) => SolEstimate;

// ============================================================================
// Default first-order SOL estimator. Minimum-of-{compute, memory} bound.
// Returns a *floor* — the actual kernel runs no faster than this.
// ============================================================================

export const defaultSolEstimator: SolEstimator = (workload, envelope) => {
  const computeMicros = (workload.flops / (envelope.peakTflops * 1e12)) * 1e6;
  const memMicros =
    (workload.bytes / (envelope.peakMemBandwidthGbps * 1e9)) * 1e6;
  const arithmeticIntensity = workload.bytes > 0 ? workload.flops / workload.bytes : Infinity;
  return {
    minMicros: Math.max(computeMicros, memMicros),
    computeBound: computeMicros >= memMicros,
    arithmeticIntensity,
  };
};

// ============================================================================
// Budget guidance.
// ============================================================================

export interface BudgetGuidance {
  /** SOL estimate for the workload. */
  sol: SolEstimate;
  /** Measured runtime, microseconds. */
  measuredMicros: number;
  /** Ratio measured/SOL (≥ 1; 1.0 means "at SOL"). */
  efficiencyRatio: number;
  /** Recommended remaining optimization-token budget normalized to [0,1]. */
  remainingBudget: number;
  /** Disabled-result sentinel. */
  disabled: boolean;
}

const DISABLED_GUIDANCE: BudgetGuidance = Object.freeze({
  sol: { minMicros: 0, computeBound: false, arithmeticIntensity: 0 },
  measuredMicros: 0,
  efficiencyRatio: 0,
  remainingBudget: 0,
  disabled: true,
});

export interface BudgetGuidanceOptions {
  /** Override the default estimator. */
  estimator?: SolEstimator;
  /**
   * Efficiency thresholds. When measured/SOL falls below `nearOptimal`, the
   * remaining budget is set to the corresponding floor value. The defaults
   * encode μCUTLASS+SOL-style guidance: at ≥0.95 efficiency further
   * optimization is unlikely to pay (budget=0); at <0.50 there's high upside
   * remaining (budget=1).
   */
  thresholds?: {
    nearOptimal: number;     // default 0.95
    moderate: number;        // default 0.75
    poor: number;            // default 0.50
  };
}

const DEFAULT_THRESHOLDS = { nearOptimal: 0.95, moderate: 0.75, poor: 0.50 };

/**
 * Compute budget guidance for a measured kernel execution against a workload
 * spec + hardware envelope. When the substrate flag is off, returns the
 * disabled-guidance sentinel.
 */
export function computeBudgetGuidance(
  workload: OperatorWorkload,
  measuredMicros: number,
  envelope: HardwareEnvelope = RTX_4060_TI_ENVELOPE,
  options: BudgetGuidanceOptions = {},
  settingsPath?: string,
): BudgetGuidance {
  if (!isSolBudgetEnabled(settingsPath)) return DISABLED_GUIDANCE;
  if (!Number.isFinite(measuredMicros) || measuredMicros <= 0) {
    throw new Error(`measuredMicros must be a positive finite number; got ${measuredMicros}`);
  }
  const estimator = options.estimator ?? defaultSolEstimator;
  const thresholds = options.thresholds ?? DEFAULT_THRESHOLDS;
  const sol = estimator(workload, envelope);
  // efficiency = SOL / measured (≤ 1.0 because SOL is the floor; measured ≥ SOL).
  const efficiency = sol.minMicros > 0 ? sol.minMicros / measuredMicros : 0;
  let remainingBudget: number;
  if (efficiency >= thresholds.nearOptimal) remainingBudget = 0;
  else if (efficiency >= thresholds.moderate) remainingBudget = 0.25;
  else if (efficiency >= thresholds.poor) remainingBudget = 0.6;
  else remainingBudget = 1;
  return {
    sol,
    measuredMicros,
    efficiencyRatio: measuredMicros / Math.max(sol.minMicros, Number.EPSILON),
    remainingBudget,
    disabled: false,
  };
}

/** Schema version. */
export const SOL_BUDGET_HOOK_VERSION = '1.0.0' as const;
