/**
 * HB-04 Worker / Evaluator / Evolution role split — barrel export.
 *
 * v1.49.575 cs25-26-sweep Half B. Source: arXiv:2604.21003 (external
 * description of skill-creator). Default-off via
 * `cs25-26-sweep.weler-roles.enabled`.
 *
 * **CAPCOM HARD GATE.** The role split touches skill-creator
 * orchestration. Two production scenarios fire the gate:
 *   1. Role-split activation — transitioning from single-role (existing
 *      six-step loop) to W/E/E.
 *   2. Protocol-update — Evolution-proposed change to a loop protocol
 *      (auto-load, evaluator-threshold, six-step-cadence).
 * Both require explicit human authorization via the
 * `.planning/skill-creator/weler-roles.capcom` marker file.
 *
 * ════════════ Spec preamble — design dispositions ════════════
 *
 * (a) **Local-marker scope.** The CAPCOM marker file is local-state-only;
 *     multi-operator deployments need a richer authorization protocol
 *     (signed/git-tracked attestation). v1.49.575 ships with local-marker
 *     ONLY. The {@link CapcomGateRecord.signedAttestation} optional field
 *     is reserved now so a future v1.49.576+ multi-operator extension can
 *     drop in without breaking changes.
 *
 * (b) **Trigger-vs-auth separation.** Following HB-03, two distinct
 *     markers exist:
 *       - `.planning/skill-creator/weler-roles.trigger` — user-requested
 *         activation (presence = "I asked for the role split").
 *       - `.planning/skill-creator/weler-roles.capcom` — human-authorized
 *         activation (non-empty content = "the role split is authorized").
 *     Trigger does NOT authorize; CAPCOM does. See
 *     {@link isActivationTriggered} and {@link isCapcomAuthorized}.
 *
 * (c) **Conservative-default policy.** When the flag is on but no role
 *     split is authorized, behavior degrades to **single-role**: only
 *     the Worker is exercised (no adversarial Evaluator, no Evolution
 *     proposal). The existing six-step loop runs unchanged. The only
 *     change vs flag-off is that {@link emitCapcomGate} emits records
 *     with `authorized=false` so an operator can see the system is
 *     waiting for authorization.
 *
 * ════════════ HB-07 composition (slow-timescale bandit) ════════════
 *
 * HB-07 (AEL fast/slow bandit, arXiv:2604.21725) lives **inside**
 * {@link evolutionPropose} via {@link EvolutionExtensionPoint}.
 * The bandit is one of Evolution's protocol-update mechanisms, not a
 * sibling system (per convergent-discovery report §5).
 *
 * @module skill-creator/roles
 */

// Settings.
export type { WelerRolesConfig } from './settings.js';
export {
  DEFAULT_WELER_ROLES_CONFIG,
  isWelerRolesEnabled,
  readWelerRolesConfig,
} from './settings.js';

// Types.
export type {
  Role,
  WorkerOutput,
  WorkerState,
  EvaluatorSeverity,
  EvaluatorDiagnostic,
  EvaluatorState,
  FailureHistoryEntry,
  CrossSkillPattern,
  PolicyUpdateProposal,
  EvolutionState,
  EvolutionExtensionPoint,
  EvolutionSnapshot,
  CapcomGateReason,
  CapcomGateRecord,
  CapcomGateResult,
  IsolationViolation,
} from './types.js';
export { WELER_ROLES_SCHEMA_VERSION, ROLE_DOMAINS } from './types.js';

// Role-isolation runtime.
export {
  DESIGNATED_FIELDS,
  RoleIsolationError,
  assertRoleWrite,
  makeRoleView,
  isDesignatedField,
} from './role-isolation.js';

// Worker.
export type { WorkerGenerateInput } from './worker.js';
export {
  workerGenerate,
  emptyWorkerState,
  resetWorkerCounter,
  WORKER_DISABLED_STATE,
} from './worker.js';

// Evaluator.
export {
  evaluatorRun,
  isCandidateBlocked,
  emptyEvaluatorState,
  EVALUATOR_DISABLED_STATE,
} from './evaluator.js';

// Evolution.
export {
  evolutionPropose,
  aggregatePatterns,
  emptyEvolutionState,
  EVOLUTION_DISABLED_STATE,
} from './evolution.js';

// CAPCOM HARD GATE.
export {
  emitCapcomGate,
  isCapcomAuthorized,
  isActivationTriggered,
  defaultCapcomMarkerPath,
  defaultTriggerMarkerPath,
  CAPCOM_GATE_DISABLED_RESULT,
} from './capcom-gate.js';
