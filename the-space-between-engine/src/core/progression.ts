/**
 * Progression Engine
 *
 * Immutable state management for learner progression through the 8
 * mathematical foundations. Every mutation returns a new state object.
 * Phase ordering is enforced: wonder -> see -> touch -> understand ->
 * connect -> create.
 */

import type {
  FoundationId,
  PhaseType,
  LearnerState,
  Creation,
  JournalEntry,
  UnitCircleMoment,
} from '@/types';
import { FOUNDATION_ORDER, PHASE_ORDER, generateId, nowISO } from '@/types';
import { getOutgoing } from '@/core/connections';

// ─── Internal helpers ─────────────────────────────────

function clone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

function phaseIndex(phase: PhaseType): number {
  return PHASE_ORDER.indexOf(phase);
}

function emptyCompletedPhases(): Record<FoundationId, PhaseType[]> {
  const rec: Partial<Record<FoundationId, PhaseType[]>> = {};
  for (const id of FOUNDATION_ORDER) {
    rec[id] = [];
  }
  return rec as Record<FoundationId, PhaseType[]>;
}

function emptyTimeSpent(): Record<FoundationId, number> {
  const rec: Partial<Record<FoundationId, number>> = {};
  for (const id of FOUNDATION_ORDER) {
    rec[id] = 0;
  }
  return rec as Record<FoundationId, number>;
}

// ─── Lifecycle ────────────────────────────────────────

export function createNewLearner(): LearnerState {
  const now = nowISO();
  return {
    currentFoundation: 'unit-circle',
    currentPhase: 'wonder',
    completedPhases: emptyCompletedPhases(),
    creations: [],
    journalEntries: [],
    unitCircleMoments: [],
    timeSpent: emptyTimeSpent(),
    bypasses: {},
    firstVisit: now,
    lastVisit: now,
    stateVersion: 1,
  };
}

export function loadState(serialized: string): LearnerState {
  const parsed = JSON.parse(serialized) as LearnerState;
  // Validate critical fields
  if (!parsed.currentFoundation || !parsed.currentPhase || !parsed.completedPhases) {
    throw new Error('Invalid learner state: missing required fields');
  }
  if (!FOUNDATION_ORDER.includes(parsed.currentFoundation)) {
    throw new Error(`Invalid foundation: ${parsed.currentFoundation}`);
  }
  if (!PHASE_ORDER.includes(parsed.currentPhase)) {
    throw new Error(`Invalid phase: ${parsed.currentPhase}`);
  }
  return parsed;
}

export function saveState(state: LearnerState): string {
  return JSON.stringify(state);
}

// ─── Navigation ───────────────────────────────────────

export function navigateToFoundation(state: LearnerState, id: FoundationId): LearnerState {
  if (!FOUNDATION_ORDER.includes(id)) {
    throw new Error(`Invalid foundation: ${id}`);
  }
  const next = clone(state);
  next.currentFoundation = id;
  // Set phase to the earliest incomplete phase for this foundation
  const completed = next.completedPhases[id] ?? [];
  const nextPhase = PHASE_ORDER.find((p) => !completed.includes(p)) ?? 'wonder';
  next.currentPhase = nextPhase;
  next.lastVisit = nowISO();
  next.stateVersion += 1;
  return next;
}

export function advancePhase(state: LearnerState): LearnerState {
  const idx = phaseIndex(state.currentPhase);
  if (idx >= PHASE_ORDER.length - 1) {
    // Already at last phase — move to next foundation if possible
    const fIdx = FOUNDATION_ORDER.indexOf(state.currentFoundation);
    if (fIdx < FOUNDATION_ORDER.length - 1) {
      return navigateToFoundation(state, FOUNDATION_ORDER[fIdx + 1]);
    }
    // At last phase of last foundation — no change
    return clone(state);
  }
  const next = clone(state);
  next.currentPhase = PHASE_ORDER[idx + 1];
  next.lastVisit = nowISO();
  next.stateVersion += 1;
  return next;
}

export function getCurrentPhase(state: LearnerState): { foundation: FoundationId; phase: PhaseType } {
  return { foundation: state.currentFoundation, phase: state.currentPhase };
}

// ─── Phase completion ─────────────────────────────────

/**
 * Mark a phase complete for a foundation. Enforces phase ordering:
 * cannot complete a phase unless all prior phases are already complete.
 */
export function markPhaseComplete(
  state: LearnerState,
  foundation: FoundationId,
  phase: PhaseType,
): LearnerState {
  const completed = state.completedPhases[foundation] ?? [];
  if (completed.includes(phase)) {
    // Already complete — no-op
    return clone(state);
  }

  // Enforce ordering: all prior phases must be complete
  const targetIdx = phaseIndex(phase);
  for (let i = 0; i < targetIdx; i++) {
    if (!completed.includes(PHASE_ORDER[i])) {
      throw new Error(
        `Cannot complete phase '${phase}' for '${foundation}': phase '${PHASE_ORDER[i]}' is not yet complete`,
      );
    }
  }

  const next = clone(state);
  next.completedPhases[foundation] = [...completed, phase];
  next.lastVisit = nowISO();
  next.stateVersion += 1;
  return next;
}

