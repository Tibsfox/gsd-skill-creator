// Progression Engine — Tracks learner state through the 8 foundations and 6 phases.
// All mutations return new state objects (immutable pattern).
// The engine does not manage its own persistence — it exposes serialize/deserialize.

import type {
  FoundationId,
  PhaseType,
  LearnerState,
  Creation,
  JournalEntry,
  UnitCircleMoment,
} from '../types/index';

import { PHASE_ORDER, FOUNDATION_ORDER } from '../types/index';
import type { ConnectionGraph } from './connections';

// ─── Helpers ────────────────────────────────────────────────

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function nowISO(): string {
  return new Date().toISOString();
}

function emptyCompletedPhases(): Record<FoundationId, PhaseType[]> {
  const record: Partial<Record<FoundationId, PhaseType[]>> = {};
  for (const id of FOUNDATION_ORDER) {
    record[id] = [];
  }
  return record as Record<FoundationId, PhaseType[]>;
}

function emptyTimeSpent(): Record<FoundationId, number> {
  const record: Partial<Record<FoundationId, number>> = {};
  for (const id of FOUNDATION_ORDER) {
    record[id] = 0;
  }
  return record as Record<FoundationId, number>;
}

function emptyBypasses(): Record<FoundationId, PhaseType[]> {
  const record: Partial<Record<FoundationId, PhaseType[]>> = {};
  for (const id of FOUNDATION_ORDER) {
    record[id] = [];
  }
  return record as Record<FoundationId, PhaseType[]>;
}

// ─── ProgressionEngine ──────────────────────────────────────

export class ProgressionEngine {

  // ── State Creation ──────────────────────────────────────

  createNewLearner(): LearnerState {
    const now = nowISO();
    return {
      currentFoundation: 'unit-circle',
      currentPhase: 'wonder',
      completedPhases: emptyCompletedPhases(),
      creations: [],
      journalEntries: [],
      unitCircleMoments: [],
      timeSpent: emptyTimeSpent(),
      bypasses: emptyBypasses(),
      firstVisit: now,
      lastVisit: now,
    };
  }

  // ── Navigation ──────────────────────────────────────────

  /**
   * Advance to the next phase within the current foundation.
   * Follows PHASE_ORDER: wonder -> see -> touch -> understand -> connect -> create.
   * If already at 'create', returns state unchanged.
   */
  advancePhase(state: LearnerState): LearnerState {
    const currentIndex = PHASE_ORDER.indexOf(state.currentPhase);
    if (currentIndex >= PHASE_ORDER.length - 1) {
      // Already at the last phase — no advancement
      return { ...state, lastVisit: nowISO() };
    }
    const nextPhase = PHASE_ORDER[currentIndex + 1]!;
    return {
      ...state,
      currentPhase: nextPhase,
      lastVisit: nowISO(),
    };
  }

  /**
   * Navigate to a different foundation. Resets the current phase to 'wonder'
   * unless the learner has already started this foundation, in which case
   * it resumes at the deepest incomplete phase.
   */
  navigateToFoundation(state: LearnerState, id: FoundationId): LearnerState {
    const completed = state.completedPhases[id] ?? [];
    let resumePhase: PhaseType = 'wonder';

    // Find the first incomplete phase
    for (const phase of PHASE_ORDER) {
      if (!completed.includes(phase)) {
        resumePhase = phase;
        break;
      }
    }

    // If all phases are complete, go to 'create' (the last phase)
    if (completed.length === PHASE_ORDER.length) {
      resumePhase = 'create';
    }

    return {
      ...state,
      currentFoundation: id,
      currentPhase: resumePhase,
      lastVisit: nowISO(),
    };
  }

  // ── Completion ──────────────────────────────────────────

  /**
   * Mark a specific phase as complete for a foundation.
   * Phases must be completed in order — cannot mark 'touch' complete
   * if 'see' is not yet complete.
   * Returns the state unchanged if the phase is already complete or
   * if prerequisites are not met.
   */
  markPhaseComplete(state: LearnerState, foundation: FoundationId, phase: PhaseType): LearnerState {
    const completed = state.completedPhases[foundation] ?? [];

    // Already complete
    if (completed.includes(phase)) {
      return state;
    }

    // Check phase ordering — all prior phases must be complete
    const phaseIndex = PHASE_ORDER.indexOf(phase);
    for (let i = 0; i < phaseIndex; i++) {
      if (!completed.includes(PHASE_ORDER[i]!)) {
        // Prerequisite phase not complete — return unchanged
        return state;
      }
    }

    const newCompleted = {
      ...state.completedPhases,
      [foundation]: [...completed, phase],
    };

    return {
      ...state,
      completedPhases: newCompleted,
      lastVisit: nowISO(),
    };
  }

  /**
   * Returns true if all 6 phases are complete for the given foundation.
   */
  isFoundationComplete(state: LearnerState, foundation: FoundationId): boolean {
    const completed = state.completedPhases[foundation] ?? [];
    return PHASE_ORDER.every(phase => completed.includes(phase));
  }

  /**
   * Returns completion percentage as 0-100.
   * Total phases = 8 foundations x 6 phases = 48.
   */
  getCompletionPercentage(state: LearnerState): number {
    let completedCount = 0;
    for (const id of FOUNDATION_ORDER) {
      const phases = state.completedPhases[id] ?? [];
      completedCount += phases.length;
    }
    const total = FOUNDATION_ORDER.length * PHASE_ORDER.length; // 48
    return (completedCount / total) * 100;
  }

  // ── Creations and Journal ───────────────────────────────

