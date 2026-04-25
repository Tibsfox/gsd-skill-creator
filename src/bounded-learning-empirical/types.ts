/**
 * Bounded-Learning Empirical Harness — type definitions.
 *
 * Empirical justification harness for the GSD constitution's bounded-learning
 * constraints per SkillLearnBench (arXiv:2604.20087 / Zhong et al., submitted
 * 22 April 2026). Extends the v1.49.572 T1d theorem-reference attestation at
 * `docs/substrate-theorems/bounded-learning.md` to an executable harness.
 *
 * Phase 766, v1.49.573 Upstream Intelligence Pack v1.44.
 *
 * @module bounded-learning-empirical/types
 */

// ---------------------------------------------------------------------------
// TaskSet
// ---------------------------------------------------------------------------

/**
 * Sub-domain classification matching the SkillLearnBench 15-sub-domain
 * taxonomy (arXiv:2604.20087 §3.2).
 *
 * The labels are our GSD-context mapping of the SkillLearnBench sub-domains;
 * they are not verbatim from the paper (which covers broader task classes).
 */
export type SubDomain =
  | 'skill-composition'
  | 'skill-retrieval'
  | 'skill-editing'
  | 'skill-evaluation'
  | 'skill-generation'
  | 'tool-use'
  | 'planning'
  | 'code-synthesis'
  | 'knowledge-transfer'
  | 'error-correction'
  | 'feedback-integration'
  | 'context-adaptation'
  | 'multi-step-reasoning'
  | 'output-structuring'
  | 'self-improvement';

/**
 * Feedback source classification used by the harness.
 *
 * - `self`: the skill system produces feedback on its own outputs without
 *   external reference (the SkillLearnBench recursive-drift regime).
 * - `external`: an independent oracle or human evaluator provides the
 *   corrective signal (the safe-operating-envelope regime).
 */
export type FeedbackSource = 'self' | 'external';

/**
 * A single task in the harness scaffold.
 *
 * Each task is drawn from one sub-domain, carries a synthetic input, a
 * reference output, and a feedback-source label. The 20-task scaffold
 * (arXiv:2604.20087 §3.1) is represented by 20 TaskSpec entries across the
 * 15 SubDomain values, with some sub-domains hosting more than one task.
 */
export interface TaskSpec {
  /** Stable identifier unique within the TaskSet. */
  readonly id: string;
  /** Sub-domain this task exercises. */
  readonly subDomain: SubDomain;
  /** Human-readable description of the task. */
  readonly description: string;
  /** Synthetic input payload (opaque string). */
  readonly input: string;
  /** Reference output against which drift is measured. */
  readonly referenceOutput: string;
  /** Feedback source for this task. */
  readonly feedbackSource: FeedbackSource;
}

/**
 * A TaskSet is the full collection of tasks passed to `runBenchmark`.
 *
 * The 20-task scaffold in `task-scaffold.ts` is the default TaskSet.
 * Callers may provide custom TaskSets for integration testing.
 */
export interface TaskSet {
  /** Human-readable name for this task set. */
  readonly name: string;
  /** ISO-8601 creation timestamp. */
  readonly createdAt: string;
  /** Ordered list of task specifications. */
  readonly tasks: ReadonlyArray<TaskSpec>;
}

// ---------------------------------------------------------------------------
// Constitutional caps
// ---------------------------------------------------------------------------

/**
 * Identifier for each of the three GSD bounded-learning constitutional caps.
 *
 * - `twenty-percent-cap`: no single update may alter > 20% of a pattern's
 *   canonical-serialised content (token-diff ratio).
 * - `three-correction-minimum`: at least 3 independent corrective signals
 *   required before a pattern is committed to the persistent substrate.
 * - `seven-day-cooldown`: after a pattern is committed, further updates are
 *   suppressed for a 7-day window.
 *
 * See `docs/substrate-theorems/bounded-learning.md` §1 for the canonical
 * specification of these three rules.
 */