export function isPhaseComplete(
  state: LearnerState,
  foundation: FoundationId,
  phase: PhaseType,
): boolean {
  return (state.completedPhases[foundation] ?? []).includes(phase);
}

export function isFoundationComplete(state: LearnerState, foundation: FoundationId): boolean {
  const completed = state.completedPhases[foundation] ?? [];
  return PHASE_ORDER.every((p) => completed.includes(p));
}

/**
 * Overall completion percentage across all foundations and phases.
 * 8 foundations x 6 phases = 48 total phase slots.
 */
export function getCompletionPercentage(state: LearnerState): number {
  const total = FOUNDATION_ORDER.length * PHASE_ORDER.length; // 48
  let done = 0;
  for (const id of FOUNDATION_ORDER) {
    done += (state.completedPhases[id] ?? []).length;
  }
  return Math.round((done / total) * 100);
}

// ─── Creations & journal ──────────────────────────────

export function addCreation(
  state: LearnerState,
  creation: Omit<Creation, 'id' | 'createdAt'>,
): LearnerState {
  const next = clone(state);
  next.creations.push({
    ...creation,
    id: generateId(),
    createdAt: nowISO(),
  });
  next.lastVisit = nowISO();
  next.stateVersion += 1;
  return next;
}

export function addJournalEntry(
  state: LearnerState,
  entry: Omit<JournalEntry, 'id' | 'createdAt'>,
): LearnerState {
  const next = clone(state);
  next.journalEntries.push({
    ...entry,
    id: generateId(),
    createdAt: nowISO(),
  });
  next.lastVisit = nowISO();
  next.stateVersion += 1;
  return next;
}

export function recordUnitCircleMoment(
  state: LearnerState,
  foundations: FoundationId[],
  insight: string,
): LearnerState {
  const next = clone(state);
  next.unitCircleMoments.push({
    id: generateId(),
    foundations,
    insight,
    createdAt: nowISO(),
  });
  next.lastVisit = nowISO();
  next.stateVersion += 1;
  return next;
}

// ─── Time tracking ────────────────────────────────────

export function recordTimeSpent(
  state: LearnerState,
  foundation: FoundationId,
  ms: number,
): LearnerState {
  const next = clone(state);
  next.timeSpent[foundation] = (next.timeSpent[foundation] ?? 0) + ms;
  next.lastVisit = nowISO();
  next.stateVersion += 1;
  return next;
}

export function getTotalTimeSpent(state: LearnerState): number {
  let total = 0;
  for (const id of FOUNDATION_ORDER) {
    total += state.timeSpent[id] ?? 0;
  }
  return total;
}

// ─── Suggestions & resume ─────────────────────────────

/**
 * Suggest the next foundation to explore based on:
 * 1. Incomplete foundations with the highest incoming connection strength
 *    from completed foundations
 * 2. Sequential order as tiebreaker
 *
 * The `graph` parameter is an opaque type — we use getOutgoing internally
 * from the connections module, but accepting it as a parameter keeps the
 * API flexible for testing with custom graphs.
 */
export function suggestNextFoundation(
  state: LearnerState,
  _graph?: unknown,
): FoundationId {
  // Score each incomplete foundation by sum of connection strengths
  // from completed foundations
  const completedSet = new Set<FoundationId>(
    FOUNDATION_ORDER.filter((id) => isFoundationComplete(state, id)),
  );

  // If nothing is complete, suggest the current foundation
  if (completedSet.size === 0) {
    return state.currentFoundation;
  }

  // If everything is complete, return current
  if (completedSet.size === FOUNDATION_ORDER.length) {
    return state.currentFoundation;
  }

  let bestId: FoundationId = state.currentFoundation;
  let bestScore = -1;

  for (const id of FOUNDATION_ORDER) {
    if (completedSet.has(id)) continue;

    let score = 0;
    // Sum strength of connections FROM completed foundations TO this one
    for (const completedId of completedSet) {
      for (const edge of getOutgoing(completedId)) {
        if (edge.to === id) {
          score += edge.strength;
        }
      }
    }

    // Small sequential-order bonus to break ties
    const seqIdx = FOUNDATION_ORDER.indexOf(id);
    score += (FOUNDATION_ORDER.length - seqIdx) * 0.01;

    if (score > bestScore) {
      bestScore = score;
      bestId = id;
    }
  }

  return bestId;
}

/**
 * Determine where the learner should resume: their current foundation
 * and the earliest incomplete phase in that foundation.
 */
export function getResumePoint(state: LearnerState): { foundation: FoundationId; phase: PhaseType } {
  const completed = state.completedPhases[state.currentFoundation] ?? [];
  const nextPhase = PHASE_ORDER.find((p) => !completed.includes(p)) ?? state.currentPhase;
  return { foundation: state.currentFoundation, phase: nextPhase };
}
