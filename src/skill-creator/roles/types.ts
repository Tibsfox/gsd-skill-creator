/**
 * HB-04 Worker / Evaluator / Evolution (W/E/E) — types.
 *
 * Source: arXiv:2604.21003 ("The Last Harness You'll Ever Build") — external
 * description of skill-creator. The role split names what the existing
 * skill-creator six-step loop already does (Observe → Detect → Suggest →
 * Manage → Auto-Load → Learn/Compose) rather than restructuring it.
 *
 *   Worker     — generates candidate skills against the target task.
 *   Evaluator  — adversarially diagnoses Worker output against
 *                failure-history; holds BLOCK authority over Worker
 *                outputs (replaces the ad-hoc 3-correction-min rule).
 *   Evolution  — proposes loop-protocol modifications based on
 *                cross-skill patterns. Slow-timescale.
 *
 * HB-07 AEL fast/slow bandit (arXiv:2604.21725) composes inside Evolution's
 * protocol-update extension point — see {@link EvolutionExtensionPoint}.
 *
 * @module skill-creator/roles/types
 */

/** The three role identifiers. */
export type Role = 'worker' | 'evaluator' | 'evolution';

/** Schema version for any persisted role-record artifact. */
export const WELER_ROLES_SCHEMA_VERSION = '1.0.0' as const;

/** Per-role isolation domains; cross-domain writes are runtime-enforced. */
export const ROLE_DOMAINS: ReadonlyArray<Role> = Object.freeze([
  'worker',
  'evaluator',
  'evolution',
]);

// ───────────────────────── Worker ─────────────────────────

/**
 * Worker output shape — a candidate skill (or candidate set) generated
 * against the input task. The shape is intentionally minimal; concrete
 * skill-creator integration writes its own richer payload as `payload`.
 */
export interface WorkerOutput {
  readonly role: 'worker';
  readonly taskId: string;
  /** Stable identifier for the candidate Worker emitted. */
  readonly candidateId: string;
  /** Human-readable summary of what the candidate does. */
  readonly summary: string;
  /** Free-form payload (skill spec, manifest, etc.) — opaque to Evaluator. */
  readonly payload: Readonly<Record<string, unknown>>;
  readonly producedAt: string;
}

/** State the Worker is allowed to write (its own scratch). */
export interface WorkerState {
  readonly role: 'worker';
  readonly taskId: string;
  readonly candidates: ReadonlyArray<WorkerOutput>;
  /** Notes the Worker accumulates; Evaluator MUST NOT see them. */
  readonly internalNotes: ReadonlyArray<string>;
}

// ─────────────────────── Evaluator ────────────────────────

/** Severity of an Evaluator-found failure. */
export type EvaluatorSeverity = 'low' | 'medium' | 'high';

/** Adversarial diagnostic produced by Evaluator over a Worker output. */
export interface EvaluatorDiagnostic {
  readonly role: 'evaluator';
  readonly candidateId: string;
  readonly failureClass: string;
  readonly severity: EvaluatorSeverity;
  readonly rootCause: string;
  /** True iff Evaluator BLOCKS Worker's candidate from advancing. */
  readonly block: boolean;
  /** References to past failure-history entries that informed the diagnostic. */
  readonly cited: ReadonlyArray<string>;
  readonly producedAt: string;
}

/** Read-only failure-history record exposed to Evaluator. */
export interface FailureHistoryEntry {
  readonly id: string;
  readonly failureClass: string;
  readonly summary: string;
  readonly recordedAt: string;
}

/** State the Evaluator is allowed to write. */
export interface EvaluatorState {
  readonly role: 'evaluator';
  readonly diagnostics: ReadonlyArray<EvaluatorDiagnostic>;
}

// ─────────────────────── Evolution ────────────────────────

/**
 * Cross-skill diagnostic pattern aggregated for Evolution. This is the
 * read-only window Evolution gets onto Evaluator output.
 */
export interface CrossSkillPattern {
  readonly failureClass: string;
  readonly occurrences: number;
  readonly affectedCandidates: ReadonlyArray<string>;
}

/** A proposed change to a loop protocol (e.g., the auto-load policy). */
export interface PolicyUpdateProposal {
  readonly role: 'evolution';
  /** Which protocol the proposal targets. */
  readonly protocol: 'auto-load' | 'evaluator-threshold' | 'six-step-cadence';
  /** One-line description of the change. */
  readonly change: string;
  /** Why Evolution is proposing the change (cross-skill rationale). */
  readonly rationale: string;
  /** Cross-skill pattern that triggered the proposal. */
  readonly trigger: CrossSkillPattern;
  /** Source of the proposal — `'evolution'` for in-house; otherwise an extension id. */
  readonly source: string;
  readonly producedAt: string;
}

/** State the Evolution role is allowed to write. */
export interface EvolutionState {
  readonly role: 'evolution';
  readonly proposals: ReadonlyArray<PolicyUpdateProposal>;
}

/**
 * Extension-point interface for HB-07 (AEL fast/slow bandit) — and any
 * future Evolution-role plugin. The bandit lives **inside** Evolution's
 * protocol-update path, not as a sibling system. Per the convergent-
 * discovery report §5: HB-04 supplies the per-episode adversarial check;
 * HB-07 supplies the cross-episode reflection-bandit.
 *
 * Implementations MUST be pure relative to their inputs. Implementations
 * MUST NOT mutate the snapshot they receive. The Evolution role calls
 * `proposePolicyUpdate` only after the CAPCOM gate emits an authorized
 * record — see {@link CapcomGateRecord}.
 */
export interface EvolutionExtensionPoint {
  /** Stable id distinguishing the extension (e.g., `'hb07-ael-bandit'`). */
  readonly id: string;
  /**
   * Inspect read-only snapshots of Worker/Evaluator state and (optionally)
   * propose a policy update. Returning `null` means "no proposal".
   */
  proposePolicyUpdate(snapshot: EvolutionSnapshot): PolicyUpdateProposal | null;
}

/** Read-only snapshot passed to {@link EvolutionExtensionPoint}. */
export interface EvolutionSnapshot {
  readonly workerState: WorkerState;
  readonly evaluatorState: EvaluatorState;
  readonly patterns: ReadonlyArray<CrossSkillPattern>;
}

// ───────────────────────── CAPCOM ─────────────────────────

/** Reasons that fire the CAPCOM HARD GATE for HB-04. */
export type CapcomGateReason = 'role-split-activation' | 'protocol-update';

/** Single CAPCOM gate emission record. */
export interface CapcomGateRecord {
  readonly kind: CapcomGateReason;
  /** Set when `kind === 'protocol-update'`. */
  readonly proposal: PolicyUpdateProposal | null;
  /** Set when `kind === 'role-split-activation'` (e.g., trigger note). */
  readonly note: string;
  readonly timestamp: string;
  readonly authorized: boolean;
  /**
   * Optional signed/git-tracked attestation token. Reserved for v1.49.576+
   * multi-operator extension; HB-04 v1.49.575 ships local-marker only and
   * does NOT verify this field. Including it preserves wire compatibility.
   */
  readonly signedAttestation?: string;
}

/** Result of a CAPCOM gate emission. */
export interface CapcomGateResult {
  readonly emitted: boolean;
  readonly authorized: boolean;
  readonly disabled: boolean;
  readonly record: CapcomGateRecord | null;
}

// ──────────────────── Role-isolation runtime ────────────────────

/** Identity of an attempted cross-role write detected by the enforcer. */
export interface IsolationViolation {
  readonly fromRole: Role;
  readonly toRole: Role;
  readonly field: string;
  readonly at: string;
}
