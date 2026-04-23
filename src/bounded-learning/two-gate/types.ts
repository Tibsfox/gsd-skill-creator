/**
 * Two-Gate Guardrail — type definitions.
 *
 * Wang & Dorchen 2025 (arXiv:2510.04399) prove that distribution-free PAC
 * learnability is preserved under self-modification if and only if the
 * policy-reachable hypothesis family has uniformly bounded capacity. The
 * Two-Gate guardrail formalizes this as:
 *
 *   Gate 1 (tau):  validation margin — the minimum acceptable accuracy
 *                  gap between the proposed update and the current policy
 *                  on the held-out validation set.
 *
 *   Gate 2 (K[m]): capacity cap — a per-sample-size upper bound on the
 *                  hypothesis-family VC dimension that the self-modification
 *                  may explore. When K[m] is respected, the oracle-inequality
 *                  at VC rates holds.
 *
 * The gsd-skill-creator existing 20% content-change cap and three-correction
 * minimum are the practical realization of K[m]; CAPCOM boundary validation
 * realizes tau. This module makes the correspondence explicit and emits an
 * oracle-inequality log line at each gate boundary so auditors can verify
 * the guardrail was honored.
 *
 * @module bounded-learning/two-gate/types
 */

/** Two-Gate parameters. */
export interface TwoGateParams {
  /**
   * Validation margin tau in [0, 1]. The gate passes iff the validation
   * accuracy of the proposed update exceeds (current accuracy + tau). Lower
   * tau accepts smaller improvements; higher tau demands larger margins.
   */
  tau: number;
  /**
   * Capacity cap K[m] as a function of sample size m. Practically
   * represented as a closed-form function. Default is the Wang-Dorchen
   * sqrt-scaling K[m] = k0 * sqrt(m) with k0 configurable.
   */
  capacityCap: (sampleSize: number) => number;
  /** Identifier printed in telemetry; typically a milestone or phase tag. */
  label: string;
}

/** Evaluation inputs at a single gate boundary. */
export interface GateInputs {
  /** Size of the held-out validation sample. */
  sampleSize: number;
  /** Baseline policy accuracy on validation set, [0, 1]. */
  currentAccuracy: number;
  /** Proposed update's accuracy on validation set, [0, 1]. */
  proposedAccuracy: number;
  /** Measured VC-dimension proxy of the proposed update's hypothesis family. */
  proposedCapacity: number;
  /** Phase-or-wave identifier used in the log record. */
  phase: string;
}

/** Result of evaluateTwoGate(). */
export interface TwoGateResult {
  pass: boolean;
  tauGate: {
    pass: boolean;
    required: number;
    observed: number;
    reason: string;
  };
  capacityGate: {
    pass: boolean;
    cap: number;
    observed: number;
    reason: string;
  };
  /**
   * The oracle-inequality bound predicted by Wang-Dorchen at the current
   * sample size and observed capacity; callers log this for audit.
   */
  oracleInequalityBound: number;
  /** Human-readable summary of the overall decision. */
  summary: string;
}

/** Log record emitted on every gate evaluation (both pass and fail). */
export interface TwoGateLogRecord {
  type: 'bounded-learning.two-gate.evaluation';
  timestamp: string;
  phase: string;
  params: { tau: number; label: string };
  inputs: GateInputs;
  result: TwoGateResult;
}

/**
 * gsd-skill-creator's shipping 20% change cap and 3-correction minimum
 * expressed in Two-Gate terms. Used by the documentation helper.
 */
export interface GSDCapRealization {
  contentChangeCapPercent: 20;
  correctionMinimum: 3;
  cooldownDays: 7;
  mappedToKm: string;
}

/** Default k0 for the sqrt-scaling K[m] = k0 * sqrt(m). */
export const DEFAULT_K0 = 4.0;

/** Default validation margin tau when no override is supplied. */
export const DEFAULT_TAU = 0.01; // 1 percentage point minimum improvement
