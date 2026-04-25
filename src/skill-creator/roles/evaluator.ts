/**
 * HB-04 — Evaluator role.
 *
 * The Evaluator adversarially diagnoses Worker output against
 * failure-history. This is the load-bearing change: the legacy
 * 3-correction-min rule passively counted corrections; the Evaluator
 * actively searches for failure modes against the failure-history record.
 *
 * Evaluator reads Worker output via a designated, allow-listed view (see
 * {@link makeRoleView}); it cannot see Worker `internalNotes`.
 *
 * @module skill-creator/roles/evaluator
 */

import { assertRoleWrite, makeRoleView } from './role-isolation.js';
import { isWelerRolesEnabled } from './settings.js';
import type {
  EvaluatorDiagnostic,
  EvaluatorSeverity,
  EvaluatorState,
  FailureHistoryEntry,
  WorkerOutput,
  WorkerState,
} from './types.js';

/** Sentinel returned when the flag is off. */
export const EVALUATOR_DISABLED_STATE: EvaluatorState = Object.freeze({
  role: 'evaluator',
  diagnostics: Object.freeze([]) as ReadonlyArray<EvaluatorDiagnostic>,
});

/** Empty Evaluator state factory. */
export function emptyEvaluatorState(): EvaluatorState {
  return EVALUATOR_DISABLED_STATE;
}

/**
 * Adversarially diagnose a single Worker candidate against failure-history.
 *
 * Pure: takes inputs, returns a diagnostic (or null when no failure mode
 * matches). Returning null does NOT BLOCK; only matched failures BLOCK.
 */
function diagnoseCandidate(
  candidate: WorkerOutput,
  failureHistory: ReadonlyArray<FailureHistoryEntry>,
): EvaluatorDiagnostic | null {
  // The Evaluator is adversarial — it actively searches for matches in
  // failure-history. Matching strategy: payload keyword overlap with
  // failure summary, plus failureClass tag if exposed in payload.
  const summary = candidate.summary.toLowerCase();
  const payloadStr = JSON.stringify(candidate.payload).toLowerCase();
  const cited: string[] = [];
  let worstClass: string | null = null;
  let worstSeverity: EvaluatorSeverity = 'low';
  let rootCause = '';

  for (const entry of failureHistory) {
    const tag = entry.failureClass.toLowerCase();
    const sumWords = entry.summary.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length >= 4);
    const tagHit = summary.includes(tag) || payloadStr.includes(tag);
    const wordHit = sumWords.some((w) => summary.includes(w) || payloadStr.includes(w));
    if (tagHit || wordHit) {
      cited.push(entry.id);
      const sev: EvaluatorSeverity = tagHit ? 'high' : wordHit ? 'medium' : 'low';
      if (rankSeverity(sev) > rankSeverity(worstSeverity)) {
        worstSeverity = sev;
        worstClass = entry.failureClass;
        rootCause = entry.summary;
      } else if (worstClass === null) {
        worstClass = entry.failureClass;
        rootCause = entry.summary;
      }
    }
  }

  if (worstClass === null) return null;
  return Object.freeze({
    role: 'evaluator',
    candidateId: candidate.candidateId,
    failureClass: worstClass,
    severity: worstSeverity,
    rootCause,
    block: worstSeverity === 'high' || worstSeverity === 'medium',
    cited: Object.freeze([...cited]),
    producedAt: new Date().toISOString(),
  });
}

function rankSeverity(s: EvaluatorSeverity): number {
  return s === 'high' ? 3 : s === 'medium' ? 2 : 1;
}

/**
 * Run the Evaluator over a Worker state, returning a new EvaluatorState.
 *
 * The Worker state is consumed via {@link makeRoleView} — Evaluator only
 * sees designated fields; internal notes are stripped.
 */
export function evaluatorRun(
  state: EvaluatorState,
  workerState: WorkerState,
  failureHistory: ReadonlyArray<FailureHistoryEntry>,
  settingsPath?: string,
): EvaluatorState {
  if (!isWelerRolesEnabled(settingsPath)) {
    return EVALUATOR_DISABLED_STATE;
  }
  assertRoleWrite('evaluator', state.role, 'diagnostics');
  // Designated view: Evaluator MUST NOT touch internalNotes.
  const view = makeRoleView('worker', workerState as unknown as Record<string, unknown>);
  const candidates = (view as { candidates?: ReadonlyArray<WorkerOutput> }).candidates ?? [];
  const newDiags: EvaluatorDiagnostic[] = [];
  for (const c of candidates) {
    // Skip candidates already diagnosed.
    if (state.diagnostics.some((d) => d.candidateId === c.candidateId)) continue;
    const d = diagnoseCandidate(c, failureHistory);
    if (d !== null) newDiags.push(d);
  }
  return Object.freeze({
    role: 'evaluator',
    diagnostics: Object.freeze([...state.diagnostics, ...newDiags]),
  });
}

/** True iff a diagnostic exists that BLOCKs the named candidate. */
export function isCandidateBlocked(
  state: EvaluatorState,
  candidateId: string,
): boolean {
  return state.diagnostics.some((d) => d.candidateId === candidateId && d.block);
}