export type ConstitutionalCapId =
  | 'twenty-percent-cap'
  | 'three-correction-minimum'
  | 'seven-day-cooldown';

/**
 * A constitutional cap as passed to `validateConstraint`.
 */
export interface ConstitutionalCap {
  /** Which cap to validate. */
  readonly id: ConstitutionalCapId;
  /**
   * Optional numeric parameter override.
   *
   * For `twenty-percent-cap`: the fractional threshold (default 0.20).
   * For `three-correction-minimum`: the minimum count (default 3).
   * For `seven-day-cooldown`: the cooldown in days (default 7).
   */
  readonly parameter?: number;
}

// ---------------------------------------------------------------------------
// Evidence records
// ---------------------------------------------------------------------------

/**
 * A single evidence data point produced by the harness for one iteration of a
 * self-feedback loop or a task evaluation run.
 */
export interface EvidencePoint {
  /** Zero-based iteration index. */
  readonly iteration: number;
  /** Task identifier. */
  readonly taskId: string;
  /** Feedback source used in this iteration. */
  readonly feedbackSource: FeedbackSource;
  /** Content-drift fraction (0–1) relative to the reference output. */
  readonly driftFraction: number;
  /** Correction count accumulated up to and including this iteration. */
  readonly correctionCount: number;
  /** Days since the last committed update (synthetic value in tests). */
  readonly daysSinceLastCommit: number;
}

/**
 * Verdict emitted by the recursive-drift detector.
 *
 * - `PASS`: drift increased monotonically under self-feedback and stayed flat
 *   or decreased under external feedback — qualitatively reproduces the
 *   SkillLearnBench finding.
 * - `FAIL`: the drift pattern did not reproduce the expected qualitative
 *   relationship between feedback source and drift trajectory.
 */
export type DriftVerdict = 'PASS' | 'FAIL';

/**
 * Structured evidence record produced by `runBenchmark`.
 *
 * `disabled === true` is the byte-identical default-off return value; all
 * numeric fields are 0, `evidence` is empty, and `driftVerdict` is absent.
 */
export interface EvidenceRecord {
  /** ISO-8601 timestamp at harness entry. */
  readonly timestamp: string;
  /** Name of the TaskSet used. */
  readonly taskSetName: string;
  /** Total number of tasks evaluated. */
  readonly tasksEvaluated: number;
  /** Flat list of evidence data points collected during the run. */
  readonly evidence: ReadonlyArray<EvidencePoint>;
  /**
   * Verdict from the recursive-drift detector.
   * Absent when `disabled === true`.
   */
  readonly driftVerdict?: DriftVerdict;
  /**
   * Mean drift fraction under self-feedback across all tasks/iterations.
   * 0 when `disabled === true`.
   */
  readonly meanSelfFeedbackDrift: number;
  /**
   * Mean drift fraction under external feedback across all tasks/iterations.
   * 0 when `disabled === true`.
   */
  readonly meanExternalFeedbackDrift: number;
  /**
   * True iff the harness was disabled at invocation time (opt-in flag off).
   * When true the record is byte-identical to a zero-state record.
   */
  readonly disabled: boolean;
}

/**
 * Evidence record for a single constitutional cap, produced by
 * `validateConstraint`.
 */
export interface ConstraintEvidence {
  /** Which cap was validated. */
  readonly capId: ConstitutionalCapId;
  /** The numeric parameter used in this validation run. */
  readonly parameter: number;
  /**
   * `PASS` if the evidence supports the constraint's stated boundary;
   * `FAIL` if the evidence contradicts it.
   */
  readonly verdict: 'PASS' | 'FAIL';
  /**
   * Human-readable summary of the evidence for this cap.
   * Cites SkillLearnBench §5/§6 findings where applicable.
   */
  readonly summary: string;
  /**
   * Raw evidence points used in this validation.
   */
  readonly evidence: ReadonlyArray<EvidencePoint>;
  /**
   * True iff the harness was disabled at invocation time.
   */
  readonly disabled: boolean;
}