  addCreation(state: LearnerState, creation: Omit<Creation, 'id' | 'createdAt'>): LearnerState {
    const newCreation: Creation = {
      ...creation,
      id: generateId(),
      createdAt: nowISO(),
    };
    return {
      ...state,
      creations: [...state.creations, newCreation],
      lastVisit: nowISO(),
    };
  }

  addJournalEntry(state: LearnerState, entry: Omit<JournalEntry, 'id' | 'createdAt'>): LearnerState {
    const newEntry: JournalEntry = {
      ...entry,
      id: generateId(),
      createdAt: nowISO(),
    };
    return {
      ...state,
      journalEntries: [...state.journalEntries, newEntry],
      lastVisit: nowISO(),
    };
  }

  recordUnitCircleMoment(
    state: LearnerState,
    foundations: FoundationId[],
    insight: string
  ): LearnerState {
    const moment: UnitCircleMoment = {
      id: generateId(),
      foundations: [...foundations],
      insight,
      createdAt: nowISO(),
    };
    return {
      ...state,
      unitCircleMoments: [...state.unitCircleMoments, moment],
      lastVisit: nowISO(),
    };
  }

  // ── Resume ──────────────────────────────────────────────

  /**
   * Returns the point where the learner should resume:
   * current foundation + deepest incomplete phase.
   */
  getResumePoint(state: LearnerState): { foundation: FoundationId; phase: PhaseType } {
    const foundation = state.currentFoundation;
    const completed = state.completedPhases[foundation] ?? [];

    // Find first incomplete phase
    for (const phase of PHASE_ORDER) {
      if (!completed.includes(phase)) {
        return { foundation, phase };
      }
    }

    // All phases complete for current foundation — suggest next incomplete foundation
    for (const id of FOUNDATION_ORDER) {
      const phases = state.completedPhases[id] ?? [];
      if (phases.length < PHASE_ORDER.length) {
        for (const phase of PHASE_ORDER) {
          if (!phases.includes(phase)) {
            return { foundation: id, phase };
          }
        }
      }
    }

    // Everything complete — return current position
    return { foundation, phase: state.currentPhase };
  }

  // ── Suggestions ─────────────────────────────────────────

  /**
   * Suggest the next foundation based on connection graph and learner state.
   *
   * Algorithm:
   * 1. Exclude all fully-completed foundations.
   * 2. From remaining, score each candidate:
   *    score = connectionStrength * prerequisiteReadiness
   *    where connectionStrength = max strength of any edge from a completed foundation
   *          to this candidate (0 if no completed foundation connects to it),
   *    and prerequisiteReadiness = fraction of the candidate's incoming graph
   *          neighbors that are completed (1.0 if no incoming edges).
   * 3. Among tied scores, prefer lower foundation order (1 before 2).
   * 4. If no completed foundations exist, return the first incomplete foundation by order.
   * 5. Never returns a fully-completed foundation.
   */
  suggestNextFoundation(state: LearnerState, connectionGraph: ConnectionGraph): FoundationId {
    // Get completed foundations
    const completedFoundations = FOUNDATION_ORDER.filter(id =>
      this.isFoundationComplete(state, id)
    );

    // Get incomplete foundations
    const incompleteFoundations = FOUNDATION_ORDER.filter(id =>
      !this.isFoundationComplete(state, id)
    );

    // If everything is complete, return the first foundation (shouldn't happen in practice)
    if (incompleteFoundations.length === 0) {
      return FOUNDATION_ORDER[0]!;
    }

    // If no foundations are complete, return the first incomplete by order
    if (completedFoundations.length === 0) {
      return incompleteFoundations[0]!;
    }

    // Score each incomplete foundation
    const scored: { id: FoundationId; score: number; order: number }[] = [];

    for (const candidate of incompleteFoundations) {
      // connectionStrength: max strength of any edge from a completed foundation to candidate
      let maxStrength = 0;
      for (const completed of completedFoundations) {
        const conn = connectionGraph.getConnection(completed, candidate);
        if (conn && conn.strength > maxStrength) {
          maxStrength = conn.strength;
        }
      }

      // prerequisiteReadiness: fraction of candidate's incoming neighbors that are completed
      const incoming = connectionGraph.getIncoming(candidate);
      let prerequisiteReadiness = 1.0;
      if (incoming.length > 0) {
        const uniqueIncoming = [...new Set(incoming.map(c => c.from))];
        const completedIncoming = uniqueIncoming.filter(id => completedFoundations.includes(id));
        prerequisiteReadiness = completedIncoming.length / uniqueIncoming.length;
      }

      const score = maxStrength * prerequisiteReadiness;
      const order = FOUNDATION_ORDER.indexOf(candidate);
      scored.push({ id: candidate, score, order });
    }

    // Sort by score descending, then by order ascending for tie-breaking
    scored.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.order - b.order;
    });

    return scored[0]!.id;
  }

  // ── Serialization ───────────────────────────────────────

  serialize(state: LearnerState): string {
    return JSON.stringify(state);
  }

  deserialize(json: string): LearnerState {
    const parsed = JSON.parse(json) as LearnerState;

    // Ensure all foundation keys exist in completedPhases, timeSpent, bypasses
    for (const id of FOUNDATION_ORDER) {
      if (!parsed.completedPhases[id]) {
        parsed.completedPhases[id] = [];
      }
      if (parsed.timeSpent[id] === undefined) {
        parsed.timeSpent[id] = 0;
      }
      if (!parsed.bypasses[id]) {
        parsed.bypasses[id] = [];
      }
    }

    return parsed;
  }
}
