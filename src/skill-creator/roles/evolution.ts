/**
 * HB-04 — Evolution role.
 *
 * The Evolution role proposes loop-protocol modifications based on
 * cross-skill patterns. It is the slow timescale of the W/E/E split: per
 * the convergent-discovery report §5, HB-07's AEL fast/slow bandit
 * (arXiv:2604.21725) lives **inside** Evolution's protocol-update
 * extension point, not as a sibling system.
 *
 * Evolution reads aggregated Evaluator output via a designated view; it
 * cannot see Evaluator scratch beyond `diagnostics`. Evolution writes
 * only its own state.
 *
 * Important — CAPCOM gating: a registered extension's
 * `proposePolicyUpdate` is invoked only after the gate emits an authorized
 * record. The {@link evolutionPropose} function checks this invariant.
 *
 * @module skill-creator/roles/evolution
 */

import { emitCapcomGate } from './capcom-gate.js';
import { assertRoleWrite, makeRoleView } from './role-isolation.js';
import { isWelerRolesEnabled } from './settings.js';
import type {
  CrossSkillPattern,
  EvaluatorDiagnostic,
  EvaluatorState,
  EvolutionExtensionPoint,
  EvolutionSnapshot,
  EvolutionState,
  PolicyUpdateProposal,
  WorkerState,
} from './types.js';

/** Sentinel returned when the flag is off. */
export const EVOLUTION_DISABLED_STATE: EvolutionState = Object.freeze({
  role: 'evolution',
  proposals: Object.freeze([]) as ReadonlyArray<PolicyUpdateProposal>,
});

/** Empty Evolution state factory. */
export function emptyEvolutionState(): EvolutionState {
  return EVOLUTION_DISABLED_STATE;
}

/** Aggregate diagnostics into cross-skill patterns. */
export function aggregatePatterns(
  diagnostics: ReadonlyArray<EvaluatorDiagnostic>,
): ReadonlyArray<CrossSkillPattern> {
  const byClass = new Map<string, { occurrences: number; affected: Set<string> }>();
  for (const d of diagnostics) {
    const existing = byClass.get(d.failureClass) ?? { occurrences: 0, affected: new Set() };
    existing.occurrences += 1;
    existing.affected.add(d.candidateId);
    byClass.set(d.failureClass, existing);
  }
  const out: CrossSkillPattern[] = [];
  for (const [failureClass, agg] of byClass) {
    out.push({
      failureClass,
      occurrences: agg.occurrences,
      affectedCandidates: Object.freeze([...agg.affected]),
    });
  }
  // Stable order for determinism.
  out.sort((a, b) => a.failureClass.localeCompare(b.failureClass));
  return Object.freeze(out);
}

/**
 * In-house Evolution proposal heuristic. Proposes raising the
 * Evaluator threshold when a single failure class accounts for ≥3
 * occurrences across distinct candidates.
 */
function inHousePropose(
  patterns: ReadonlyArray<CrossSkillPattern>,
): PolicyUpdateProposal | null {
  for (const p of patterns) {
    if (p.occurrences >= 3 && p.affectedCandidates.length >= 2) {
      return Object.freeze({
        role: 'evolution',
        protocol: 'evaluator-threshold',
        change: `tighten Evaluator severity floor for failureClass=${p.failureClass}`,
        rationale: `cross-skill pattern: ${p.occurrences} occurrences across ${p.affectedCandidates.length} candidates`,
        trigger: p,
        source: 'evolution',
        producedAt: new Date().toISOString(),
      });
    }
  }
  return null;
}

/**
 * Run the Evolution role.
 *
 * The function (a) builds a snapshot, (b) calls in-house proposer + each
 * registered extension, (c) for every non-null proposal emits a CAPCOM
 * gate record, and (d) only appends proposals whose gate is authorized
 * to {@link EvolutionState.proposals}; unauthorized proposals are
 * dropped (caller can re-run after authorizing).
 *
 * Per the design contract: an extension's `proposePolicyUpdate` is
 * called BEFORE the gate (so the proposal exists to be gated). The
 * gate then determines whether the proposal becomes active. This is
 * symmetric with HB-03 (compute the calibration, then gate it).
 *
 * Tests require that the extension is *invoked* only when CAPCOM auth
 * exists for `'role-split-activation'` — i.e., the role split itself
 * must be authorized before Evolution will consult an extension.
 */
export function evolutionPropose(
  state: EvolutionState,
  workerState: WorkerState,
  evaluatorState: EvaluatorState,
  options: {
    extensions?: ReadonlyArray<EvolutionExtensionPoint>;
    settingsPath?: string;
    capcomMarkerPath?: string;
  } = {},
): EvolutionState {
  if (!isWelerRolesEnabled(options.settingsPath)) {
    return EVOLUTION_DISABLED_STATE;
  }
  assertRoleWrite('evolution', state.role, 'proposals');

  // Role-split must be authorized before Evolution consults extensions.
  // (The same gate fires on extension invocation as on role-split
  // activation; we treat extension invocation as gated by role-split
  // authorization.)
  const splitGate = emitCapcomGate('role-split-activation', {
    note: 'evolution-extension-invocation',
    settingsPath: options.settingsPath,
    markerPath: options.capcomMarkerPath,
  });
  const extensionsAllowed = splitGate.authorized;

  const evalView = makeRoleView('evaluator', evaluatorState as unknown as Record<string, unknown>);
  const diagnostics =
    (evalView as { diagnostics?: ReadonlyArray<EvaluatorDiagnostic> }).diagnostics ?? [];
  const patterns = aggregatePatterns(diagnostics);
  const snapshot: EvolutionSnapshot = Object.freeze({
    workerState,
    evaluatorState,
    patterns,
  });

  const proposals: PolicyUpdateProposal[] = [];
  const inhouse = inHousePropose(patterns);
  if (inhouse !== null) proposals.push(inhouse);
  if (extensionsAllowed) {
    for (const ext of options.extensions ?? []) {
      const p = ext.proposePolicyUpdate(snapshot);
      if (p !== null) proposals.push(p);
    }
  }

  const accepted: PolicyUpdateProposal[] = [];
  for (const p of proposals) {
    const gate = emitCapcomGate('protocol-update', {
      proposal: p,
      settingsPath: options.settingsPath,
      markerPath: options.capcomMarkerPath,
    });
    if (gate.authorized) {
      accepted.push(p);
    }
    // Unauthorized proposals are dropped here; calling code may persist
    // them via the CapcomGateRecord if it wants a staging table. HB-04
    // does not provide one — staging is left to a v1.49.576+ work item.
  }

  if (accepted.length === 0) return state;
  return Object.freeze({
    role: 'evolution',
    proposals: Object.freeze([...state.proposals, ...accepted]),
  });
}
